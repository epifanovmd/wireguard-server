import { injectable as Injectable } from "inversify";
import { createClient } from "redis";
import { ApiError } from "../../common";
import { RedisClient } from "../auth";

const rediscl = createClient({
  url: "redis://redis:6379",
});

rediscl.connect().catch(err => {
  console.log("EROR CONNECT REDIS", err);
});

rediscl.on("connect", () => {
  console.log("Redis connected.");
});

@Injectable()
export class RedisService {
  getClient = async (login: string): Promise<RedisClient | null> => {
    const client = await rediscl.get(login);

    if (client) {
      return JSON.parse(client) as RedisClient;
    } else {
      return null;
    }
  };
  setClient = (login: string, body: RedisClient) =>
    rediscl.set(login, JSON.stringify(body)).then(async res => {
      if (res === "OK") {
        const client = await this.getClient(login);

        if (client) {
          return client;
        }

        throw new ApiError("Клиент не найден в базе данных", 500);
      } else {
        throw new ApiError("Ошибка записи в базу данных", 500);
      }
    });
}
