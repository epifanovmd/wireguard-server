import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  Request,
  Route,
  Tags,
} from "tsoa";
import { ApiError } from "../../common";
import { KoaRequest } from "../../types/koa";
import { WireguardService } from "./wireguard.service";
import { WireguardClient } from "./wireguard.types";

const {
  stop,
  start,
  getStatus,
  deleteClient,
  disableClient,
  enableClient,
  getClientConfiguration,
  getClientQRCodeSVG,
  createClient,
  getClient,
  getClients,
  updateClient,
} = new WireguardService();

@Tags("Wireguard")
@Route("api/wireguard")
export class WireguardController extends Controller {
  @Get("/start")
  // @Security("jwt")
  startVpn(): Promise<boolean> {
    try {
      return start();
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Get("/stop")
  stopVpn(): Promise<boolean> {
    try {
      return stop();
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Get("/status")
  checkStatus(): Promise<string | null> {
    try {
      return getStatus();
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Get("/clients")
  // @Security("jwt")
  getClients(): Promise<WireguardClient[]> {
    try {
      return getClients();
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Get("/client")
  getClient(@Query("clientId") clientId: string): Promise<WireguardClient> {
    try {
      return getClient({ clientId });
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Get("/client/qrcode")
  getClientQRCodeSVG(@Query("clientId") clientId: string): Promise<string> {
    try {
      return getClientQRCodeSVG({ clientId });
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Get("/client/configuration")
  async getClientConfiguration(
    @Request() req: KoaRequest,
    @Query("clientId") clientId: string,
  ): Promise<string> {
    try {
      const client = await getClient({ clientId });
      const config = await getClientConfiguration({ clientId });
      const configName = client.name
        .replace(/[^a-zA-Z0-9_=+.-]/g, "-")
        .replace(/(-{2,}|-$)/g, "-")
        .replace(/-$/, "")
        .substring(0, 32);

      this.setHeader(
        "Content-Disposition",
        `attachment; filename="${configName || clientId}.conf"`,
      );
      this.setHeader("Content-Type", "text/plain");

      return config;
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Post("/client")
  createClient(@Body() body: { name: string }): Promise<WireguardClient> {
    try {
      return createClient(body);
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Delete("/client/{clientId}")
  deleteClient(clientId: string): Promise<string> {
    try {
      return deleteClient({ clientId }).then(() => clientId);
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Post("/client/enable")
  enableClient(@Body() { clientId }: { clientId: string }): Promise<string> {
    try {
      return enableClient({ clientId }).then(() => clientId);
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Post("/client/disable")
  disableClient(@Body() { clientId }: { clientId: string }): Promise<string> {
    try {
      return disableClient({ clientId }).then(() => clientId);
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Put("/client/{clientId}")
  updateClient(
    clientId: string,
    @Body() { name, address }: { name: string; address: string },
  ): Promise<boolean> {
    try {
      return updateClient({
        clientId,
        name,
        address,
      })
        .then(() => true)
        .catch(() => false);
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }
}
