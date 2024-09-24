import { Container } from "inversify";

import { Module } from "../../app.module";
import { IPAddressService } from "./ipaddress.service";

export class IPAddressModule implements Module {
  Configure(ioc: Container) {
    ioc.bind(IPAddressService).to(IPAddressService).inSingletonScope();
  }
}
