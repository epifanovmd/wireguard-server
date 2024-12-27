import { inject, injectable as Injectable } from "inversify";

import { WgClientService } from "../wgclient";
import { WireguardService } from "../wireguard";
import { IWireguardPeerStatusDto } from "../wireguard/wireguard.types";
import { SocketService } from "./socket.service";
import { TSocket } from "./socket.types";

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

  private _onSubscribeToClient = (clientSocket: TSocket) => {
    clientSocket.on("subscribeToClient", async clientId => {
      const subscribeId = `${clientSocket.id}-${clientId.join(",")}`;

      this._unsubscribe(subscribeId);

      const clients = await this._wgClientService.getWgClientsByAttr({
        id: clientId,
      });

      const intervalId = setInterval(async () => {
        const data = await Promise.all(
          clients.map(async ({ id, publicKey, server }) => {
            const status = await this._wireguardService.getStatus(
              server.name,
              publicKey,
            );

            return {
              clientId: id,
              status,
            };
          }),
        );

        const response = data.reduce<IWireguardPeerStatusDto>((acc, item) => {
          if (item.status) {
            acc[item.clientId] = item.status;
          }

          return acc;
        }, {});

        clientSocket.emit("client", response);
      }, 1000);

      this.subscribes.set(subscribeId, intervalId);

      clientSocket.on("disconnect", () => {
        this._unsubscribe(subscribeId);
      });

      clientSocket.on("unsubscribeFromClient", () => {
        this._unsubscribe(subscribeId);
      });
    });
  };
}
