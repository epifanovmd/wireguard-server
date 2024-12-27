import dotenv from "dotenv";

dotenv.config({
  path: [`.env.${process.env.NODE_ENV || "development"}`, ".env"],
});

export const config = {
  PUBLIC_HOST: process.env.PUBLIC_HOST,
  SERVER_HOST: process.env.SERVER_HOST || "0.0.0.0",
  SERVER_PORT: Number(process.env.SERVER_PORT || 8181),
  SOCKET_PORT: process.env.SOCKET_PORT || 3232,

  RATE_LIMIT: Number(process.env.RATE_LIMIT || 1000),
  RATE_LIMIT_INTERVAL: Number(
    process.env.RATE_LIMIT_INTERVAL || 15 * 60 * 1000,
  ), // 15 minutes
  CORS_ALLOW_IPS:
    process.env.CORS_ALLOW_IPS ||
    "http://localhost:3000,https://socket-test-client.netlify.app",

  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY || "rest-api--auth-secret-key",

  WG_HOST: process.env.WG_HOST,
  WG_PATH: process.env.WG_PATH || "/etc/wireguard/",
  WG_DEFAULT_INTERFACE_PORT: Number(
    process.env.WG_DEFAULT_INTERFACE_PORT || 51820,
  ),
  WG_MTU: process.env.WG_MTU ? Number(process.env.WG_MTU) : undefined,
  WG_PERSISTENT_KEEPALIVE: process.env.WG_PERSISTENT_KEEPALIVE || 0,
  WG_DEFAULT_ADDRESS: process.env.WG_DEFAULT_ADDRESS || "10.x.x.x",
  WG_DEFAULT_DNS: process.env.WG_DEFAULT_DNS || "1.1.1.1",
  WG_ALLOWED_IPS: process.env.WG_ALLOWED_IPS || "0.0.0.0/0, ::/0",
  WG_PRE_UP: process.env.WG_PRE_UP || "",
  WG_PRE_DOWN: process.env.WG_PRE_DOWN || "",
  WG_POST_UP: process.env.WG_POST_UP || "",
  WG_POST_DOWN: process.env.WG_POST_DOWN || "",

  POSTGRES_HOST: process.env.POSTGRES_HOST || "localhost",
  POSTGRES_PORT: Number(process.env.POSTGRES_PORT || 5432),
  POSTGRES_DATABASE: process.env.POSTGRES_DATABASE || "postgres",
  POSTGRES_USER: process.env.POSTGRES_USER || "pg_user_name",
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || "pg_password",
  POSTGRES_DATA: process.env.POSTGRES_DATA || "/data/postgres",

  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@admin.com",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin",
  WEB_URL_RESET_PASSWORD:
    process.env.WEB_URL_RESET_PASSWORD ||
    "https://domain/reset-password?token={{token}}",

  WEB_AUTHN_RP_NAME: process.env.WEB_AUTHN_RP_NAME || "wireguard",
  WEB_AUTHN_RP_ID: process.env.WEB_AUTHN_RP_ID || "wireguard.force-dev.ru",
  WEB_AUTHN_RP_SCHEMA: process.env.WEB_AUTHN_RP_SCHEMA || "https",

  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  OTP_EXPIRE_MINUTES: Number(process.env.OTP_EXPIRE_MINUTES || 10),
  RESET_PASS_TOKEN_EXPIRE_MINUTES: Number(
    process.env.RESET_PASS_TOKEN_EXPIRE_MINUTES || 60,
  ),
};
