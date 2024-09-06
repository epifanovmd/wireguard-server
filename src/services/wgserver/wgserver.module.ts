import { Container } from "inversify";

import { Module } from "../../modules";
import { WgServerService } from "./wgserver.service";

export class WgServerModule implements Module {
  Configure(ioc: Container) {
    ioc.bind(WgServerService).to(WgServerService).inSingletonScope();
  }
}
