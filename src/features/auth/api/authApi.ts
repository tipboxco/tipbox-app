import { apiService } from '../../../services/ApiService';
import type { RegisterCredentials, LoginCredentials } from '../../../types/auth';
import type { 
  RegisterResponse, 
  LoginResponse,
  ApiLoginResponse,
  ApiRegisterResponse 
} from '../types';

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
  const response = await apiService.getClient().post<ApiRegisterResponse>(
    '/auth/register',
    credentials
  );

  // API response'unu beklenen formata transform et
  const transformedResponse: RegisterResponse = {
    user: {
      id: response.data.id,
      name: response.data.fullName,
      email: response.data.email,
      isGuest: false,
    },
    message: response.data.message || 'Kayıt işlemi başarıyla tamamlandı',
  };

  return transformedResponse;
};

/**
 * Login endpoint function
 * Kullanıcı giriş işlemi için API çağrısı
 * 
 * @param credentials - Giriş bilgileri (email, password)
 * @returns ApiLoginResponse - Backend'den gelen ham response (store'da kullanılacak)
 */
export const login = async (
  credentials: LoginCredentials
): Promise<ApiLoginResponse> => {
  const response = await apiService.getClient().post<ApiLoginResponse>(
    '/auth/login',
    credentials
  );

  // Backend'den gelen ham response'u direkt döndür (store'da transform edilecek)
  return response.data;
};

