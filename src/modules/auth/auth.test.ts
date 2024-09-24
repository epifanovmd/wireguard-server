import request from "supertest";

import { iocContainer } from "../../app.module";
import { appServer } from "../../app.server";
import { redisClient, sequelize } from "../../db";
import { SocketService } from "../socket";

let accessToken = "";

describe("Profile", () => {
  beforeAll(done => {
    sequelize.truncate().then(done);

    done();
  });

  describe("/POST api/auth/signUp", () => {
    it("it should POST signUp", done => {
      request(appServer)
        .post("/api/auth/signUp")
        .send({
          username: "test_user",
          password: "test_password",
        })
        .expect("Content-Type", /json/)
        .expect(200)
        .expect(res => res.body.tokens.accessToken !== undefined)
        .end((err, res) => {
          if (err) {
            throw err;
          }

          accessToken = res.body.tokens.accessToken;

          done();
        });
    });
  });

  describe("/POST api/auth/signIn", () => {
    it("it should POST signIn", done => {
      request(appServer)
        .post("/api/auth/signIn")
        .send({
          username: "test_user",
          password: "test_password",
        })
        .expect("Content-Type", /json/)
        .expect(200)
        .expect(res => res.body.tokens.accessToken !== undefined)
        .end((err, res) => {
          if (err) {
            throw err;
          }

          accessToken = res.body.tokens.accessToken;

          console.log("accessToken", accessToken);

          done();
        });
    });
  });

  afterAll(done => {
    const socketService = iocContainer.get(SocketService);

    redisClient.disconnect();
    socketService.close();

    sequelize.truncate().then(done);
    done();
  });
});
