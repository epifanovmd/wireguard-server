import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from "sequelize";

import { sequelize } from "../../db/db";
import { IPAddress } from "../ipaddress";
import { Profile } from "../profile";
import { IWgClientsDto, WgClient } from "../wgclient";

export interface ICreateWgServerRequest
  extends Omit<TWgServersCreateModel, "id" | "privateKey" | "address"> {}

export interface IWgServerDto extends WgServerModel {
  clients?: IWgClientsDto[];
}

export type WgServerModel = InferAttributes<WgServer>;

export type TWgServersCreateModel = InferCreationAttributes<
  WgServer,
  { omit: "createdAt" | "updatedAt" }
>;

export type TWgServersUpdateModel = Partial<TWgServersCreateModel>;

export class WgServer extends Model<WgServerModel, TWgServersCreateModel> {
  declare id: string;

  declare profileId: string;

  declare name: string;
  declare privateKey: string;
  declare address: string;

  // timestamps!
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // associations
  declare clients?: NonAttribute<WgClient[]>;
  declare profile: NonAttribute<Profile[]>;
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
    },
    name: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },
    privateKey: {
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
    modelName: "wgservers",
    name: {
      singular: "wgserver",
      plural: "wgservers",
    },
    indexes: [
      {
        unique: true,
        fields: ["name"],
      },
    ],
  },
);

WgServer.sync({ force: false }).then(() => {
  WgServer.hasMany(WgClient, {
    foreignKey: "serverId",
    as: "clients",
  });
  WgServer.hasOne(Profile, {
    sourceKey: "profileId",
    foreignKey: "id",
  });
  WgServer.hasOne(IPAddress, {
    foreignKey: "serverId",
  });
});
