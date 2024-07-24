import fs from "fs/promises";
import { inject, injectable } from "inversify";
import path from "path";
import QRCode from "qrcode";
import { v4 } from "uuid";
import { config } from "../../../config";
import { ApiError } from "../../common";
import { UtilsService } from "../utils";
import { IWireguardClientDto, IWireguardConfig } from "./wireguard.types";

const {
  WG_PATH,
  WG_HOST,
  WG_PORT,
  WG_MTU,
  WG_DEFAULT_DNS,
  WG_DEFAULT_ADDRESS,
  WG_PERSISTENT_KEEPALIVE,
  WG_ALLOWED_IPS,
  WG_PRE_UP,
  WG_POST_UP,
  WG_PRE_DOWN,
  WG_POST_DOWN,
} = config;

@injectable()
export class WireguardService {
  constructor(@inject(UtilsService) private _utilsService: UtilsService) {}

  initialize = () => {
    this.getConfig()
      .then(() => this.start())
      .catch(err => {
        console.error(`Failure up wireguard with error - ${err.message}`);
      });
  };

  stop = () => this._utilsService.exec("wg-quick down wg0").then(() => true);

  start = async () => {
    const config = await this.getConfig();

    if (config) {
      await this._utilsService.exec("wg-quick up wg0").catch(err => {
        if (
          err &&
          err.message &&
          // eslint-disable-next-line quotes
          err.message.includes('Cannot find device "wg0"')
        ) {
          throw new ApiError(
            // eslint-disable-next-line quotes
            'WireGuard exited with the error: Cannot find device "wg0"\nThis usually means that your host\'s kernel does not support WireGuard!',
            500,
          );
        }

        throw new ApiError(err.message, 500);
      });

      return true;
    }

    return false;
  };

  getStatus = () =>
    this._utilsService
      .exec("wg show interfaces")
      .then(res => res || null)
      .catch(() => null);

  getConfig = async () => {
    if (!WG_HOST) {
      throw new ApiError("WG_HOST Environment Variable Not Set!", 500);
    }

    try {
      return JSON.parse(
        await fs.readFile(path.join(WG_PATH, "wg0.json"), "utf8"),
      ) as IWireguardConfig;
    } catch (e) {
      return this._initConfig();
    }
  };

  saveConfig = async (config: IWireguardConfig) => {
    await this._saveConfig(config);
    await this._syncConfig();
  };

  getClients = async () => {
    const config = await this.getConfig();
    const clients = Object.entries<IWireguardClientDto>(
      config.clients,
    ).map<IWireguardClientDto>(([clientId, client]) => ({
      id: clientId,
      name: client.name,
      enabled: client.enabled,
      address: client.address,
      publicKey: client.publicKey,
      createdAt: new Date(client.createdAt),
      updatedAt: new Date(client.updatedAt),
      allowedIPs: client.allowedIPs,

      persistentKeepalive: null,
      latestHandshakeAt: null,
      transferRx: null,
      transferTx: null,
    }));

    // Loop WireGuard status
    const dump = await this._utilsService.exec("wg show wg0 dump");

    dump
      .trim()
      .split("\n")
      .slice(1)
      .forEach(line => {
        const [
          publicKey,
          preSharedKey, // eslint-disable-line no-unused-vars
          endpoint, // eslint-disable-line no-unused-vars
          allowedIps, // eslint-disable-line no-unused-vars
          latestHandshakeAt,
          transferRx,
          transferTx,
          persistentKeepalive,
        ] = line.split("\t");

        const client = clients.find(client => client.publicKey === publicKey);

        if (!client) {
          return;
        }

        client.latestHandshakeAt =
          latestHandshakeAt === "0"
            ? null
            : new Date(Number(`${latestHandshakeAt}000`));
        client.transferRx = Number(transferRx);
        client.transferTx = Number(transferTx);
        client.persistentKeepalive = persistentKeepalive;
      });

    return clients;
  };

  getClient = async ({ clientId }: { clientId: string }) => {
    const config = await this.getConfig();
    const client = config.clients[clientId];

    if (!client) {
      throw new ApiError(`Client Not Found: ${clientId}`, 404);
    }

    const clientStatus = await this._utilsService.exec(
      `wg show wg0 dump | grep ${client.publicKey}`,
    );

    if (!clientStatus) {
      return client;
    }

    const [
      publicKey,
      preSharedKey, // eslint-disable-line no-unused-vars
      endpoint, // eslint-disable-line no-unused-vars
      allowedIps, // eslint-disable-line no-unused-vars
      latestHandshakeAt,
      transferRx,
      transferTx,
      persistentKeepalive,
    ] = clientStatus.split("\t");

    client.latestHandshakeAt =
      latestHandshakeAt === "0"
        ? null
        : new Date(Number(`${latestHandshakeAt}000`));
    client.transferRx = Number(transferRx);
    client.transferTx = Number(transferTx);
    client.persistentKeepalive = persistentKeepalive;

    return client;
  };

