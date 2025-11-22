import { apiService } from '../../../services/ApiService';
import type { RegisterCredentials, LoginCredentials } from '../../../types/auth';
import type { RegisterResponse, LoginResponse } from '../types';

/**
 * Register endpoint function
 * Kullanıcı kayıt işlemi için API çağrısı
 * 
 * @param credentials - Kayıt bilgileri (email, password, name)
 * @returns RegisterResponse - Kayıt sonucu
 */
export const register = async (
  credentials: RegisterCredentials
): Promise<RegisterResponse> => {
  const response = await apiService.getClient().post<RegisterResponse>(
    '/auth/register',
    credentials
  );
  return response.data;
};

/**
 * Login endpoint function
 * Kullanıcı giriş işlemi için API çağrısı
 * 
 * @param credentials - Giriş bilgileri (email, password)
 * @returns LoginResponse - Giriş sonucu (user, accessToken, refreshToken)
 */
export const login = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const response = await apiService.getClient().post<LoginResponse>(
    '/auth/login',
    credentials
  );
  return response.data;
};

