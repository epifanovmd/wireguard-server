const WG_DEFAULT_ADDRESS = process.env.WG_DEFAULT_ADDRESS || "10.8.0.x";
const WG_DEVICE = process.env.WG_DEVICE || "eth0";

export const config = {
  WG_PATH: process.env.WG_PATH || "/etc/wireguard/",
  WG_DEVICE,
  WG_HOST: process.env.WG_HOST,
  WG_PORT: process.env.WG_PORT || 51820,
  WG_MTU: process.env.WG_MTU || null,
  WG_PERSISTENT_KEEPALIVE: process.env.WG_PERSISTENT_KEEPALIVE || 0,
  WG_DEFAULT_ADDRESS,
  WG_DEFAULT_DNS: process.env.WG_DEFAULT_DNS || "1.1.1.1",
  WG_ALLOWED_IPS: process.env.WG_ALLOWED_IPS || "0.0.0.0/0, ::/0",
  WG_PRE_UP: process.env.WG_PRE_UP || "",
  WG_PRE_DOWN: process.env.WG_PRE_DOWN || "",
  WG_POST_UP:
    process.env.WG_POST_UP ||
    `
iptables -t nat -A POSTROUTING -s ${WG_DEFAULT_ADDRESS.replace(
      "x",
      "0",
    )}/24 -o ${WG_DEVICE} -j MASQUERADE;
iptables -A INPUT -p udp -m udp --dport 51820 -j ACCEPT;
iptables -A FORWARD -i wg0 -j ACCEPT;
iptables -A FORWARD -o wg0 -j ACCEPT;
`
      .split("\n")
      .join(" "),
  WG_POST_DOWN: process.env.WG_POST_DOWN || "",
};
