import { Body, Controller, Post, Route, Tags } from "tsoa";
import { AuthService } from "./authentication.service";
import {
  AuthRequest,
  AuthResponse,
  RegistrationRequest,
} from "./authentication.types";

const PHONE_REGEX = /^[\d+][\d() -]{4,14}\d$/;
const EMAIL_REGEX = /^(\S+)@([a-z0-9-]+)(\.)([a-z]{2,4})(\.?)([a-z]{0,4})+$/;

const { registration, login } = new AuthService();

@Tags("Authorization")
@Route("api/auth")
export class AuthController extends Controller {
  @Post("/registration")
  registration(@Body() body: RegistrationRequest): Promise<AuthResponse> {
    return registration(body).then(res => ({
      id: res.id,
      login: res.login,
      name: res.name,
    }));
  }

  @Post("/login")
  login(@Body() body: AuthRequest): Promise<AuthResponse> {
    return login(body).then(res => {
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
