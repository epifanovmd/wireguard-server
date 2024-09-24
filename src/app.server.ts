import logger from "koa-logger";

import { config } from "../config";
import { app, router } from "./app";
import { iocContainer } from "./app.module";
import { sequelize } from "./db";
import {
  notFoundMiddleware,
  RegisterAppMiddlewares,
  RegisterSwagger,
} from "./middleware";
import { SocketGateway } from "./modules/socket/socket.gateway";
import { WgServerService } from "./modules/wgserver";
import { RegisterRoutes } from "./routes";

const { SERVER_HOST, SERVER_PORT } = config;

const wgServerService = iocContainer.get(WgServerService);
const socketGateway = iocContainer.get(SocketGateway);

const isDevelopment = process.env.NODE_ENV;

const bootstrap = () => {
  sequelize.afterSync(() => {
    wgServerService.init().then();
  });
  socketGateway.start();

  router.get("/ping", context => {
    context.status = 200;
    context.body = {
      serverTime: new Date().toISOString(),
    };
  });

  if (isDevelopment) {
    app.use(logger());
  }

  RegisterAppMiddlewares(app);
  RegisterSwagger(router, "/api-docs");
  RegisterRoutes(router);

  return app
    .use(router.routes())
    .use(router.allowedMethods())
    .use(notFoundMiddleware)
    .listen(SERVER_PORT, SERVER_HOST, async () => {
      const url = `http://${SERVER_HOST}:${SERVER_PORT}`;

      console.info(`REST API Server running on: ${url}`);
      console.info(`Swagger on: ${url}/api-docs`);
    });
};

export const appServer = bootstrap();
