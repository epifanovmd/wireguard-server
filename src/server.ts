import Koa from "koa";
import KoaRouter from "koa-router";
import { errorHandler, notFoundHandler } from "./common";
import { appMiddleware, RegisterSwagger } from "./middleware";
import { RegisterRoutes } from "./routes";
import { SocketServiceInstance } from "./services/socket";

const PORT = 8181;
const app = new Koa();

SocketServiceInstance.initialization(app);

// middleware
appMiddleware(app);

// Services routes
const router = new KoaRouter();

router.get("/ping", context => {
  context.status = 200;
  context.body = {
    serverTime: new Date().toISOString(),
  };
});

RegisterSwagger(router, "/api-docs");
RegisterRoutes(router);

app
  .use(errorHandler)
  .use(router.routes())
  .use(router.allowedMethods())
  .use(notFoundHandler);

export const server = app.listen(PORT, "0.0.0.0", () => {
  console.info(`REST API Server running on : http://localhost:${PORT}`);
});
