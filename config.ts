export const config = {
  PUBLIC_HOST: process.env.PUBLIC_HOST,
  SERVER_HOST: process.env.SERVER_HOST || "0.0.0.0",
  SERVER_PORT: Number(process.env.SERVER_PORT || 8181),
  SOCKET_PORT: process.env.SOCKET_PORT || 3232,

  RATE_LIMIT: process.env.RATE_LIMIT || 1000,
  RATE_LIMIT_INTERVAL: process.env.RATE_LIMIT_INTERVAL || 15 * 60 * 1000, // 15 minutes
  CORS_ALLOW_IPS:
    process.env.CORS_ALLOW_IPS ||
    "http://localhost:3000,https://socket-test-client.netlify.app",

  JWT_SECRET_KEY: process.env.SOCKET_PORT || "rest-api--auth-secret-key",

  WG_PATH: process.env.WG_PATH || "/etc/wireguard/",
  WG_PORT: process.env.WG_PORT || 51820,
  WG_MTU: process.env.WG_MTU || null,
  WG_PERSISTENT_KEEPALIVE: process.env.WG_PERSISTENT_KEEPALIVE || 0,
  WG_DEFAULT_ADDRESS: process.env.WG_DEFAULT_ADDRESS || "10.8.0.x",
  WG_DEFAULT_DNS: process.env.WG_DEFAULT_DNS || "1.1.1.1",
  WG_ALLOWED_IPS: process.env.WG_ALLOWED_IPS || "0.0.0.0/0, ::/0",
  WG_PRE_UP: process.env.WG_PRE_UP || "",
  WG_PRE_DOWN: process.env.WG_PRE_DOWN || "",
  WG_POST_UP: process.env.WG_POST_UP || "",
  WG_POST_DOWN: process.env.WG_POST_DOWN || "",
};
