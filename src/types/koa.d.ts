import Koa from "koa";
import { AuthClient } from "../services/auth";

interface RequestClient {
  ctx: {
    request: {
      user: AuthClient | undefined;
    };
  };
}

export type KoaRequest = Koa.Request & RequestClient;
