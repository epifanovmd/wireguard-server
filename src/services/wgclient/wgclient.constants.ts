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
PrivateKey = ${wgClient.privateKey} #Приватный ключ [Peer] клиента на сервере
Address = ${wgClient.address}/32 #IP-адрес [Peer] клиента на сервере
${WG_DEFAULT_DNS ? `DNS = ${WG_DEFAULT_DNS}` : ""}
${WG_MTU ? `MTU = ${WG_MTU}` : ""}

[Peer]
PublicKey = ${wgClient.server.publicKey} # Публичный ключ [Interface] сервера
PresharedKey = ${wgClient.preSharedKey}
Endpoint = ${PUBLIC_HOST}:${wgClient.server.port}
AllowedIPs = ${WG_ALLOWED_IPS} #IP-адрес сервера и порт
PersistentKeepalive = ${WG_PERSISTENT_KEEPALIVE}`;
