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

import { getContextProfile } from "../../common/helpers";
import { ListResponse } from "../../dto/ListResponse";
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

  @Security("jwt")
  @Get()
  getWgServers(
    @Request() req: KoaRequest,
    @Query("offset") offset?: number,
    @Query("limit") limit?: number,
  ): Promise<IWgServersListDto> {
    const profileId = getContextProfile(req);

    return this._wgServerService
      .getWgServers(profileId, offset, limit)
      .then(result => ({
        offset,
        limit,
        count: result.length,
        data: result,
      }));
  }

  @Security("jwt")
  @Get("{id}")
  getWgServer(@Request() req: KoaRequest, id: string): Promise<IWgServerDto> {
    const profileId = getContextProfile(req);

    return this._wgServerService.getWgServerByAttr({
      profileId,
      id,
    });
  }

  @Security("jwt")
  @Post("create")
  createWgServer(
    @Request() req: KoaRequest,
    @Body() body: { name: string },
  ): Promise<IWgServerDto> {
    const profileId = getContextProfile(req);

    return this._wgServerService.createWgServer(profileId, body);
  }

  @Security("jwt")
  @Delete("/delete/{id}")
  deleteWgServer(@Request() req: KoaRequest, id: string): Promise<string> {
    const profileId = getContextProfile(req);

    return this._wgServerService.deleteWgServer(profileId, id);
  }
}
