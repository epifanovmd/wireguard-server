import { inject, injectable } from "inversify";
import { Includeable, WhereOptions } from "sequelize";
import { v4 } from "uuid";

import { config } from "../../../config";
import { ForbiddenException, NotFoundException } from "../../common";
import { IPAddressService } from "../ipaddress";
import { Profile, ProfileService } from "../profile";
import { WgClient } from "../wgclient/wgclient.model";
import { WireguardService } from "../wireguard";
import {
  ICreateWgServerRequest,
  WgServer,
  WgServerModel,
} from "./wgserver.model";

@injectable()
export class WgServerService {
  constructor(
    @inject(IPAddressService) private _ipAddressService: IPAddressService,
    @inject(WireguardService) private _wireguardService: WireguardService,
  ) {}

  async init() {
    const servers = await WgServer.findAll({ attributes: ["name"] });

    servers.map(async server => {
      if (!(await this._wireguardService.getInterfaceStatus(server.name))) {
        await this._wireguardService.start(server.name).catch(() => null);
      }
    });
  }

  async startServer(profileId: string, serverId: string) {
    const server = await this.getWgServerByAttr({ profileId, serverId });

    await this._wireguardService.start(server.name);
  }

  async stopServer(profileId: string, serverId: string) {
    const server = await this.getWgServerByAttr({ profileId, serverId });

    await this._wireguardService.stop(server.name);
  }

  async getServerStatus(profileId: string, serverId: string) {
    const server = await this.getWgServerByAttr({ profileId, serverId });

    return this._wireguardService.getInterfaceStatus(server.name);
  }

  getWgServers = (offset?: number, limit?: number) =>
    WgServer.findAll({
      limit,
      offset,
      attributes: WgServerService.wgServerAttributes,
      order: [["createdAt", "DESC"]],
      include: WgServerService.include,
    });

  getWgServerByAttr = (where: WhereOptions) =>
    WgServer.findOne({
      where,
      include: WgServerService.include,
    }).then(result => {
      if (result === null) {
        return Promise.reject(
          new NotFoundException("Сервер wireguard не найден"),
        );
      }

      return result;
    });

  getWgServer = (id: string) =>
    WgServer.findByPk(id, {
      attributes: WgServerService.wgServerAttributes,
      include: WgServerService.include,
    }).then(result => {
      if (result === null) {
        return Promise.reject(
          new NotFoundException("Сервер wireguard не найден"),
        );
      }

      return result;
    });

  createWgServer = async (profileId: string, body: ICreateWgServerRequest) => {
    const server = await this.getWgServerByAttr({ ...body }).catch(() => null);

    if (server) {
      return server;
    }
    const id = v4();
    const ipaddress = await this._ipAddressService.createServerIPAddress(id);
    const privateKey = await this._wireguardService.getPrivateKey();
    const publicKey = await this._wireguardService.getPublicKey(privateKey);

    const maxPort = await WgServer.max<number | null, WgServer>("port");

    return WgServer.create({
      id,
      profileId,
      privateKey,
      publicKey,
      port: maxPort ? maxPort + 1 : config.WG_DEFAULT_INTERFACE_PORT,
      ...body,
      address: this._ipAddressService.formatIp(
        ipaddress.a,
        ipaddress.b,
        ipaddress.c,
        ipaddress.d,
      ),
    }).then(async result => {
      await this._wireguardService.saveInterfaceConfig(result, result.clients);
      await this._wireguardService.start(result.name);

      return this.getWgServer(result.id);
    });
  };

  updateWireguardConfig = async (serverId: string) => {
    const server = await this.getWgServer(serverId);

    await this._wireguardService.saveInterfaceConfig(server, server.clients);
  };

  deleteWgServer = async (profileId: string, id: string) => {
    const wgServer = await this.getWgServer(id);

    await this._wireguardService.stop(wgServer.name);

    if (wgServer.profileId !== profileId) {
      throw new ForbiddenException("Невозможно удалить сервер");
    }

    await this._wireguardService.deleteConfig(wgServer.name);

    // delete only instance for run beforeDestroy hook
    return wgServer.destroy().then(async () => id);
  };

  static get wgServerAttributes(): (keyof WgServerModel)[] | undefined {
    return undefined;
  }

  static get include(): Includeable[] {
    return [
      {
        model: WgClient,
      },
      {
        model: Profile,
        attributes: ProfileService.profileAttributes,
        required: true,
      },
    ];
  }
}
