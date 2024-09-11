import cors from "@koa/cors";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import helmet from "koa-helmet";
import { RateLimit } from "koa2-ratelimit";

import { config } from "../../config";

const { RATE_LIMIT, RATE_LIMIT_INTERVAL, CORS_ALLOW_IPS } = config;

const jsonRegexp = new RegExp(/\.json$/i);

export const RegisterAppMiddlewares = (
  app: Koa<Koa.DefaultState, Koa.DefaultContext>,
) => {
  app
    .use(
      RateLimit.middleware({
        interval: RATE_LIMIT_INTERVAL,
        max: RATE_LIMIT,
      }),
    )
    .use(
      bodyParser({
        detectJSON: ctx => jsonRegexp.test(ctx.path),
      }),
    )
    .use(
      helmet({
        contentSecurityPolicy: false,
      }),
    )
    .use(
      cors({
        origin(ctx) {
          if (
            ctx.request.header.origin &&
            CORS_ALLOW_IPS.includes(ctx.request.header.origin)
          ) {
            return ctx.request.header.origin;
          }

          return "";
        },
        exposeHeaders: ["WWW-Authenticate", "Server-Authorization"],
        maxAge: 5,
        credentials: true,
        allowMethods: ["GET", "POST", "PATCH", "DELETE"],
        allowHeaders: ["Content-Type", "Authorization", "Accept"],
      }),
    );
};
