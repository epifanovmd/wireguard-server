export interface WireguardConfig {
  server: {
    privateKey: string;
    publicKey: string;
    address: string;
  };
  clients: {
    [key: string]: WireguardClient;
  };
}

export interface WireguardClient {
  id: string;
  enabled: boolean;
  name: string;
  publicKey: string;
  privateKey?: string;
  preSharedKey?: string;
  address: string;
  allowedIPs?: string;
  latestHandshakeAt?: Date | null;
  transferRx?: number | null;
  transferTx?: number | null;
  persistentKeepalive?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
