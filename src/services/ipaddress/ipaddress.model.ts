import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from "sequelize";

import { sequelize } from "../../db/sequelize";

export interface IIPAddressDto extends TIPAddressModel {}

export type TIPAddressModel = InferAttributes<IPAddress>;

export type TIPAddressCreateModel = InferCreationAttributes<
  IPAddress,
  { omit: "createdAt" | "updatedAt" }
>;

export class IPAddress extends Model<TIPAddressModel, TIPAddressCreateModel> {
  declare id: string;

  declare a: number;
  declare b: number;
  declare c: number;
  declare d: number;

  declare clientId?: string;
  declare serverId?: string;

  declare free?: boolean;

  // timestamps!
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // associations
}

IPAddress.init(
  {
    id: {
      type: DataTypes.UUID(),
      primaryKey: true,
      allowNull: false,
    },
    clientId: {
      type: DataTypes.UUID(),
      allowNull: true,
    },
    serverId: {
      type: DataTypes.UUID(),
      allowNull: true,
    },
    a: {
      type: DataTypes.INTEGER(),
      allowNull: false,
    },
    b: {
      type: DataTypes.INTEGER(),
      allowNull: false,
    },
    c: {
      type: DataTypes.INTEGER(),
      allowNull: false,
    },
    d: {
      type: DataTypes.INTEGER(),
      allowNull: false,
    },
    free: {
      type: DataTypes.BOOLEAN(),
    },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "ipaddress",
    name: {
      singular: "ipaddress",
      plural: "ipaddresses",
    },
  },
);

IPAddress.sync({ force: false }).then(() => {});
