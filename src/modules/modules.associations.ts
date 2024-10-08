import { IPAddress } from "./ipaddress";
import { Permission } from "./permission";
import { Profile } from "./profile";
import { Role } from "./role";
import { WgClient } from "./wgclient";
import { WgServer } from "./wgserver";

Profile.belongsTo(Role, { foreignKey: "roleId" });

Role.hasMany(Profile, { onDelete: "CASCADE" });
Role.belongsToMany(Permission, {
  through: "rolePermissions",
  onDelete: "CASCADE",
});

Permission.belongsToMany(Role, {
  through: "rolePermissions",
  onDelete: "CASCADE",
});

WgClient.belongsTo(Profile);
WgClient.hasOne(IPAddress, { onDelete: "CASCADE" });
WgClient.belongsTo(WgServer);

WgServer.hasMany(WgClient, { onDelete: "CASCADE" });
WgServer.hasOne(IPAddress, { onDelete: "CASCADE" });
WgServer.belongsTo(Profile);

IPAddress.belongsTo(WgServer);
IPAddress.belongsTo(WgClient);

WgServer.beforeDestroy(async wgServer => {
  await WgClient.destroy({ where: { serverId: wgServer.id } });
});
