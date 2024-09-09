import { inject, injectable as Injectable } from "inversify";

import { WgClientService } from "../wgclient";
import { IWireguardPeerStatusDto, WireguardService } from "../wireguard";
import { SocketService } from "./socket.service";
import { Socket } from "./socket.types";

@Injectable()
export class SocketGateway {
  private subscribes = new Map<string, NodeJS.Timeout>();

  constructor(
    @inject(SocketService) private _socketService: SocketService,
    @inject(WireguardService) private _wireguardService: WireguardService,
    @inject(WgClientService) private _wgClientService: WgClientService,
  ) {}

  start = () => {
    this._socketService.onConnection((client, clientSocket) => {
      this._onSubscribeToClient(clientSocket);
    });
  };

  private _unsubscribe = (id: string) => {
    const _id = this.subscribes.get(id);

    if (_id) {
      clearInterval(_id);
    }
  };

  private _onSubscribeToClient = (clientSocket: Socket) => {
    clientSocket.on("subscribeToClient", async clientId => {
      const subscribeId = `${clientSocket.id}-${clientId}`;

      this._unsubscribe(subscribeId);

      const clients = await this._wgClientService.getWgClientsByAttr({
        id: clientId,
      });

      const intervalId = setInterval(async () => {
        const data = await Promise.all(
          clients.map(({ publicKey, server }) =>
            this._wireguardService.getStatus(server.name, publicKey),
          ),
        );

        const response = data.reduce<IWireguardPeerStatusDto[]>((acc, item) => {
          if (item) {
            acc.push(item);
          }

          return acc;
        }, []);

        clientSocket.emit("client", response);
      }, 1000);

      this.subscribes.set(subscribeId, intervalId);

      clientSocket.on("disconnect", () => {
        this._unsubscribe(subscribeId);
      });

      clientSocket.on("unsubscribeFromClient", _clientId => {
        this._unsubscribe(subscribeId);
      });
    });
  };
}
