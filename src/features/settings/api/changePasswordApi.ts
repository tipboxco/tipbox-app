import { apiService } from '../../../services/ApiService';
import type { ChangePasswordRequest, ChangePasswordResponse } from '../types';

/**
 * Change Password endpoint function
 * Kullanıcı şifre değiştirme işlemi için API çağrısı
 * 
 * @param credentials - Şifre değiştirme bilgileri (currentPassword, newPassword)
 * @returns ChangePasswordResponse - Şifre değiştirme sonucu
 */
export const changePassword = async (
  credentials: ChangePasswordRequest
): Promise<ChangePasswordResponse> => {
  try {
    const response = await apiService.getClient().post<ChangePasswordResponse>(
      '/users/settings/change-password',
      credentials
    );
    return response.data;
  } catch (error: any) {
    console.error('[changePassword] API Error:', {
      url: '/users/settings/change-password',
      method: 'POST',
      status: error.response?.status,
      statusText: error.response?.statusText,
      requestData: { currentPassword: '***', newPassword: '***' }, // Şifreleri loglamıyoruz
      responseData: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

