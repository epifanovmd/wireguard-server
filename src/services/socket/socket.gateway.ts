import { inject, injectable as Injectable } from "inversify";

// import { WireguardService } from "../wireguard";
import { SocketService } from "./socket.service";
import { Socket } from "./socket.types";

@Injectable()
export class SocketGateway {
  private subscribes = new Map<string, NodeJS.Timeout>();

  constructor(
    @inject(SocketService) private _socketService: SocketService,
  ) // @inject(WireguardService) private _wireguardService: WireguardService,
  {}

  start = () => {
    this._socketService.onConnection((client, clientSocket) => {
      this._onSubscribeAllClients(clientSocket);
      this._onSubscribeToClient(clientSocket);
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
      console.log("subscribeToAll");
      const subscribeId = clientSocket.id;

      this._unsubscribe(subscribeId);

      // const intervalId = setInterval(async () => {
      //   const clients = await this._wireguardService.getClients();
      //
      //   clientSocket.emit("all", clients);
      // }, 1000);

      // this.subscribes.set(subscribeId, intervalId);

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

      // const intervalId = setInterval(async () => {
      //   const client = await this._wireguardService
      //     .getClient({ clientId })
      //     .catch(() => null);
      //
      //   if (client) {
      //     clientSocket.emit("client", client);
      //   }
      // }, 1000);

      // this.subscribes.set(subscribeId, intervalId);

      clientSocket.on("disconnect", () => {
        this._unsubscribe(subscribeId);
      });

      clientSocket.on("unsubscribeFromClient", _clientId => {
        this._unsubscribe(subscribeId);
      });
    });
  };
}
