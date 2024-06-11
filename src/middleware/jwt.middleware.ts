import jwt, { VerifyErrors } from "jsonwebtoken";
import { Request } from "koa";
import { ApiError, jwtSecretKey } from "../common";

export const koaAuthentication = (
  request: Request,
  securityName: string,
  scopes?: string[],
): Promise<any> => {
  const token = request.ctx.cookies.get("token");

  if (securityName === "jwt") {
    return new Promise((resolve, reject) => {
      if (!token) {
        reject(new ApiError("No token provided", 401));
      } else {
        jwt.verify(token, jwtSecretKey, (err: VerifyErrors, decoded: any) => {
          if (err) {
            reject(err);
          } else {
            // Check if JWT contains all required scopes
            if (scopes) {
              for (const scope of scopes) {
                if (!decoded.role.includes(scope)) {
                  reject(new ApiError("Access restricted", 401));
                }
              }
            }
            resolve(decoded);
          }
        });
      }
    });
  }

  return Promise.resolve({});
};
