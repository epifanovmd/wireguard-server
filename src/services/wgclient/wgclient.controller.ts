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

import { ApiError, assertNotNull } from "../../common";
import { ListResponse } from "../../dto/ListResponse";
import { KoaRequest } from "../../types/koa";
import { IWgServerDto } from "../wgserver";
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
  @Post("wgserver/create")
  createWgServer(
    @Request() req: KoaRequest,
    @Body() body: { name: string },
  ): Promise<IWgServerDto> {
    const profileId = assertNotNull(
      req.ctx.request.user?.id,
      new ApiError("No token provided1", 401),
    );

    return this._wgClientService.createWgServer({
      profileId,
      name: body.name,
    });
  }

  @Security("jwt")
  @Delete("/wgserver/delete/{id}")
  deleteWgServer(id: string): Promise<IWgServerDto> {
    return this._wgClientService.deleteWgServer(id) as any;
  }

  @Security("jwt")
  @Get()
  getWgClients(
    @Query("offset") offset?: number,
    @Query("limit") limit?: number,
  ): Promise<ListResponse<IWgClientsDto[]>> {
    return this._wgClientService.getWgClients(offset, limit).then(result => ({
      offset,
      limit,
      count: result.length,
      data: result,
    })) as any;
  }

  @Security("jwt")
  @Get("{id}")
  getWgClient(id: string): Promise<IWgClientsDto> {
    return this._wgClientService.getWgClient(id) as any;
  }

  @Security("jwt")
  @Post("/{id}")
  async createWgClient(
    @Request() req: KoaRequest,
    @Body() body: IWgClientCreateRequest,
  ): Promise<IWgClientsDto> {
    const profileId = assertNotNull(
      req.ctx.request.user?.id,
      new ApiError("No token provided1", 401),
    );

    return this._wgClientService.createWgClient(profileId, body) as any;
  }

  @Security("jwt")
  @Patch("/{id}")
  updateWgClient(
    id: string,
    @Body() body: IWgClientUpdateRequest,
  ): Promise<IWgClientsDto> {
    return this._wgClientService.updateWgClient(id, body) as any;
  }

  @Security("jwt")
  @Delete("/{id}")
  deleteWgClient(id: string): Promise<number> {
    return this._wgClientService.deleteWgClient(id);
  }
}
