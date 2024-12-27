import { parse } from "cookie";
import { createServer } from "http";
import { injectable } from "inversify";
import { Server } from "socket.io";

import { config } from "../../../config";
import { app } from "../../app";
import { verifyAuthToken } from "../../common";
import { IProfileDto } from "../profile";
import { ISocketEmitEvents, ISocketEvents, TSocket } from "./socket.types";

const { SOCKET_PORT, CORS_ALLOW_IPS } = config;

@injectable()
export class SocketService {
  public clients = new Map<string, { clientSocket: TSocket }>();
  private _socket: Server<ISocketEvents, ISocketEmitEvents, ISocketEmitEvents>;

  constructor() {
    const server = createServer(app.callback());

    this._socket = new Server(server, {
      cors: {
        origin: CORS_ALLOW_IPS.split(","),
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.onConnection((client, clientSocket) => {
      this.clients.set(client.id, { clientSocket });
    });

    console.log("Socket listen on PORT: ", SOCKET_PORT);
    server.listen(`${SOCKET_PORT}`);
  }

  get socket() {
    if (!this._socket) {
      throw Error("Socket is not initialized");
    }

    return this._socket;
  }

  close() {
    this._socket.close();
  }

  onConnection = (listener: (client: IProfileDto, socket: TSocket) => void) => {
    this.socket?.on("connection", clientSocket => {
      const { headers } = clientSocket.request;
      const cookie = parse(headers.cookie || "");
      const token =
        cookie?.access_token ?? clientSocket.handshake.query.access_token;

      if (token) {
        verifyAuthToken(token)
          .then(profile => {
            listener?.(profile, clientSocket);

            clientSocket.on("disconnect", () => {
              const id = profile.id;

              if (this.clients.has(id)) {
                this.clients.delete(id);
              }
            });
          })
          .catch(() => {
            clientSocket.disconnect(true);
          });
      } else {
        clientSocket._error("UnauthorizedException");
        clientSocket.disconnect(true);
      }
    });
  };
}
