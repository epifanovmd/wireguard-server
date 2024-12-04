import { ForbiddenException, NotFoundException } from "@force-dev/utils";
import { inject, injectable } from "inversify";
import { Includeable, WhereOptions } from "sequelize";
import { v4 } from "uuid";

import { config } from "../../../config";
import { IPAddressService } from "../ipaddress";
import { IProfileDto, Profile, ProfileService } from "../profile";
import { ERole } from "../role";
// не менять импорт, иначе не запустится сервер из-за циклической зависимости
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
    const servers = await WgServer.findAll({ attributes: ["id", "name"] });

    servers.map(async server => {
      await this.updateWireguardConfig(server.id);

      if (!(await this._wireguardService.getInterfaceStatus(server.name))) {
        await this._wireguardService.start(server.name).catch(() => null);
      }
    });
  }

  async startServer(profileId: string, id: string) {
    const server = await this.getWgServerByAttr({
      id,
      profileId,
    });

    await this._wireguardService.start(server.name);
  }

  async stopServer(profileId: string, id: string) {
    const server = await this.getWgServerByAttr({
      id,
      profileId,
    });

    await this._wireguardService.stop(server.name);
  }

  async getServerStatus(id: string) {
    const server = await this.getWgServerByAttr({
      id,
    });

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
    const privateKey = await this._wireguardService.getPrivateKey();
    const publicKey = await this._wireguardService.getPublicKey(privateKey);

    const maxPort = await WgServer.max<number | null, WgServer>("port");

    const wgServer = await WgServer.create({
      id,
      profileId,
      privateKey,
      publicKey,
      port: maxPort ? maxPort + 1 : config.WG_DEFAULT_INTERFACE_PORT,
      ...body,
      address: "",
    });

    const ipaddress = await this._ipAddressService.createServerIPAddress(id);

    await wgServer.set("address", ipaddress.address).save();

    await this._wireguardService.saveInterfaceConfig(
      wgServer,
      wgServer.clients,
    );
    await this._wireguardService.start(wgServer.name);

    return this.getWgServer(wgServer.id);
  };

  updateWireguardConfig = async (serverId: string) => {
    const server = await this.getWgServer(serverId);

    await this._wireguardService.saveInterfaceConfig(server, server.clients);
  };

  deleteWgServer = async (profile: IProfileDto, id: string) => {
    const wgServer = await this.getWgServer(id);

    if (
      profile.role.name !== ERole.ADMIN &&
      wgServer.profileId !== profile.id
    ) {
      throw new ForbiddenException("Невозможно удалить сервер");
    }

    try {
      await this._wireguardService.deleteConfig(wgServer.name);
      await this._wireguardService.stop(wgServer.name);
    } catch {
      /* empty */
    }

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
