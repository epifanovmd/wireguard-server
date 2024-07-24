import { Socket as SocketIO } from "socket.io";
import { IWireguardClientDto } from "../wireguard";

export interface SocketEvents {
  subscribeToAll: () => void;
  unsubscribeFromAll: () => void;
  subscribeToClient: (...args: [clientId: string]) => void;
  unsubscribeFromClient: (...args: [clientId: string]) => void;
}

export interface SocketEmitEvents {
  all: (...args: [data: IWireguardClientDto[]]) => void;
  client: (...args: [data: IWireguardClientDto]) => void;
}

export type Socket = SocketIO<SocketEvents, SocketEmitEvents>;
