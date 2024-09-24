import { InternalServerErrorException } from "@force-dev/utils";
import { inject as Inject, injectable as Injectable } from "inversify";
import { Controller, Get, Query, Route, Security, Tags } from "tsoa";

import { WireguardService } from "./wireguard.service";
import { IWireguardPeerStatus } from "./wireguard.types";

@Injectable()
@Tags("Wireguard")
@Route("api/wireguard")
export class WireguardController extends Controller {
  constructor(
    @Inject(WireguardService) private _wireguardService: WireguardService,
  ) {
    super();
  }

  @Get("/start/{interfaceName}")
  @Security("jwt")
  startVpn(interfaceName: string): Promise<void> {
    try {
      return this._wireguardService.start(interfaceName);
    } catch (e) {
      return Promise.reject(
        new InternalServerErrorException("Не удалось запустить wireguard", {
          cause: e,
        }),
      );
    }
  }

  @Get("/stop/{interfaceName}")
  @Security("jwt")
  stopVpn(interfaceName: string): Promise<boolean> {
    try {
      return this._wireguardService.stop(interfaceName);
    } catch (e) {
      return Promise.reject(
        new InternalServerErrorException("Не удалось остановить wireguard", {
          cause: e,
        }),
      );
    }
  }

  @Get("/status/{interfaceName}")
  @Security("jwt")
  checkStatus(
    interfaceName: string,
    @Query("publicKey") publicKey: string,
  ): Promise<IWireguardPeerStatus | null> {
    try {
      return this._wireguardService.getStatus(interfaceName, publicKey);
    } catch (e) {
      return Promise.reject(
        new InternalServerErrorException(
          "Не удалось получить статус wireguard",
          {
            cause: e,
          },
        ),
      );
    }
  }
}
