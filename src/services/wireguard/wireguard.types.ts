export interface IWireguardPeerStatus {
  allowedIps: string;
  latestHandshakeAt: Date | null;
  transferRx: number;
  transferTx: number;
  persistentKeepalive: string;
}
export interface IWireguardPeerStatusDto
  extends Record<string, IWireguardPeerStatus | null> {}
