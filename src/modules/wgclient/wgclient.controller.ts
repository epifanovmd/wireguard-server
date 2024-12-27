import { inject, injectable } from "inversify";
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";

import { getContextProfile } from "../../common";
import { KoaRequest } from "../../types/koa";
import { ERole } from "../role/role.model";
import {
  IWgClientCreateRequest,
  IWgClientListDto,
  IWgClientsDto,
  IWgClientUpdateRequest,
} from "./wgclient.model";
import { WgClientService } from "./wgclient.service";

@injectable()
@Tags("WgClient")
@Route("api/wgclients")
export class WgClientController extends Controller {
  constructor(
    @inject(WgClientService) private _wgClientService: WgClientService,
  ) {
    super();
  }

  @Security("jwt")
  @Get("/server/{serverId}")
  getWgClients(
    serverId: string,
    @Request() req: KoaRequest,
    @Query("offset") offset?: number,
    @Query("limit") limit?: number,
  ): Promise<IWgClientListDto> {
    const profile = getContextProfile(req);

    return this._wgClientService
      .getWgClients(profile, serverId, offset, limit)
      .then(result => ({
        offset,
        limit,
        count: result.length,
        data: result,
      }));
  }

  @Security("jwt")
  @Get("client/{id}")
  getWgClient(@Request() req: KoaRequest, id: string): Promise<IWgClientsDto> {
    const profile = getContextProfile(req);

    return this._wgClientService.getWgClientByAttr({
      ...(profile.role.name === ERole.ADMIN ? {} : { profileId: profile.id }),
      id,
    });
  }

  @Security("jwt")
  @Get("client/{id}/configuration")
  getWgClientConfiguration(
    @Request() req: KoaRequest,
    id: string,
  ): Promise<string> {
    const profile = getContextProfile(req);

    return this._wgClientService.getWgClientConfiguration(profile, id);
  }

  @Security("jwt", ["role:admin", "role:user", "permission:write"])
  @Post("create")
  createWgClient(
    @Request() req: KoaRequest,
    @Body() body: IWgClientCreateRequest,
  ): Promise<IWgClientsDto> {
    const profile = getContextProfile(req);

    return this._wgClientService.createWgClient(profile.id, body);
  }

  @Security("jwt", ["role:admin", "role:user", "permission:write"])
  @Patch("update/{id}")
  updateWgClient(
    @Request() req: KoaRequest,
    @Body() body: IWgClientUpdateRequest,
    id: string,
  ): Promise<IWgClientsDto> {
    const profile = getContextProfile(req);

    return this._wgClientService.updateWgClient(profile, id, body);
  }

  @Security("jwt", ["role:admin", "role:user", "permission:delete"])
  @Delete("delete/{id}")
  deleteWgClient(@Request() req: KoaRequest, id: string): Promise<string> {
    const profile = getContextProfile(req);

    return this._wgClientService.deleteWgClient(profile, id);
  }
}
