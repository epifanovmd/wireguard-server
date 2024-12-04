import { inject, injectable } from "inversify";
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";

import { getContextProfile } from "../../common";
import { KoaRequest } from "../../types/koa";
import { IWgServerDto, IWgServersListDto } from "./wgserver.model";
import { WgServerService } from "./wgserver.service";

@injectable()
@Tags("WgServer")
@Route("api/wgserver")
export class WgServerController extends Controller {
  constructor(
    @inject(WgServerService) private _wgServerService: WgServerService,
  ) {
    super();
  }

  @Security("jwt", ["role:admin"])
  @Get("server/{id}/start")
  startServer(@Request() req: KoaRequest, id: string): Promise<void> {
    const profile = getContextProfile(req);

    return this._wgServerService.startServer(profile.id, id);
  }

  @Security("jwt", ["role:admin"])
  @Get("server/{id}/stop")
  stopServer(@Request() req: KoaRequest, id: string): Promise<void> {
    const profile = getContextProfile(req);

    return this._wgServerService.stopServer(profile.id, id);
  }

  @Security("jwt")
  @Get("server/{id}/status")
  getServerStatus(
    @Request() req: KoaRequest,
    id: string,
  ): Promise<string | null> {
    return this._wgServerService.getServerStatus(id);
  }

  @Security("jwt")
  @Get()
  getWgServers(
    @Query("offset") offset?: number,
    @Query("limit") limit?: number,
  ): Promise<IWgServersListDto> {
    return this._wgServerService.getWgServers(offset, limit).then(result => ({
      offset,
      limit,
      count: result.length,
      data: result,
    }));
  }

  @Security("jwt")
  @Get("server/{id}")
  getWgServer(id: string): Promise<IWgServerDto> {
    return this._wgServerService.getWgServerByAttr({
      id,
    });
  }

  @Security("jwt", ["role:admin"])
  @Post("create")
  createWgServer(
    @Request() req: KoaRequest,
    @Body() body: { name: string },
  ): Promise<IWgServerDto> {
    const profile = getContextProfile(req);

    return this._wgServerService.createWgServer(profile.id, body);
  }

  @Security("jwt", ["role:admin"])
  @Delete("/delete/{id}")
  deleteWgServer(@Request() req: KoaRequest, id: string): Promise<string> {
    const profile = getContextProfile(req);

    return this._wgServerService.deleteWgServer(profile, id);
  }
}
