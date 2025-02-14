import { config } from "../../../config";
import { IWgClientsDto } from "../wgclient/wgclient.model";
import { IWgServerDto } from "../wgserver/wgserver.model";

const { WG_PRE_UP, WG_POST_UP, WG_PRE_DOWN, WG_POST_DOWN } = config;

export const getWireguardSeverBlockConfig = (server: IWgServerDto) => {
  return `
# Note: Do not edit this file directly.
# Your changes will be overwritten!

# Server
[Interface]
PrivateKey = ${server.privateKey} # Приватный ключ сервера
Address = ${server.address}/24 # Адрес VPN-сервера в частной сети
ListenPort = ${server.port} # Порт, который будет слушать VPN-сервер
PreUp = ${WG_PRE_UP}
PreDown = ${WG_PRE_DOWN}
PostUp = ${WG_POST_UP}
PostDown = ${WG_POST_DOWN}
`;
};

export const getWireguardPeersConfig = (client: IWgClientsDto) => {
  return `

# Client: ${client.name} (${client.id})
[Peer]
PublicKey = ${client.publicKey} # Публичный ключ клиента
PresharedKey = ${client.preSharedKey}
AllowedIPs = ${client.address}/32 # IP-адрес в частной сети, который будет присвоен клиенту
`;
};
