import { inject, injectable } from "inversify";
import { Includeable, WhereOptions } from "sequelize";
import { v4 } from "uuid";

import { ApiError } from "../../common";
import { IPAddressService } from "../ipaddress";
import { Profile, ProfileService } from "../profile";
import { WgClient } from "../wgclient";
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

  getWgServers = (profileId: string, offset?: number, limit?: number) =>
    WgServer.findAll({
      limit,
      offset,
      where: { profileId },
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
        return Promise.reject(new ApiError("Сервер wireguard не найден", 404));
      }

      return result;
    });

  getWgServer = (id: string) =>
    WgServer.findByPk(id, {
      attributes: WgServerService.wgServerAttributes,
      include: WgServerService.include,
    }).then(result => {
      if (result === null) {
        return Promise.reject(new ApiError("Сервер wireguard не найден", 404));
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

    return WgServer.create({
      id,
      profileId,
      privateKey,
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

    if (wgServer.profileId !== profileId) {
      throw new ApiError("Невозможно удалить сервер", 403);
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
