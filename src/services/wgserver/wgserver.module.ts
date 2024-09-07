import { Container } from "inversify";

import { Module } from "../../modules";
import { WgServerController } from "./wgserver.controller";
import { WgServerService } from "./wgserver.service";

export class WgServerModule implements Module {
  Configure(ioc: Container) {
    ioc.bind(WgServerController).to(WgServerController).inSingletonScope();
    ioc.bind(WgServerService).to(WgServerService).inSingletonScope();
  }
}
