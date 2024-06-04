import fs from "fs/promises";
import path from "path";
import QRCode from "qrcode";
import { v4 } from "uuid";
import { config } from "../../../config";
import { ApiError } from "../../common";
import { Util } from "../util";
import { WireguardClient, WireguardConfig } from "./wireguard.types";

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

let HOST: string = WG_HOST || "";

Util.exec("hostname -I | grep -E -o '^\\S*'").then(host => {
  console.log("host", host);
  if (host && HOST !== host) {
    HOST = host;
  }
});

export class WireguardService {
  downVpn = () =>
    Util.exec("wg-quick down wg0")
      .then(() => "success")
      .catch(() => null);

  upVpn = () => this.getConfig();

  getConfig = async () => {
    if (!HOST) {
      throw new Error("WG_HOST Environment Variable Not Set!");
    }

    let config: WireguardConfig;

    try {
      config = JSON.parse(
        await fs.readFile(path.join(WG_PATH, "wg0.json"), "utf8"),
      );
    } catch (err) {
      const privateKey = await Util.exec("wg genkey");
      const publicKey = await Util.exec(`echo ${privateKey} | wg pubkey`, {
        log: "echo ***hidden*** | wg pubkey",
      });
      const address = WG_DEFAULT_ADDRESS.replace("x", "1");

      config = {
        server: {
          privateKey,
          publicKey,
          address,
        },
        clients: {},
      };
    }

    await this.__saveConfig(config);
    await Util.exec("wg-quick down wg0").catch(() => null);
    await Util.exec("wg-quick up wg0").catch(err => {
      if (
        err &&
        err.message &&
        // eslint-disable-next-line quotes
        err.message.includes('Cannot find device "wg0"')
      ) {
        throw new Error(
          // eslint-disable-next-line quotes
          'WireGuard exited with the error: Cannot find device "wg0"\nThis usually means that your host\'s kernel does not support WireGuard!',
        );
      }

      throw err;
    });
    await this.__syncConfig();

    return config;
  };

  saveConfig = async () => {
    const config = await this.getConfig();

    await this.__saveConfig(config);
    await this.__syncConfig();
  };

  getClients = async () => {
    const config = await this.getConfig();
    const clients = Object.entries<WireguardClient>(
      config.clients,
    ).map<WireguardClient>(([clientId, client]) => ({
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
    const dump = await Util.exec("wg show wg0 dump", {
      log: false,
    });

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

    const clientStatus = await Util.exec(
      `wg show wg0 dump | grep ${client.publicKey}`,
      {
        log: false,
      },
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
Endpoint = ${HOST}:${WG_PORT}`;
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

    const privateKey = await Util.exec("wg genkey");
    const publicKey = await Util.exec(`echo ${privateKey} | wg pubkey`);
    const preSharedKey = await Util.exec("wg genpsk");

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
    const client: WireguardClient = {
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

    await this.saveConfig();

    return client;
  };

  deleteClient = async ({ clientId }: { clientId: string }) => {
    const config = await this.getConfig();

    if (config.clients[clientId]) {
      delete config.clients[clientId];
      await this.saveConfig();
    }
  };

  enableClient = async ({ clientId }) => {
    const client = await this.getClient({ clientId });

    client.enabled = true;
    client.updatedAt = new Date();

    await this.saveConfig();
  };

  disableClient = async ({ clientId }) => {
    const client = await this.getClient({ clientId });

    client.enabled = false;
    client.updatedAt = new Date();

    await this.saveConfig();
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
    const client = await this.getClient({ clientId });

    client.name = name ?? client.name;
    client.address = address ?? client.address;

    client.updatedAt = new Date();

    await this.saveConfig();
  };

  private __saveConfig = async (config: WireguardConfig) => {
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

  private __syncConfig = async () => {
    await Util.exec("wg syncconf wg0 <(wg-quick strip wg0)");
  };
}
