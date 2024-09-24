import { Container } from "inversify";

import { Module } from "../../app.module";
import { WgClientController } from "./wgclient.controller";
import { WgClientService } from "./wgclient.service";

export class WgClientModule implements Module {
  Configure(ioc: Container) {
    ioc.bind(WgClientController).to(WgClientController).inSingletonScope();
    ioc.bind(WgClientService).to(WgClientService).inSingletonScope();
  }
}
