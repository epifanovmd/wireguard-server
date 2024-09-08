export interface IWireguardPeerStatusDto {
  publicKey: string;
  preSharedKey: string;
  endpoint: string;
  allowedIps: string;
  latestHandshakeAt: Date | null;
  transferRx: number;
  transferTx: number;
  persistentKeepalive: string;
}
