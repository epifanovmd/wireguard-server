import { inject, injectable } from "inversify";
import QRCode from "qrcode";
import { Includeable, WhereOptions } from "sequelize";
import { v4 } from "uuid";

import { ApiError } from "../../common";
import { IPAddressService } from "../ipaddress";
import { Profile, ProfileService } from "../profile";
import { ICreateWgServerRequest, WgServer, WgServerService } from "../wgserver";
import { WireguardService } from "../wireguard";
import { getClientConfig } from "./wgclient.constants";
import {
  IWgClientCreateRequest,
  IWgClientUpdateRequest,
  WgClient,
  WgClientModel,
} from "./wgclient.model";

@injectable()
export class WgClientService {
  constructor(
    @inject(IPAddressService) private _ipAddressService: IPAddressService,
    @inject(WgServerService) private _wgServerService: WgServerService,
    @inject(WireguardService) private _wireguardService: WireguardService,
  ) {}

  createWgServer = async (body: ICreateWgServerRequest) => {
    return this._wgServerService.createWgServer(body);
  };

  deleteWgServer = async (id: string) => {
    const server = await this._wgServerService.getWgServer(id);

    await this.deleteWgClientFromServer(id);

    return this._wgServerService.deleteWgServer(id).then(async res => {
      await this._wireguardService.deleteConfig(server.name);

      return res;
    });
  };

  getWgClients = (offset?: number, limit?: number) =>
    WgClient.findAll({
      limit,
      offset,
      attributes: WgClientService.wgClientAttributes,
      order: [["createdAt", "DESC"]],
      include: WgClientService.include,
    });

  getWgClientByAttr = (where: WhereOptions) =>
    WgClient.findOne({
      where,
      include: WgClientService.include,
    }).then(result => {
      if (result === null) {
        return Promise.reject(new ApiError("Сервер wireguard не найден", 404));
      }

      return result;
    });

  getWgClient = (id: string) =>
    WgClient.findByPk(id, {
      attributes: WgClientService.wgClientAttributes,
      include: WgClientService.include,
    }).then(result => {
      if (result === null) {
        return Promise.reject(new ApiError("Сервер wireguard не найден", 404));
      }

      return result;
    });

  getWgClientConfiguration = async (id: string) => {
    return getClientConfig(await this.getWgClient(id));
  };

  getWgClientQRCodeSVG = async (id: string) => {
    const config = await this.getWgClientConfiguration(id);

    return QRCode.toString(config, {
      type: "svg",
      width: 128,
    });
  };

  createWgClient = async (profileId: string, body: IWgClientCreateRequest) => {
    const client = await this.getWgClientByAttr({ name: body.name }).catch(
      () => null,
    );

    if (client) {
      return client;
    }

    const id = v4();
    const server = await this._wgServerService.getWgServer(body.serverId);
    const ipaddress = await this._ipAddressService.createClientIPAddress(
      id,
      server.address,
    );

    const privateKey = await this._wireguardService.getPrivateKey();
    const publicKey = await this._wireguardService.getPublicKey(privateKey);
    const preSharedKey = await this._wireguardService.getPreSharedKey();

    return WgClient.create({
      id,
      profileId,
      ...body,
      privateKey,
      preSharedKey,
      publicKey,
      address: this._ipAddressService.formatIp(
        ipaddress.a,
        ipaddress.b,
        ipaddress.c,
        ipaddress.d,
      ),
    }).then(result => {
      this._wgServerService.updateWireguardConfig(result.serverId);

      return this.getWgClient(result.id);
    });
  };

  updateWgClient = (id: string, body: IWgClientUpdateRequest) =>
    WgClient.update(body, { where: { id } }).then(async () => {
      const client = await this.getWgClient(id);

      await this._wgServerService.updateWireguardConfig(client.serverId);

      return client;
    });

  deleteWgClient = async (id: string) => {
    const client = await this.getWgClient(id);

    return WgClient.destroy({ where: { id: client.id } }).then(async value => {
      await this._ipAddressService.deleteIPAddressForClient(client.id);
      await this._wgServerService.updateWireguardConfig(client.serverId);

      return value;
    });
  };

  deleteWgClientFromServer = async (serverId: string) => {
    const clients = await WgClient.findAll({ where: { serverId } });

    return Promise.all(clients.map(client => this.deleteWgClient(client.id)));
  };

  static get wgClientAttributes(): (keyof WgClientModel)[] | undefined {
    return undefined;
  }

  static get include(): Includeable[] {
    return [
      {
        model: WgServer,
        required: true,
      },
      {
        model: Profile,
        attributes: ProfileService.profileAttributes,
        required: true,
      },
    ];
  }
}
