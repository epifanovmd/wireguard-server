import { IPAddress } from "./ipaddress/ipaddress.model";
import { Otp } from "./otp/otp.model";
import { Passkeys } from "./passkeys/passkeys.model";
import { Permission } from "./permission/permission.model";
import { Profile } from "./profile/profile.model";
import { ResetPasswordTokens } from "./reset-password-tokens/reset-password-tokens.model";
import { Role } from "./role/role.model";
import { WgClient } from "./wgclient/wgclient.model";
import { WgServer } from "./wgserver/wgserver.model";

Profile.belongsTo(Role, { foreignKey: "roleId" });
Profile.hasMany(Passkeys, { onDelete: "CASCADE" });
Passkeys.belongsTo(Profile);
Profile.hasMany(Otp, { onDelete: "CASCADE" });
Otp.belongsTo(Profile);
Profile.hasMany(ResetPasswordTokens, { onDelete: "CASCADE" });
ResetPasswordTokens.belongsTo(Profile);

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
