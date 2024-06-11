import { Container } from "inversify";
import { WireguardController } from "../../controllers";
import { Module } from "../../modules";
import { WireguardService } from "./wireguard.service";

export class WireguardModule implements Module {
  Configure(ioc: Container) {
    ioc.bind(WireguardController).to(WireguardController).inSingletonScope();
    ioc.bind(WireguardService).to(WireguardService).inSingletonScope();
  }
}
