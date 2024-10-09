import { Socket as SocketIO } from "socket.io";

import { IWireguardPeerStatusDto } from "../wireguard";

export interface ISocketEvents {
  subscribeToClient: (...args: [clientId: string[]]) => void;
  unsubscribeFromClient: () => void;
}

export interface ISocketEmitEvents {
  client: (...args: [data: IWireguardPeerStatusDto]) => void;
}

export type TSocket = SocketIO<ISocketEvents, ISocketEmitEvents>;
