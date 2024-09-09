import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from "sequelize";

import { sequelize } from "../../db/db";
import { ListResponse } from "../../dto/ListResponse";
import { IPAddress } from "../ipaddress";
import { IProfileDto, Profile } from "../profile";
import { IWgClientsDto, WgClient } from "../wgclient";

export interface ICreateWgServerRequest
  extends Omit<
    TWgServersCreateModel,
    "id" | "profileId" | "privateKey" | "publicKey" | "address" | "port"
  > {}

export interface IWgServerDto extends WgServerModel {
  clients?: IWgClientsDto[];
  profile?: IProfileDto;
}
export interface IWgServersListDto extends ListResponse<IWgServerDto[]> {}

export type WgServerModel = InferAttributes<WgServer>;

export type TWgServersCreateModel = InferCreationAttributes<
  WgServer,
  { omit: "createdAt" | "updatedAt" }
>;

export class WgServer extends Model<WgServerModel, TWgServersCreateModel> {
  declare id: string;

  declare profileId: string;

  declare name: string;
  declare port: number;
  declare privateKey: string;
  declare publicKey: string;
  declare address: string;

  // timestamps!
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

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

WgServer.sync({ force: false }).then(async () => {
  WgServer.hasMany(WgClient);
  WgServer.belongsTo(Profile);
  WgServer.hasOne(IPAddress);

  WgServer.beforeDestroy(async wgServer => {
    await WgClient.findAll({ where: { serverId: wgServer.id } }).then(clients =>
      // delete only instance for run beforeDestroy hook
      clients.forEach(client => client.destroy()),
    );

    await IPAddress.destroy({ where: { serverId: wgServer.id } });
  });
});
