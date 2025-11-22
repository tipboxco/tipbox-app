/**
 * TokenService type definitions
 */

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

