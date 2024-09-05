import { injectable as Injectable } from "inversify";
import { createClient } from "redis";

import { config } from "../../../config";
import { ApiError } from "../../common";
import { IProfileModel } from "../auth";

const { REDIS_HOST, REDIS_PORT, REDIS_PASS } = config;

const rediscl = createClient({
  password: REDIS_PASS,
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
});

rediscl.connect().catch(err => {
  console.log("EROR CONNECT REDIS", err);
});

rediscl.on("connect", () => {
  console.log("Redis connected.");
});

@Injectable()
export class RedisService {
  getProfile = async (username: string): Promise<IProfileModel | null> => {
    const client = await rediscl.get(username);

    if (client) {
      return JSON.parse(client) as IProfileModel;
    } else {
      return null;
    }
  };

  setProfile = (username: string, body: IProfileModel) =>
    rediscl.set(username, JSON.stringify(body)).then(async res => {
      await rediscl.persist(username);

      if (res === "OK") {
        const client = await this.getProfile(username);

        if (client) {
          return client;
        }

        throw new ApiError("Клиент не найден в базе данных", 500);
      } else {
        throw new ApiError("Ошибка записи в базу данных", 500);
      }
    });
}