  getClientConfiguration = async (body: { clientId: string }) => {
    const config = await this.getConfig();
    const client = await this.getClient(body);

    return `
[Interface]
PrivateKey = ${client.privateKey}
Address = ${client.address}/24
${WG_DEFAULT_DNS ? `DNS = ${WG_DEFAULT_DNS}` : ""}
${WG_MTU ? `MTU = ${WG_MTU}` : ""}

[Peer]
PublicKey = ${config.server.publicKey}
PresharedKey = ${client.preSharedKey}
AllowedIPs = ${WG_ALLOWED_IPS}
PersistentKeepalive = ${WG_PERSISTENT_KEEPALIVE}
Endpoint = ${WG_HOST}:${WG_PORT}`;
  };

  getClientQRCodeSVG = async ({ clientId }: { clientId: string }) => {
    const config = await this.getClientConfiguration({ clientId });

    return QRCode.toString(config, {
      type: "svg",
      width: 512,
    });
  };

  createClient = async ({ name }: { name: string }) => {
    if (!name) {
      throw new Error("Missing: Name");
    }

    const config = await this.getConfig();

    const privateKey = await this._utilsService.exec("wg genkey");
    const publicKey = await this._utilsService.exec(
      `echo ${privateKey} | wg pubkey`,
    );
    const preSharedKey = await this._utilsService.exec("wg genpsk");

    // Calculate next IP
    let address: string | undefined = undefined;

    // eslint-disable-next-line no-plusplus
    for (let i = 2; i < 255; i++) {
      const client = Object.values(config.clients).find(
        client => client.address === WG_DEFAULT_ADDRESS.replace("x", `${i}`),
      );

      if (!client) {
        address = WG_DEFAULT_ADDRESS.replace("x", `${i}`);
        break;
      }
    }

    if (!address) {
      throw new Error("Maximum number of clients reached.");
    }

    // Create Client
    const id = v4();
    const client: IWireguardClientDto = {
      id,
      name,
      address,
      privateKey,
      publicKey,
      preSharedKey,

      createdAt: new Date(),
      updatedAt: new Date(),

      enabled: true,
    };

    config.clients[id] = client;

    await this.saveConfig(config);

    return client;
  };

  deleteClient = async ({ clientId }: { clientId: string }) => {
    const config = await this.getConfig();
    const client = config.clients[clientId];

    if (!client) {
      throw new ApiError(`Client Not Found: ${clientId}`, 404);
    }

    delete config.clients[clientId];
    await this.saveConfig(config);

    return clientId;
  };

  enableClient = async ({ clientId }) => {
    const config = await this.getConfig();
    const client = config.clients[clientId];

    if (!client) {
      throw new ApiError(`Client Not Found: ${clientId}`, 404);
    }

    client.enabled = true;
    client.updatedAt = new Date();

    await this.saveConfig(config);

    return client;
  };

  disableClient = async ({ clientId }) => {
    const config = await this.getConfig();
    const client = config.clients[clientId];

    if (!client) {
      throw new ApiError(`Client Not Found: ${clientId}`, 404);
    }

    client.enabled = false;
    client.updatedAt = new Date();

    await this.saveConfig(config);

    return client;
  };

  updateClient = async ({
    clientId,
    name,
    address,
  }: {
    clientId: string;
    name: string;
    address: string;
  }) => {
    const config = await this.getConfig();
    const client = config.clients[clientId];

    if (!client) {
      throw new ApiError(`Client Not Found: ${clientId}`, 404);
    }

    client.name = name ?? client.name;
    client.address = address ?? client.address;

    client.updatedAt = new Date();

    await this.saveConfig(config);

    return client;
  };

  private _initConfig = async () => {
    const privateKey = await this._utilsService.exec("wg genkey");
    const publicKey = await this._utilsService.exec(
      `echo ${privateKey} | wg pubkey`,
    );
    const address = WG_DEFAULT_ADDRESS.replace("x", "1");

    const config = {
      server: {
        privateKey,
        publicKey,
        address,
      },
      clients: {},
    };

    await this._saveConfig(config);

    return config;
  };

  private _saveConfig = async (config: IWireguardConfig) => {
    let result = `
# Note: Do not edit this file directly.
# Your changes will be overwritten!

# Server
[Interface]
PrivateKey = ${config.server.privateKey}
Address = ${config.server.address}/24
ListenPort = 51820
PreUp = ${WG_PRE_UP}
PostUp = ${WG_POST_UP}
PreDown = ${WG_PRE_DOWN}
PostDown = ${WG_POST_DOWN}
`;

    for (const [clientId, client] of Object.entries(config.clients)) {
      if (!client.enabled) {
        continue;
      }

      result += `

# Client: ${client.name} (${clientId})
[Peer]
PublicKey = ${client.publicKey}
PresharedKey = ${client.preSharedKey}
AllowedIPs = ${client.address}/32`;
    }

    if (!(await fs.readdir(WG_PATH).catch(() => null))) {
      await fs.mkdir(WG_PATH);
    }

    await fs.writeFile(
      path.join(WG_PATH, "wg0.json"),
      JSON.stringify(config, null, 2),
      {
        mode: 0o660,
      },
    );
    await fs.writeFile(path.join(WG_PATH, "wg0.conf"), result, {
      mode: 0o600,
    });
  };

  private _syncConfig = async () => {
    if (await this.getStatus()) {
      await this._utilsService.exec("wg syncconf wg0 <(wg-quick strip wg0)");
    }
  };
}
