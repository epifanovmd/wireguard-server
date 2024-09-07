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

import { getContextProfile } from "../../common/helpers";
import { ListResponse } from "../../dto/ListResponse";
import { KoaRequest } from "../../types/koa";
import {
  IWgClientCreateRequest,
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
  @Get()
  getWgClients(
    @Request() req: KoaRequest,
    @Query("offset") offset?: number,
    @Query("limit") limit?: number,
  ): Promise<ListResponse<IWgClientsDto[]>> {
    const profileId = getContextProfile(req);

    return this._wgClientService
      .getWgClients(profileId, offset, limit)
      .then(result => ({
        offset,
        limit,
        count: result.length,
        data: result,
      }));
  }

  @Security("jwt")
  @Get("{id}")
  getWgClient(@Request() req: KoaRequest, id: string): Promise<IWgClientsDto> {
    const profileId = getContextProfile(req);

    return this._wgClientService.getWgClientByAttr({
      profileId,
      id,
    });
  }

  @Security("jwt")
  @Post("/{id}")
  createWgClient(
    @Request() req: KoaRequest,
    @Body() body: IWgClientCreateRequest,
  ): Promise<IWgClientsDto> {
    const profileId = getContextProfile(req);

    return this._wgClientService.createWgClient(profileId, body);
  }

  @Security("jwt")
  @Patch("/{id}")
  updateWgClient(
    @Request() req: KoaRequest,
    @Body() body: IWgClientUpdateRequest,
    id: string,
  ): Promise<IWgClientsDto> {
    const profileId = getContextProfile(req);

    return this._wgClientService.updateWgClient(profileId, id, body);
  }

  @Security("jwt")
  @Delete("/{id}")
  deleteWgClient(@Request() req: KoaRequest, id: string): Promise<string> {
    const profileId = getContextProfile(req);

    return this._wgClientService.deleteWgClient(profileId, id);
  }
}
