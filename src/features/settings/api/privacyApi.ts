import { apiService } from '../../../services/ApiService';
import type { PrivacySetting, UpdatePrivacySettingsRequest, UpdatePrivacySettingsResponse } from '../types';

/**
 * Get Privacy Settings endpoint function
 * Kullanıcının gizlilik ayarlarını getirir
 * 
 * @returns PrivacySetting[] - Gizlilik ayarları listesi
 */
export const getPrivacySettings = async (): Promise<PrivacySetting[]> => {
  try {
    const response = await apiService.getClient().get<PrivacySetting[]>(
      '/users/settings/privacy'
    );
    return response.data;
  } catch (error: any) {
    console.error('[getPrivacySettings] API Error:', {
      url: '/users/settings/privacy',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Update Privacy Settings endpoint function
 * Kullanıcının gizlilik ayarlarını günceller
 * 
 * @param data - Update privacy settings request data
 * @returns UpdatePrivacySettingsResponse - Güncelleme sonucu
 */
export const updatePrivacySettings = async (
  data: UpdatePrivacySettingsRequest
): Promise<UpdatePrivacySettingsResponse> => {
  try {
    const response = await apiService.getClient().put<UpdatePrivacySettingsResponse>(
      '/users/settings/privacy',
      data.settings
    );
    return response.data;
  } catch (error: any) {
    console.error('[updatePrivacySettings] API Error:', {
      url: '/users/settings/privacy',
      method: 'PUT',
      status: error.response?.status,
      statusText: error.response?.statusText,
      requestData: data,
      responseData: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};



