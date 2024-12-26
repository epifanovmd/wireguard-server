import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from "@force-dev/utils";
import { inject, injectable } from "inversify";
import { Op } from "sequelize";
import sha256 from "sha256";

import {
  createTokenAsync,
  validateEmail,
  validatePhone,
  verifyToken,
} from "../../common";
import { ProfileService } from "../profile";
import {
  IProfileWithTokensDto,
  ISignInRequest,
  ISignUpRequest,
  ITokensDto,
} from "./auth.types";

@injectable()
export class AuthService {
  constructor(
    @inject(ProfileService) private _profileService: ProfileService,
  ) {}

  async signUp({
    email,
    phone,
    password,
    ...rest
  }: ISignUpRequest): Promise<IProfileWithTokensDto> {
    const login = email || phone;

    if (!login) {
      throw new BadRequestException(
        "Необходимо указать либо email, либо телефон, а также пароль.",
      );
    }

    if (email) {
      validateEmail(email);
    }
    if (phone) {
      validatePhone(phone);
    }

    const client = await this._profileService
      .getProfileByAttr({
        [Op.or]: [{ email }, { phone }],
      })
      .catch(() => null);

    if (client) {
      throw new BadRequestException(`Клиент - ${login}, уже зарегистрирован`);
    } else {
      return this._profileService
        .createProfile({
          ...rest,
          phone,
          email,
          passwordHash: sha256(password),
        })
        .then(() =>
          this.signIn({
            login,
            password,
          }),
        );
    }
  }

  async signIn(body: ISignInRequest): Promise<IProfileWithTokensDto> {
    const { login, password } = body;

    try {
      const { id, passwordHash } = await this._profileService.getProfileByAttr({
        [Op.or]: [{ email: login }, { phone: login }],
      });

      if (passwordHash === sha256(password)) {
        const profile = await this._profileService.getProfile(id);

        const role = profile.role;

        const data = {
          ...profile.toJSON(),
          role,
        };

        return {
          ...data,
          tokens: await this.getTokens(data.id),
        };
      }
    } catch {
      /* empty */
    }

    throw new UnauthorizedException("Не верный логин или пароль");
  }

  async updateTokens(token?: string) {
    const profile = await verifyToken(token);

    return this.getTokens(profile.id);
  }

  async getTokens(profileId: string): Promise<ITokensDto> {
    const [accessToken, refreshToken] = await createTokenAsync([
      {
        profileId,
        opts: { expiresIn: "15m" },
      },
      {
        profileId,
        opts: { expiresIn: "7d" },
      },
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
