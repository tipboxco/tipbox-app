import { Credentials } from 'react-native-auth0';

export interface Auth0User {
  email?: string;
  emailVerified?: boolean;
  name?: string;
  nickname?: string;
  picture?: string;
  sub?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface Auth0ServiceState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: Auth0User | null;
  error: Error | null;
}

export interface Auth0Credentials extends Credentials {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
  scope?: string;
  tokenType?: string;
}

export interface Auth0ServiceConfig {
  domain: string;
  clientId: string;
  audience?: string;
} 