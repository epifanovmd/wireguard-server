import fs from "fs/promises";
import { inject, injectable } from "inversify";
import path from "path";

import { config } from "../../../config";
import { ApiError } from "../../common";
import { UtilsService } from "../utils";
import { IWgServerDto } from "../wgserver";
import {
  getWireguardPeersConfig,
  getWireguardSeverBlockConfig,
} from "./wireguard.constants";
import { IWireguardPeerStatus } from "./wireguard.types";

const { WG_PATH } = config;

@injectable()
export class WireguardService {
  constructor(@inject(UtilsService) private _utilsService: UtilsService) {}

  start = async (interfaceName: string) => {
    await this._utilsService.exec(`wg-quick up ${interfaceName}`).catch(err => {
      if (
        err &&
        err.message &&
        err.message.includes(`Cannot find device "${interfaceName}"`)
      ) {
        throw new ApiError(
          `WireGuard exited with the error: Cannot find device "${interfaceName}" This usually means that your host's kernel does not support WireGuard!`,
          500,
        );
      }

      throw new ApiError(err.message, 500);
    });
  };

  stop = (interfaceName: string) =>
    this._utilsService.exec(`wg-quick down ${interfaceName}`).then(() => true);

  getInterfaceStatus = (name: string) =>
    this._utilsService
      .exec(`wg show ${name}`)
      .then(res => res || null)
      .catch(() => null);

  saveInterfaceConfig = async (
    wgServer: IWgServerDto,
    clients: IWgServerDto["clients"],
  ) => {
    await this._saveInterface(wgServer, clients);
    await this._syncInterface(wgServer.name);
  };

  getStatuses = async (interfaceName: string) => {
    const dump = await this._utilsService.exec(`wg show ${interfaceName} dump`);

    return dump
      .trim()
      .split("\n")
      .slice(1)
      .reduce<Record<string, IWireguardPeerStatus>>((acc, line) => {
        const [
          publicKey,
          preSharedKey,
          endpoint,
          allowedIps,
          latestHandshakeAt,
          transferRx,
          transferTx,
          persistentKeepalive,
        ] = line.split("\t");

        acc[publicKey] = {
          allowedIps,
          latestHandshakeAt:
            latestHandshakeAt === "0"
              ? undefined
              : new Date(Number(`${latestHandshakeAt}000`)),
          transferRx: Number(transferRx),
          transferTx: Number(transferTx),
          persistentKeepalive:
            persistentKeepalive === "off" ? 0 : Number(persistentKeepalive),
        };

        return acc;
      }, {});
  };

  getStatus = async (
    interfaceName: string,
    publicKey: string,
  ): Promise<IWireguardPeerStatus | null> => {
    const dump = await this._utilsService.exec(
      `wg show ${interfaceName} dump | grep ${publicKey}`,
    );

    const line = dump.trim().split("\n")[0];

    if (line) {
      const [
        _publicKey,
        _preSharedKey,
        _endpoint,
        allowedIps,
        latestHandshakeAt,
        transferRx,
        transferTx,
        persistentKeepalive,
      ] = line.split("\t");

      return {
        allowedIps,
        latestHandshakeAt:
          latestHandshakeAt === "0"
            ? undefined
            : new Date(Number(`${latestHandshakeAt}000`)),
        transferRx: Number(transferRx),
        transferTx: Number(transferTx),
        persistentKeepalive:
          persistentKeepalive === "off" ? 0 : Number(persistentKeepalive),
      };
    }

    return null;
  };

  getPrivateKey = () => {
    return this._utilsService.exec("wg genkey");
  };

  getPublicKey = (privateKey: string) => {
    return this._utilsService.exec(`echo ${privateKey} | wg pubkey`);
  };

  getPreSharedKey = () => {
    return this._utilsService.exec("wg genpsk");
  };

  deleteConfig = (interfaceName: string) => {
    return fs.rm(path.join(WG_PATH, `${interfaceName}.conf`)).catch(() => {});
  };

  private _saveInterface = async (
    server: IWgServerDto,
    clients: IWgServerDto["clients"] = [],
  ) => {
    const result = clients.reduce<string>((acc, client) => {
      if (client.enabled === false) {
        return acc;
      } else {
        return (acc += getWireguardPeersConfig(client));
      }
    }, getWireguardSeverBlockConfig(server));

    if (!(await fs.readdir(WG_PATH).catch(() => null))) {
      await fs.mkdir(WG_PATH);
    }

    await fs.writeFile(path.join(WG_PATH, `${server.name}.conf`), result, {
      mode: 0o600,
    });
  };

  private _syncInterface = async (name: string) => {
    if (await this.getInterfaceStatus(name)) {
      await this._utilsService.exec(
        `wg syncconf ${name} <(wg-quick strip ${name})`,
      );
    }
  };
}
