import logger from "koa-logger";

import { config } from "../config";
import { app, router } from "./app";
import { errorHandler, notFoundHandler } from "./common";
import { RegisterAppMiddlewares, RegisterSwagger } from "./middleware";
import { iocContainer } from "./modules";
import { RegisterRoutes } from "./routes";
import { SocketGateway } from "./services/socket/socket.gateway";
import { WgServerService } from "./services/wgserver";

const { SERVER_HOST, SERVER_PORT } = config;

const wgServerService = iocContainer.get(WgServerService);
const socketGateway = iocContainer.get(SocketGateway);

const isDevelopment = process.env.NODE_ENV;

const bootstrap = () => {
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
    .use(errorHandler)
    .use(router.routes())
    .use(router.allowedMethods())
    .use(notFoundHandler)
    .listen(SERVER_PORT, SERVER_HOST, async () => {
      await wgServerService.init();

      const url = `http://${SERVER_HOST}:${SERVER_PORT}`;

      console.info(`REST API Server running on: ${url}`);
      console.info(`Swagger on: ${url}/api-docs`);
    });
};

export const server = bootstrap();
