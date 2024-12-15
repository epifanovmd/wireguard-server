import { config } from "../../../config";
import { WgClient } from "./wgclient.model";

const {
  WG_HOST,
  WG_MTU,
  WG_DEFAULT_DNS,
  WG_PERSISTENT_KEEPALIVE,
  WG_ALLOWED_IPS,
} = config;

export const getClientConfig = ({
  privateKey,
  preSharedKey,
  address,
  server,
  persistentKeepalive,
}: WgClient) => `
[Interface]
PrivateKey = ${privateKey} #Приватный ключ [Peer] клиента на сервере
Address = ${address}/32 #IP-адрес [Peer] клиента на сервере
${WG_DEFAULT_DNS ? `DNS = ${WG_DEFAULT_DNS}` : ""}
${WG_MTU ? `MTU = ${WG_MTU}` : ""}

[Peer]
PublicKey = ${server.publicKey} # Публичный ключ [Interface] сервера
PresharedKey = ${preSharedKey}
Endpoint = ${WG_HOST}:${server.port} #IP-адрес сервера и порт
AllowedIPs = ${WG_ALLOWED_IPS}
PersistentKeepalive = ${persistentKeepalive ?? WG_PERSISTENT_KEEPALIVE}`;
