import {
  BelongsToManyAddAssociationsMixin,
  BelongsToManySetAssociationsMixin,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from "sequelize";

import { sequelize } from "../../db";
import { ListResponse } from "../../dto/ListResponse";
import { IPermissionDto, Permission } from "../permission/permission.model";

export enum ERole {
  ADMIN = "admin",
  USER = "user",
  GUEST = "guest",
}

export interface IRoleUpdateRequest extends Omit<TRoleCreateModel, "id"> {}

export interface IRoleDto extends RoleModel {
  permissions: IPermissionDto[];
}

export interface IRoleListDto extends ListResponse<IRoleDto[]> {}

export type RoleModel = InferAttributes<Role>;
export type TRoleCreateModel = InferCreationAttributes<
  Role,
  { omit: "createdAt" | "updatedAt" }
>;

export class Role extends Model<RoleModel, TRoleCreateModel> {
  declare id: string;
  declare name: ERole;

  // timestamps!
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // mixins
  public addPermissions: BelongsToManyAddAssociationsMixin<Permission, number>;
  public setPermissions: BelongsToManySetAssociationsMixin<Permission, number>;

  // associations
  declare permissions: NonAttribute<Permission[]>;
}

Role.init(
  {
    id: {
      type: DataTypes.UUID(),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.ENUM(...Object.values(ERole)),
      allowNull: false,
    },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "roles",
    name: {
      singular: "role",
      plural: "roles",
    },
  },
);
