import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from "sequelize";

import { sequelize } from "../../db/sequelize";
import { ListResponse } from "../../dto/ListResponse";
import { IPAddress } from "../ipaddress";
import { IProfileDto, Profile } from "../profile";
import { IWgServerDto, WgServer } from "../wgserver";

export interface IWgClientCreateRequest
  extends Pick<
    TWgClientsCreateModel,
    "serverId" | "name" | "enabled" | "allowedIPs" | "persistentKeepalive"
  > {}

export interface IWgClientListDto extends ListResponse<IWgClientsDto[]> {}

export interface IWgClientUpdateRequest
  extends Partial<Omit<IWgClientCreateRequest, "serverId">> {}

export interface IWgClientsDto extends WgClientModel {
  profile: IProfileDto;
  server: IWgServerDto;
}

export type WgClientModel = InferAttributes<WgClient>;

export type TWgClientsCreateModel = InferCreationAttributes<
  WgClient,
  { omit: "createdAt" | "updatedAt" }
>;

export class WgClient extends Model<WgClientModel, TWgClientsCreateModel> {
  declare id: string;

  declare serverId: string;
  declare profileId: string;

  declare name: string;
  declare address: string;
  declare allowedIPs?: string;
  declare publicKey: string;
  declare privateKey: string;
  declare preSharedKey: string;
  declare transferRx?: number;
  declare transferTx?: number;
  declare latestHandshakeAt?: Date;
  declare persistentKeepalive?: number;

  declare enabled?: boolean;

  // timestamps!
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // associations
  declare profile: NonAttribute<Profile>;
  declare server: NonAttribute<WgServer>;
}

WgClient.init(
  {
    id: {
      type: DataTypes.UUID(),
      primaryKey: true,
      allowNull: false,
    },
    serverId: {
      type: DataTypes.UUID(),
      allowNull: false,
    },
    profileId: {
      type: DataTypes.UUID(),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    allowedIPs: {
      type: DataTypes.STRING(200),
    },
    publicKey: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    privateKey: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    preSharedKey: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    transferRx: {
      type: DataTypes.INTEGER(),
    },
    transferTx: {
      type: DataTypes.INTEGER(),
    },
    latestHandshakeAt: {
      type: DataTypes.DATE,
    },
    persistentKeepalive: {
      type: DataTypes.INTEGER(),
    },
    enabled: {
      type: DataTypes.BOOLEAN(),
    },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "clients",
    name: {
      singular: "client",
      plural: "clients",
    },
    indexes: [
      {
        unique: true,
        fields: ["name"],
      },
    ],
  },
);

WgClient.sync({ force: false }).then(() => {
  WgClient.belongsTo(WgServer);
  WgClient.belongsTo(Profile);

  WgClient.beforeDestroy(async client => {
    await IPAddress.destroy({ where: { clientId: client.id } });
  });
});
