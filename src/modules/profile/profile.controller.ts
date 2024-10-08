import { inject, injectable } from "inversify";
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";

import { getContextProfile } from "../../common";
import { KoaRequest } from "../../types/koa";
import {
  IProfileDto,
  IProfileListDto,
  IProfilePrivilegesRequest,
  IProfileUpdateRequest,
} from "./profile.model";
import { ProfileService } from "./profile.service";

@injectable()
@Tags("Profile")
@Route("api/profile")
export class ProfileController extends Controller {
  constructor(@inject(ProfileService) private _profileService: ProfileService) {
    super();
  }

  @Security("jwt")
  @Get("my")
  getMyProfile(@Request() req: KoaRequest): Promise<IProfileDto> {
    const profileId = getContextProfile(req);

    return this._profileService.getProfile(profileId);
  }

  @Security("jwt")
  @Patch("/my/update")
  updateMyProfile(
    @Request() req: KoaRequest,
    @Body() body: IProfileUpdateRequest,
  ): Promise<IProfileDto> {
    const profileId = getContextProfile(req);

    return this._profileService.updateProfile(profileId, body);
  }

  @Security("jwt")
  @Delete("my/delete")
  deleteMyProfile(@Request() req: KoaRequest): Promise<string> {
    const profileId = getContextProfile(req);

    return this._profileService.deleteProfile(profileId);
  }

  @Security("jwt")
  @Get("all")
  getAllProfiles(
    @Query("offset") offset?: number,
    @Query("limit") limit?: number,
  ): Promise<IProfileListDto> {
    return this._profileService.getAllProfile(offset, limit).then(result => ({
      offset,
      limit,
      count: result.length,
      data: result,
    }));
  }

  @Security("jwt")
  @Get("/{id}")
  getProfileById(id: string): Promise<IProfileDto> {
    return this._profileService.getProfile(id);
  }

  @Security("jwt", ["role:admin"])
  @Patch("setPrivileges/{id}")
  setPrivileges(
    id: string,
    @Body() body: IProfilePrivilegesRequest,
  ): Promise<IProfileDto> {
    return this._profileService.setPrivileges(
      id,
      body.roleName,
      body.permissions,
    );
  }

  @Security("jwt", ["role:admin"])
  @Patch("update/{id}")
  updateProfile(
    id: string,
    @Body() body: IProfileUpdateRequest,
  ): Promise<IProfileDto> {
    return this._profileService.updateProfile(id, body);
  }

  @Security("jwt", ["role:admin"])
  @Delete("delete/{id}")
  deleteProfile(id: string): Promise<string> {
    return this._profileService.deleteProfile(id);
  }
}
