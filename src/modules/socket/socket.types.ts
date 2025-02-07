import { Socket as SocketIO } from "socket.io";

import { IWireguardPeerStatusDto } from "../wireguard/wireguard.types";

export interface ISocketEvents {
  subscribeToClient: (...args: [clientId: string[]]) => void;
  unsubscribeFromClient: () => void;
  offer: (data: { from: string; to: string; offer: any }) => void;
  answer: (data: { from: string; to: string; answer: any }) => void;
  "ice-candidate": (data: { from: string; to: string; candidate: any }) => void;
}

export interface ISocketEmitEvents {
  client: (...args: [data: IWireguardPeerStatusDto]) => void;
  offer: (offer: { from: string; to: string; offer: any }) => void;
  answer: (data: { from: string; to: string; answer: any }) => void;
  "ice-candidate": (candidate: {
    from: string;
    to: string;
    candidate: any;
  }) => void;
}

export type TSocket = SocketIO<ISocketEvents, ISocketEmitEvents>;
