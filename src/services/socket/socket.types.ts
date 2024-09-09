import { Socket as SocketIO } from "socket.io";

import { IWireguardPeerStatusDto } from "../wireguard";

export interface SocketEvents {
  subscribeToClient: (...args: [clientId: string[]]) => void;
  unsubscribeFromClient: (...args: [clientId: string[]]) => void;
}

export interface SocketEmitEvents {
  client: (...args: [data: IWireguardPeerStatusDto[]]) => void;
}

export type Socket = SocketIO<SocketEvents, SocketEmitEvents>;
