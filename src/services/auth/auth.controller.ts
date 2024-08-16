import { inject as Inject, injectable as Injectable } from "inversify";
import { Body, Controller, Post, Route, Tags } from "tsoa";

import { AuthService } from "./auth.service";
import {
  IProfileWithTokensDto,
  ISignInRequestDto,
  ISignUpRequestDto,
  TokensDto,
} from "./auth.types";

const PHONE_REGEX = /^[\d+][\d() -]{4,14}\d$/;
const EMAIL_REGEX = /^(\S+)@([a-z0-9-]+)(\.)([a-z]{2,4})(\.?)([a-z]{0,4})+$/;

@Injectable()
@Tags("Authorization")
@Route("api/auth")
export class AuthController extends Controller {
  constructor(@Inject(AuthService) private _authService: AuthService) {
    super();
  }

  /**
   * Регистрация нового пользователя
   * @param body Данные для регистрации
   * @summary Регистрация пользователя.
   */
  @Post("/signUp")
  async signUp(
    @Body() body: ISignUpRequestDto,
  ): Promise<IProfileWithTokensDto> {
    try {
      return await this._authService.signUp(body);
    } catch (error) {
      console.error("Ошибка регистрации:", error);
      throw new Error("Ошибка регистрации");
    }
  }

  /**
   * Авторизация пользователя
   * @param body Данные для авторизации
   * @summary Авторизация пользователя.
   */
  @Post("/signIn")
  async signIn(
    @Body() body: ISignInRequestDto,
  ): Promise<IProfileWithTokensDto> {
    try {
      return await this._authService.signIn(body);
    } catch (error) {
      console.error("Ошибка авторизации:", error);
      throw new Error("Ошибка авторизации");
    }
  }

  /**
   * Обновление токенов
   * @param body Токен для обновления
   * @summary Обновление токенов.
   */
  @Post("/refresh")
  async refresh(@Body() body: { refreshToken: string }): Promise<TokensDto> {
    try {
      return await this._authService.updateTokens(body.refreshToken);
    } catch (error) {
      console.error("Ошибка обновления токенов:", error);
      throw new Error("Ошибка обновления токенов");
    }
  }
}
