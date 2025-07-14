// Auth feature'a özel tipler

import type { User, LoginCredentials, RegisterCredentials } from '@/src/types';

// Auth Store Types
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

// Auth Form Types
export interface LoginFormData extends LoginCredentials {
  rememberMe?: boolean;
}

export interface RegisterFormData extends RegisterCredentials {
  confirmPassword: string;
  acceptTerms: boolean;
}

// Auth API Types
export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

// Auth Error Types
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'EMAIL_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}
