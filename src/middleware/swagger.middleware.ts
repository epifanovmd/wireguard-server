import KoaRouter from "@koa/router";
import { koaSwagger } from "koa2-swagger-ui";

import swaggerDoc from "../../swagger.json";

export const RegisterSwagger = (router: KoaRouter, url: string) => {
  router.get(url + "/swagger.json", context => {
    context.status = 200;
    context.body = swaggerDoc;
  });

  router.get(
    url,
    koaSwagger({
      routePrefix: false,
      swaggerOptions: {
        showRequestHeaders: true,
        spec: swaggerDoc,
        jsonEditor: true,
      },
    }),
  );
};
