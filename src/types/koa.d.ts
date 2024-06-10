import Koa from "koa";
import { AuthClient } from "../services/authentication";

interface RequestClient {
  ctx: {
    request: {
      user: AuthClient | undefined;
    };
  };
}

export type KoaRequest = Koa.Request & RequestClient;
