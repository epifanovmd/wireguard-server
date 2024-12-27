import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from "sequelize";

import { sequelize } from "../../db";
import { ListResponse } from "../../dto/ListResponse";
import { IPAddress } from "../ipaddress/ipaddress.model";
import { IProfileDto, Profile } from "../profile/profile.model";
import { IWgClientsDto, WgClient } from "../wgclient/wgclient.model";

export interface ICreateWgServerRequest
  extends Omit<
    TWgServerCreateModel,
    "id" | "profileId" | "privateKey" | "publicKey" | "address" | "port"
  > {}

export interface IWgServerDto extends WgServerModel {
  clients?: IWgClientsDto[];
  profile?: IProfileDto;
}
export interface IWgServersListDto extends ListResponse<IWgServerDto[]> {}

export type WgServerModel = InferAttributes<WgServer>;

export type TWgServerCreateModel = InferCreationAttributes<
  WgServer,
  { omit: "createdAt" | "updatedAt" }
>;

export class WgServer extends Model<WgServerModel, TWgServerCreateModel> {
  declare id: string;

  declare profileId: string;

  declare name: string;
  declare port: number;
  declare privateKey: string;
  declare publicKey: string;
  declare address: string;

  // timestamps!
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // associations
  declare clients: NonAttribute<WgClient[]>;
  declare profile: NonAttribute<Profile>;
  declare ipaddress: NonAttribute<IPAddress>;
}

WgServer.init(
  {
    id: {
      type: DataTypes.UUID(),
      primaryKey: true,
      allowNull: false,
    },
    profileId: {
      type: DataTypes.UUID(),
      allowNull: false,
      references: {
        model: Profile,
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },
    port: {
      type: DataTypes.INTEGER(),
      allowNull: false,
    },
    privateKey: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    publicKey: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(19),
      allowNull: true,
    },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "servers",
    name: {
      singular: "server",
      plural: "servers",
    },
    indexes: [
      {
        unique: true,
        fields: ["name"],
      },
    ],
  },
);
