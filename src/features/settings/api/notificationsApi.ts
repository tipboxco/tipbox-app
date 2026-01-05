import { apiService } from '../../../services/ApiService';
import type { NotificationSetting, UpdateNotificationSettingsRequest, UpdateNotificationSettingsResponse } from '../types';

/**
 * Get Notification Settings endpoint function
 * Kullanıcının bildirim ayarlarını getirir
 * 
 * @returns NotificationSetting[] - Bildirim ayarları listesi
 */
export const getNotificationSettings = async (): Promise<NotificationSetting[]> => {
  try {
    const response = await apiService.getClient().get<NotificationSetting[]>(
      '/users/settings/notifications'
    );
    // Güvenlik kontrolü: Response array değilse boş array döndür
    if (!Array.isArray(response.data)) {
      console.warn('[getNotificationSettings] API response is not an array:', response.data);
      return [];
    }
    return response.data;
  } catch (error: any) {
    console.error('[getNotificationSettings] API Error:', {
      url: '/users/settings/notifications',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Update Notification Settings endpoint function
 * Kullanıcının bildirim ayarlarını günceller
 * 
 * @param data - Update notification settings request data
 * @returns UpdateNotificationSettingsResponse - Güncelleme sonucu
 */
export const updateNotificationSettings = async (
  data: UpdateNotificationSettingsRequest
): Promise<UpdateNotificationSettingsResponse> => {
  try {
    const response = await apiService.getClient().put<UpdateNotificationSettingsResponse>(
      '/users/settings/notifications',
      data.settings
    );
    return response.data;
  } catch (error: any) {
    console.error('[updateNotificationSettings] API Error:', {
      url: '/users/settings/notifications',
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








