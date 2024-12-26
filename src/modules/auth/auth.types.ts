import { IProfileDto, TProfileCreateModel } from "../profile";

export interface IProfilePassword {
  password: string;
}

export interface ITokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface IProfileWithTokensDto extends IProfileDto {
  tokens: ITokensDto;
}

export interface ISignInRequest {
  /** Может быть телефоном, email-ом и username-ом  */
  login: string;
  password: string;
}

export interface ISignUpRequest
  extends Omit<TProfileCreateModel, "passwordHash" | "roleId" | "challenge">,
    IProfilePassword {}
