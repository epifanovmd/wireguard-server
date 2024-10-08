import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";

import { sequelize } from "../../db";
import { ListResponse } from "../../dto/ListResponse";

export enum EPermissions {
  READ = "read",
  WRITE = "write",
  DELETE = "delete",
}

export interface IPermissionUpdateRequest
  extends Omit<TPermissionCreateModel, "id"> {}

export interface IPermissionDto extends Omit<PermissionModel, "passwordHash"> {}

export interface IPermissionListDto extends ListResponse<IPermissionDto[]> {}

export type PermissionModel = InferAttributes<Permission>;
export type TPermissionCreateModel = InferCreationAttributes<
  Permission,
  { omit: "createdAt" | "updatedAt" }
>;

export class Permission extends Model<PermissionModel, TPermissionCreateModel> {
  declare id: string;
  declare name: EPermissions;

  // timestamps!
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // associations
}

Permission.init(
  {
    id: {
      type: DataTypes.UUID(),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.ENUM(...Object.values(EPermissions)),
      allowNull: false,
    },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "permissions",
    name: {
      singular: "permission",
      plural: "permissions",
    },
  },
);
