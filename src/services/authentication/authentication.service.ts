import { sign } from "jsonwebtoken";
import sha256 from "sha256";
import { v4 } from "uuid";
import { ApiError, jwtSecretKey } from "../../common";
import { RedisService } from "../redis";
import {
  AuthRequest,
  RedisClient,
  RegistrationRequest,
} from "./authentication.types";

const { setClient, getClient } = new RedisService();

export class AuthService {
  async registration(body: RegistrationRequest): Promise<RedisClient> {
    const client = await getClient(body.login);

    if (client) {
      throw new ApiError(
        `Клиент с логином - ${body.login}, уже зарегистрирован`,
        500,
      );
    } else {
      const salt = v4();

      return setClient(body.login, {
        id: v4(),
        login: body.login,
        name: body.name,
        password: sha256(body.password + salt),
        salt,
      });
    }
  }

  async login(body: AuthRequest): Promise<RedisClient & { token: string }> {
    const client = await getClient(body.login);

    if (client) {
      const { password, salt, login, name, id } = client;

      if (password === sha256(body.password + salt)) {
        const token = sign(
          {
            id,
            name,
            login,
          },
          jwtSecretKey,
          {
            algorithm: "HS256",
            expiresIn: "24h",
          },
        );

        return {
          token,
          ...client,
        };
      }
    }
    throw new ApiError("Неверный логин или пароль", 500);
  }
}
