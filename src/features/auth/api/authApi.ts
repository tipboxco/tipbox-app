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

/**
 * Verify Email endpoint function
 * Email doğrulama kodu ile email'i doğrular
 * 
 * @param email - Kullanıcı email'i
 * @param code - Doğrulama kodu
 * @returns ApiLoginResponse - Token ve kullanıcı bilgileri
 */
export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  token: string;
  message: string;
}

export const verifyEmail = async (
  data: VerifyEmailRequest
): Promise<VerifyEmailResponse> => {
  try {
    const response = await apiService.getClient().post<VerifyEmailResponse>(
      '/auth/verify-email',
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('[verifyEmail] API Error:', {
      url: '/auth/verify-email',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Current User endpoint function
 * Mevcut kullanıcı bilgilerini getirir
 * 
 * @returns User - Kullanıcı bilgileri
 */
export interface CurrentUser {
  id: number;
  email: string;
  name: string;
  status: string;
  auth0Id: string | null;
  walletAddress: string | null;
  kycStatus: string;
  createdAt: string;
  updatedAt: string;
}

export const getCurrentUser = async (): Promise<CurrentUser> => {
  try {
    const response = await apiService.getClient().get<CurrentUser>('/auth/me');
    return response.data;
  } catch (error: any) {
    console.error('[getCurrentUser] API Error:', {
      url: '/auth/me',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Forgot Password endpoint function
 * Şifre sıfırlama kodu gönderir
 * 
 * @param email - Kullanıcı email'i
 * @returns Success response
 */
export interface ForgotPasswordRequest {
  mail: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export const forgotPassword = async (
  email: string
): Promise<ForgotPasswordResponse> => {
  try {
    const response = await apiService.getClient().post<ForgotPasswordResponse>(
      '/auth/forgot-password',
      { mail: email }
    );
    return response.data;
  } catch (error: any) {
    console.error('[forgotPassword] API Error:', {
      url: '/auth/forgot-password',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Verify Reset Code endpoint function
 * Şifre sıfırlama kodunu doğrular
 * 
 * @param email - Kullanıcı email'i
 * @param code - Doğrulama kodu
 * @returns Success response
 */
export interface VerifyResetCodeRequest {
  mail: string;
  code: string;
}

export interface VerifyResetCodeResponse {
  success: boolean;
  message: string;
}

export const verifyResetCode = async (
  data: VerifyResetCodeRequest
): Promise<VerifyResetCodeResponse> => {
  try {
    const response = await apiService.getClient().post<VerifyResetCodeResponse>(
      '/auth/verify-reset-code',
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('[verifyResetCode] API Error:', {
      url: '/auth/verify-reset-code',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Reset Password endpoint function
 * Şifreyi sıfırlar
 * 
 * @param email - Kullanıcı email'i
 * @param password - Yeni şifre
 * @returns Success response
 */
export interface ResetPasswordRequest {
  email: string;
  password: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export const resetPassword = async (
  data: ResetPasswordRequest
): Promise<ResetPasswordResponse> => {
  try {
    const response = await apiService.getClient().post<ResetPasswordResponse>(
      '/auth/reset-password',
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('[resetPassword] API Error:', {
      url: '/auth/reset-password',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Logout endpoint function
 * Kullanıcı çıkışı yapar
 * 
 * @returns Success response
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

export const logout = async (): Promise<LogoutResponse> => {
  try {
    const response = await apiService.getClient().post<LogoutResponse>('/auth/logout');
    return response.data;
  } catch (error: any) {
    console.error('[logout] API Error:', {
      url: '/auth/logout',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

