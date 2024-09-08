import { config } from "../../../config";
import { WgClient } from "./wgclient.model";

const {
  PUBLIC_HOST,
  WG_MTU,
  WG_DEFAULT_DNS,
  WG_PERSISTENT_KEEPALIVE,
  WG_ALLOWED_IPS,
} = config;

export const getClientConfig = (wgClient: WgClient) => `
[Interface]
PrivateKey = ${wgClient.server.privateKey}
Address = ${wgClient.server.address}/32
${WG_DEFAULT_DNS ? `DNS = ${WG_DEFAULT_DNS}` : ""}
${WG_MTU ? `MTU = ${WG_MTU}` : ""}

[Peer]
PublicKey = ${wgClient.publicKey}
PresharedKey = ${wgClient.preSharedKey}
AllowedIPs = ${WG_ALLOWED_IPS}
PersistentKeepalive = ${WG_PERSISTENT_KEEPALIVE}
Endpoint = ${PUBLIC_HOST}:${wgClient.server.port}`;
