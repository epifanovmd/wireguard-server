import { Body, Controller, Post, Route, Tags } from "tsoa";
import { inject as Inject, injectable as Injectable } from "inversify";
import { AuthService } from "./auth.service";
import { AuthRequest, AuthResponse, RegistrationRequest } from "./auth.types";

const PHONE_REGEX = /^[\d+][\d() -]{4,14}\d$/;
const EMAIL_REGEX = /^(\S+)@([a-z0-9-]+)(\.)([a-z]{2,4})(\.?)([a-z]{0,4})+$/;

@Injectable()
@Tags("Authorization")
@Route("api/auth")
export class AuthController extends Controller {
  constructor(@Inject(AuthService) private _authService: AuthService) {
    super();
  }

  @Post("/registration")
  registration(@Body() body: RegistrationRequest): Promise<AuthResponse> {
    return this._authService.registration(body).then(res => ({
      id: res.id,
      login: res.login,
      name: res.name,
    }));
  }

  @Post("/login")
  login(@Body() body: AuthRequest): Promise<AuthResponse> {
    return this._authService.login(body).then(res => {
      const token = res.token;

      this.setHeader("set-cookie", `token=${token};path=/;`);

      return {
        id: res.id,
        login: res.login,
        name: res.name,
      };
    });
  }
}
