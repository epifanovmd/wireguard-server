import { parse } from "cookie";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import Koa from "koa";
import { Server, Socket as SocketIO } from "socket.io";
import { jwtSecretKey } from "../../common";
import { AuthClient } from "../authentication";
import { WireguardClient, WireguardService } from "../wireguard";

export interface SocketEvents {
  subscribeToAll: () => void;
  unsubscribeFromAll: () => void;
  subscribeToClient: (...args: [clientId: string]) => void;
  unsubscribeFromClient: (...args: [clientId: string]) => void;
}

export interface SocketEmitEvents {
  all: (...args: [data: WireguardClient[]]) => void;
  client: (...args: [data: WireguardClient]) => void;
}

export type Socket = SocketIO<SocketEvents, SocketEmitEvents>;

const { getClient, getClients } = new WireguardService();

export class SocketService {
  public clients = new Map<string, { clientSocket: Socket }>();

  private subscribes = new Map<string, NodeJS.Timeout>();

  private _server?: ReturnType<typeof createServer>;
  private _socket?: Server<SocketEvents, SocketEmitEvents, SocketEmitEvents>;

  initialization = (app: Koa<Koa.DefaultState, Koa.DefaultContext>) => {
    this._server = createServer(app.callback());
    this._socket = new Server(this._server, {
      cors: {
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this._onConnection();

    console.log("Socket listen on PORT: ", 3232);
    this._server.listen("3232");
  };

  get socket() {
    return this._socket;
  }

  private _onConnection = () => {
    this._socket?.on("connection", clientSocket => {
      const { headers } = clientSocket.request;
      const cookie = parse(headers.cookie || "");
      const token = cookie?.token ?? clientSocket.handshake.query.token;

      if (token) {
        jwt.verify(token, jwtSecretKey, (err, decoded) => {
          if (err) {
            clientSocket.disconnect(true);

            return;
          }
          const profileId = (decoded as AuthClient).id;

          console.log("connect", profileId);

          this.clients.set(profileId, { clientSocket });

          this._onSubscribeAllClients(clientSocket);
          this._onSubscribeToClient(clientSocket);

          clientSocket.on("disconnect", () => {
            const id = profileId;

            console.log("disconnect", profileId);

            if (this.clients.has(id)) {
              this.clients.delete(id);
            }
          });
        });
      } else {
        clientSocket._error("UnauthorizedException");
        clientSocket.disconnect(true);
      }
    });
  };

  private _unsubscribe = (id: string) => {
    const _id = this.subscribes.get(id);

    if (_id) {
      clearInterval(_id);
    }
  };

  private _onSubscribeAllClients = (clientSocket: Socket) => {
    clientSocket.on("subscribeToAll", () => {
      const subscribeId = clientSocket.id;

      this._unsubscribe(subscribeId);

      const intervalId = setInterval(async () => {
        const clients = await getClients();

        clientSocket.emit("all", clients);
      }, 1000);

      this.subscribes.set(subscribeId, intervalId);

      clientSocket.on("disconnect", () => {
        this._unsubscribe(subscribeId);
      });

      clientSocket.on("unsubscribeFromAll", () => {
        this._unsubscribe(subscribeId);
      });
    });
  };

  private _onSubscribeToClient = (clientSocket: Socket) => {
    clientSocket.on("subscribeToClient", clientId => {
      const subscribeId = `${clientSocket.id}-${clientId}`;

      this._unsubscribe(subscribeId);

      const intervalId = setInterval(async () => {
        const client = await getClient({ clientId }).catch(() => null);

        if (client) {
          clientSocket.emit("client", client);
        }
      }, 1000);

      this.subscribes.set(subscribeId, intervalId);

      clientSocket.on("disconnect", () => {
        this._unsubscribe(subscribeId);
      });

      clientSocket.on("unsubscribeFromClient", clientId => {
        this._unsubscribe(subscribeId);
      });
    });
  };
}

export const SocketServiceInstance = new SocketService();
