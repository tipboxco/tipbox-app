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
    const response = await apiService.getClient().get<any>(
      '/users/settings/notifications'
    );
    
    // Handle different response formats
    let settingsArray: NotificationSetting[] = [];
    
    if (Array.isArray(response.data)) {
      // Direct array response
      settingsArray = response.data;
    } else if (response.data && typeof response.data === 'object') {
      // Object response - check for common patterns
      if (Array.isArray(response.data.data)) {
        // Wrapped in { data: [...] }
        settingsArray = response.data.data;
      } else if (Array.isArray(response.data.settings)) {
        // Wrapped in { settings: [...] }
        settingsArray = response.data.settings;
      } else if (response.data.success && Array.isArray(response.data.data)) {
        // Wrapped in { success: true, data: [...] }
        settingsArray = response.data.data;
      } else {
        // Log the actual response format for debugging
        if (__DEV__) {
          console.warn('[getNotificationSettings] API returned unexpected format:', {
            type: typeof response.data,
            isArray: Array.isArray(response.data),
            keys: response.data ? Object.keys(response.data) : [],
            sample: JSON.stringify(response.data).substring(0, 200),
          });
        }
        return [];
      }
    } else {
      // Not an array or object
      if (__DEV__) {
        console.warn('[getNotificationSettings] API returned non-array/non-object data:', {
          type: typeof response.data,
          value: response.data,
        });
      }
      return [];
    }
    
    // Validate array items have required fields
    const validSettings = settingsArray.filter((item: any) => 
      item && typeof item.notificationCode === 'number' && typeof item.value === 'boolean'
    );
    
    if (validSettings.length !== settingsArray.length && __DEV__) {
      console.warn('[getNotificationSettings] Some items were filtered out due to invalid format');
    }
    
    return validSettings;
  } catch (error: any) {
    // CRITICAL FIX: 404 hatası için log gösterme (endpoint henüz implement edilmemiş)
    if (error.response?.status !== 404) {
      console.error('[getNotificationSettings] API Error:', {
        url: '/users/settings/notifications',
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
    }
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







