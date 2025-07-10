import apiClient from '../../../api/axios';
import { ENDPOINTS } from '../../../api/config';

// Auth-specific types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
    };
    token: string;
  };
  message?: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    token: string;
  };
  message?: string;
}

// Login
export const login = async (credentials: LoginRequest): Promise<AuthResponse['data']> => {
  const response = await apiClient.post<AuthResponse>(
    ENDPOINTS.AUTH.LOGIN, 
    credentials
  );
  return response.data.data;
};

// Register
export const register = async (userData: RegisterRequest): Promise<AuthResponse['data']> => {
  const response = await apiClient.post<AuthResponse>(
    ENDPOINTS.AUTH.REGISTER, 
    userData
  );
  return response.data.data;
};

// Logout
export const logout = async (): Promise<void> => {
  await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
};

// Refresh Token
export const refreshToken = async (): Promise<string> => {
  const response = await apiClient.post<RefreshTokenResponse>(
    ENDPOINTS.AUTH.REFRESH
  );
  return response.data.data.token;
}; 