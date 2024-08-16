import Koa from "koa";
import bodyParser from "koa-bodyparser";
import helmet from "koa-helmet";
import cors from "koa2-cors";
import { RateLimit } from "koa2-ratelimit";

export const RegisterAppMiddlewares = (
  app: Koa<Koa.DefaultState, Koa.DefaultContext>,
) => {
  app
    .use(
      RateLimit.middleware({
        interval: 15 * 60 * 1000, // 15 minutes
        max: 1000,
      }),
    )
    .use(
      bodyParser({
        detectJSON: ctx => /\.json$/i.test(ctx.path),
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
          // console.log("ctx", ctx.request.header);
          const allowHosts = [
            "http://localhost:3000",
            "http://wireguard.force-dev.ru",
            "https://socket-test-client.netlify.app",
          ];

          if (
            ctx.request.header.origin &&
            allowHosts.includes(ctx.request.header.origin)
          ) {
            return ctx.request.header.origin;
          }

          return false;
        },
        exposeHeaders: ["WWW-Authenticate", "Server-Authorization"],
        maxAge: 5,
        credentials: true,
        allowMethods: ["GET", "POST", "PATCH", "DELETE"],
        allowHeaders: ["Content-Type", "Authorization", "Accept"],
      }),
    );
};
