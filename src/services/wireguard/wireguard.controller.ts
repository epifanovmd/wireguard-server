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
  Security,
  Tags,
} from "tsoa";
import { ApiError } from "../../common";
import { KoaRequest } from "../../types/koa";
import { WireguardService } from "./wireguard.service";
import { WireguardClient } from "./wireguard.types";

const {
  getConfig,
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

getConfig().then(() => start());

@Tags("Wireguard")
@Route("api/wireguard")
export class WireguardController extends Controller {
  @Get("/start")
  @Security("jwt")
  startVpn(): Promise<boolean> {
    try {
      return start();
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Get("/stop")
  @Security("jwt")
  stopVpn(): Promise<boolean> {
    try {
      return stop();
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Get("/status")
  @Security("jwt")
  checkStatus(): Promise<string | null> {
    try {
      return getStatus();
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Get("/clients")
  @Security("jwt")
  getClients(): Promise<WireguardClient[]> {
    try {
      return getClients();
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Get("/client")
  @Security("jwt")
  getClient(@Query("clientId") clientId: string): Promise<WireguardClient> {
    try {
      return getClient({ clientId });
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Get("/client/qrcode")
  @Security("jwt")
  getClientQRCodeSVG(@Query("clientId") clientId: string): Promise<string> {
    try {
      return getClientQRCodeSVG({ clientId });
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Get("/client/configuration")
  @Security("jwt")
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
  @Security("jwt")
  createClient(@Body() body: { name: string }): Promise<WireguardClient> {
    try {
      return createClient(body);
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Delete("/client/{clientId}")
  @Security("jwt")
  deleteClient(clientId: string): Promise<string> {
    try {
      return deleteClient({ clientId });
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Post("/client/enable")
  @Security("jwt")
  enableClient(
    @Body() { clientId }: { clientId: string },
  ): Promise<WireguardClient> {
    try {
      return enableClient({ clientId });
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Post("/client/disable")
  @Security("jwt")
  disableClient(
    @Body() { clientId }: { clientId: string },
  ): Promise<WireguardClient> {
    try {
      return disableClient({ clientId });
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }

  @Put("/client/{clientId}")
  @Security("jwt")
  updateClient(
    clientId: string,
    @Body() { name, address }: { name: string; address: string },
  ): Promise<WireguardClient> {
    try {
      return updateClient({
        clientId,
        name,
        address,
      });
    } catch (e) {
      return Promise.reject(new ApiError(e.message, 500));
    }
  }
}
