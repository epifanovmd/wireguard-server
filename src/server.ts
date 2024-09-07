import { DataTypes } from "sequelize";

import { config } from "../config";
import { app, router } from "./app";
import { errorHandler, notFoundHandler } from "./common";
import { sequelize } from "./db/db";
import { RegisterAppMiddlewares, RegisterSwagger } from "./middleware";
import { iocContainer } from "./modules";
import { RegisterRoutes } from "./routes";
import { SocketGateway } from "./services/socket/socket.gateway";
// import { WireguardService } from "./services/wireguard";

const { SERVER_HOST, SERVER_PORT } = config;

// const wireguardService = iocContainer.get(WireguardService);
const socketGateway = iocContainer.get(SocketGateway);

const bootstrap = () => {
  socketGateway.start();
  // wireguardService.initialize();

  router.get("/ping", context => {
    context.status = 200;
    context.body = {
      serverTime: new Date().toISOString(),
    };
  });

  RegisterAppMiddlewares(app);
  RegisterSwagger(router, "/api-docs");
  RegisterRoutes(router);

  app
    .use(errorHandler)
    .use(router.routes())
    .use(router.allowedMethods())
    .use(notFoundHandler)
    .listen(SERVER_PORT, SERVER_HOST, () => {
      const url = `http://${SERVER_HOST}:${SERVER_PORT}`;

      console.info(`REST API Server running on: ${url}`);
      console.info(`Swagger on: ${url}/api-docs`);
    });
};

bootstrap();
