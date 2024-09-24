import { Container } from "inversify";

import { Module } from "../app.module";
import { AuthModule } from "./auth";
import { IPAddressModule } from "./ipaddress";
import { ProfileModule } from "./profile";
import { RedisModule } from "./redis";
import { SocketModule } from "./socket";
import { UtilsModule } from "./utils";
import { WgClientModule } from "./wgclient";
import { WgServerModule } from "./wgserver";
import { WireguardModule } from "./wireguard";

export class ModulesModule implements Module {
  Configure(ioc: Container) {
    new AuthModule().Configure(ioc);
    new IPAddressModule().Configure(ioc);
    new ProfileModule().Configure(ioc);
    new RedisModule().Configure(ioc);
    new SocketModule().Configure(ioc);
    new UtilsModule().Configure(ioc);
    new WgServerModule().Configure(ioc);
    new WgClientModule().Configure(ioc);
    new WireguardModule().Configure(ioc);
  }
}
