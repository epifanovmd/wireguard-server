import "./modules.associations";

import { Container } from "inversify";

import { Module } from "../app.module";
import { AuthModule } from "./auth";
import { IPAddressModule } from "./ipaddress";
import { MailerModule } from "./mailer";
import { OtpModule } from "./otp";
import { PasskeysModule } from "./passkeys";
import { PermissionModule } from "./permission";
import { ProfileModule } from "./profile";
import { ResetPasswordTokensModule } from "./reset-password-tokens";
import { RoleModule } from "./role";
import { SocketModule } from "./socket";
import { UtilsModule } from "./utils";
import { WgClientModule } from "./wgclient";
import { WgServerModule } from "./wgserver";
import { WireguardModule } from "./wireguard";
// IMPORT MODULE HERE

export class ModulesModule implements Module {
  Configure(ioc: Container) {
    new AuthModule().Configure(ioc);
    new PasskeysModule().Configure(ioc);
    new IPAddressModule().Configure(ioc);
    new ProfileModule().Configure(ioc);
    new RoleModule().Configure(ioc);
    new PermissionModule().Configure(ioc);
    new SocketModule().Configure(ioc);
    new UtilsModule().Configure(ioc);
    new WgServerModule().Configure(ioc);
    new WgClientModule().Configure(ioc);
    new WireguardModule().Configure(ioc);
    new MailerModule().Configure(ioc);
    new OtpModule().Configure(ioc);
    new ResetPasswordTokensModule().Configure(ioc);
    // CONFIGURE MODULE HERE
  }
}
