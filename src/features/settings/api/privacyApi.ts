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
    const response = await apiService.getClient().get<any>(
      '/users/settings/privacy'
    );
    
    // Handle different response formats
    let settingsArray: PrivacySetting[] = [];
    
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
          console.warn('[getPrivacySettings] API returned unexpected format:', {
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
        console.warn('[getPrivacySettings] API returned non-array/non-object data:', {
          type: typeof response.data,
          value: response.data,
        });
      }
      return [];
    }
    
    // Validate array items have required fields
    const validSettings = settingsArray.filter((item: any) => 
      item && typeof item.privacyCode === 'number' && typeof item.selectedValue === 'string'
    );
    
    if (validSettings.length !== settingsArray.length && __DEV__) {
      console.warn('[getPrivacySettings] Some items were filtered out due to invalid format');
    }
    
    return validSettings;
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







