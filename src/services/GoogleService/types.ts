/**
 * GoogleService Types
 * Google OAuth authentication için type tanımları
 */

export interface GoogleAuthConfig {
  webClientId: string;
  iosClientId?: string;
  androidClientId?: string;
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleAuthResult {
  idToken: string;
  accessToken?: string;
  user: GoogleUser;
}

export interface GoogleServiceState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: GoogleUser | null;
  error: Error | null;
}
