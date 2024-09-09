export interface IWireguardPeerStatus {
  allowedIps: string;
  latestHandshakeAt?: Date | string;
  transferRx: number;
  transferTx: number;
  persistentKeepalive: number;
}
export interface IWireguardPeerStatusDto
  extends Record<string, IWireguardPeerStatus | null> {}
