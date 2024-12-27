import { Container } from "inversify";

import { Module } from "../../app.module";
import { ResetPasswordTokensService } from "./reset-password-token.service";

export class ResetPasswordTokensModule implements Module {
  Configure(ioc: Container) {
    ioc
      .bind(ResetPasswordTokensService)
      .to(ResetPasswordTokensService)
      .inSingletonScope();
  }
}
