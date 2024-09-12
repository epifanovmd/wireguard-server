import request from "supertest";

import { redisClient } from "../../db";
import { iocContainer } from "../../modules";
import { server } from "../../server";
import { SocketService } from "../socket";

let accessToken = "";

describe("Profile", () => {
  beforeEach(done => {
    // await Users.destroy({});
    done();
  });

  describe("/GET profiles", () => {
    it("it should GET all the users", done => {
      request(server)
        .post("/api/auth/signUp")
        .send({
          username: "test_user",
          password: "test_password",
        })
        .expect("Content-Type", /json/)
        .expect(200)
        .expect(res => res.body.tokens.accessToken !== undefined)
        .end((err, res) => {
          console.log("err", err);
          if (err) {
            throw err;
          }

          accessToken = res.body.tokens.accessToken;

          done();
        });
    });
  });

  /*
   * Тест для /GET
   */
  // describe("/GET profiles", () => {
  //   it("it should GET all the users", done => {
  //     chai
  //       .request(server)
  //       .get("/api/profile/all")
  //       .set("Accept", "application/json")
  //       .end((_err, res) => {
  //         console.log("res", res);
  //         res.should.have.status(200);
  //         // res.body.should.be.a("array");
  //         // res.body.length.should.be.eql(0);
  //         done();
  //       });
  //   });
  // });

  afterAll(done => {
    const socketService = iocContainer.get(SocketService);

    redisClient.disconnect();
    socketService.close();

    done();
  });
});
