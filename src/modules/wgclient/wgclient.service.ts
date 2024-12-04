import { ForbiddenException, NotFoundException } from "@force-dev/utils";
import { inject, injectable } from "inversify";
import { Includeable, WhereOptions } from "sequelize";
import { v4 } from "uuid";

import { IPAddressService } from "../ipaddress";
import { IProfileDto, Profile, ProfileService } from "../profile";
import { ERole } from "../role";
// не менять импорт, иначе не запустится сервер из-за циклической зависимости
import { WgServer } from "../wgserver/wgserver.model";
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
    @inject(WireguardService) private _wireguardService: WireguardService,
  ) {}

  getWgClients = async (
    profile: IProfileDto,
    serverId: string,
    offset?: number,
    limit?: number,
  ) => {
    const isAdmin = profile.role.name === ERole.ADMIN;

    return WgClient.findAll({
      limit,
      offset,
      where: isAdmin ? { serverId } : { profileId: profile.id, serverId },
      attributes: WgClientService.wgClientAttributes,
      order: [["createdAt", "DESC"]],
      include: WgClientService.include,
    });
  };

  getWgClientsByAttr = (where: WhereOptions) =>
    WgClient.findAll({
      where,
      include: WgClientService.include,
    });

  getWgClientByAttr = (where: WhereOptions) =>
    WgClient.findOne({
      where,
      include: WgClientService.include,
    }).then(result => {
      if (result === null) {
        return Promise.reject(
          new NotFoundException("Клиент wireguard не найден"),
        );
      }

      return result;
    });

  getWgClient = (id: string) =>
    WgClient.findByPk(id, {
      attributes: WgClientService.wgClientAttributes,
      include: WgClientService.include,
    }).then(result => {
      if (result === null) {
        return Promise.reject(
          new NotFoundException("Клиент wireguard не найден"),
        );
      }

      return result;
    });

  getWgClientConfiguration = async (profile: IProfileDto, id: string) => {
    const client = await this.getWgClientByAttr({
      id,
    });

    if (profile.role.name !== ERole.ADMIN && client.profileId !== profile.id) {
      throw new ForbiddenException(
        "Невозможно получить конфигурацию данного клиента",
      );
    }

    return getClientConfig(client);
  };

  createWgClient = async (profileId: string, body: IWgClientCreateRequest) => {
    const client = await this.getWgClientByAttr({ profileId, ...body }).catch(
      () => null,
    );

    if (client) {
      return client;
    }

    const id = v4();
    const server = await WgServer.findByPk(body.serverId);

    if (server) {
      const privateKey = await this._wireguardService.getPrivateKey();
      const publicKey = await this._wireguardService.getPublicKey(privateKey);
      const preSharedKey = await this._wireguardService.getPreSharedKey();

      const wgClient = await WgClient.create({
        id,
        profileId,
        ...body,
        privateKey,
        publicKey,
        preSharedKey,
        address: "",
      });

      const ipaddress = await this._ipAddressService.createClientIPAddress(
        id,
        server.address,
      );

      const address = this._ipAddressService.formatIp(
        ipaddress.a,
        ipaddress.b,
        ipaddress.c,
        ipaddress.d,
      );

      await wgClient.set("address", address).save();

      const client = await this.getWgClient(wgClient.id);

      const clients = await this.getWgClientsByAttr({
        serverId: client.server.id,
      });

      await this._wireguardService.saveInterfaceConfig(client.server, clients);

      return wgClient;
    } else {
      throw new NotFoundException("Сервер wireguard не найден");
    }
  };

  updateWgClient = async (
    profile: IProfileDto,
    id: string,
    body: IWgClientUpdateRequest,
  ) => {
    const client = await this.getWgClient(id);

    if (profile.role.name !== ERole.ADMIN && client.profileId !== profile.id) {
      throw new ForbiddenException("Невозможно обновить клиента");
    }

    return client.update(body).then(async () => {
      const clients = await this.getWgClientsByAttr({
        serverId: client.server.id,
      });

      await this._wireguardService.saveInterfaceConfig(client.server, clients);

      return client;
    });
  };

  deleteWgClient = async (profile: IProfileDto, id: string) => {
    const client = await this.getWgClient(id);

    if (profile.role.name !== ERole.ADMIN && client.profileId !== profile.id) {
      throw new ForbiddenException("Невозможно удалить клиента");
    }

    return client.destroy().then(async () => {
      const clients = await this.getWgClientsByAttr({
        serverId: client.server.id,
      });

      await this._wireguardService.saveInterfaceConfig(client.server, clients);

      return client.id;
    });
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
