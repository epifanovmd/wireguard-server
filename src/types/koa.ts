import Koa from "koa";

import { IProfileDto } from "../modules/profile/profile.model";

export type JWTDecoded = {
  profileId: string;
  iat: number;
  exp: number;
};

interface RequestClient {
  ctx: {
    request: {
      user: IProfileDto | undefined;
    };
  };
}

export type KoaRequest = Koa.Request & RequestClient;
