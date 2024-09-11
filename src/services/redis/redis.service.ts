import { injectable } from "inversify";

import { ApiError } from "../../common";
import { redisClient } from "../../db";

@injectable()
export class RedisService {
  async set<Data>(key: string, data: Data) {
    const status = await redisClient.set(key, JSON.stringify(data));

    await redisClient.persist(key);

    if (status === "OK") {
      return data;
    }

    throw new ApiError("Ошибка записи в базу данных", 500);
  }

  async get<Data>(key: string) {
    const data = await redisClient.get(key);

    if (data) {
      return JSON.parse(data) as Data;
    } else {
      return null;
    }
  }

  delete(key: string) {
    return redisClient.del(key);
  }
}

// src/services/profile/index.ts ->
// src/services/profile/profile.controller.ts ->
// src/services/profile/profile.service.ts ->
// src/services/profile/profile.model.ts ->
// src/services/wgserver/index.ts ->
// src/services/wgserver/wgserver.controller.ts ->
// src/services/wgserver/wgserver.service.ts ->
// src/services/profile/index.ts
