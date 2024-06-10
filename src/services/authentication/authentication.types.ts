export interface AuthClient {
  id: string;
  login: string;
  name: string;
}

export interface AuthRequest {
  login: string;
  password: string;
}

export interface RegistrationRequest extends AuthRequest {
  name: string;
}

export type AuthResponse = AuthClient;

export type RedisClient = AuthClient & AuthRequest & { salt: string };
