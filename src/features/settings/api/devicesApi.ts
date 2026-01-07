import { apiService } from '../../../services/ApiService';
import type { Device, DeleteDeviceResponse } from '../types';

/**
 * Get Devices endpoint function
 * Kullanıcının bağlı cihazlarını getirir
 * 
 * @returns Device[] - Bağlı cihazlar listesi
 */
export const getDevices = async (): Promise<Device[]> => {
  try {
    const response = await apiService.getClient().get<Device[]>(
      '/users/settings/devices'
    );
    return response.data;
  } catch (error: any) {
    console.error('[getDevices] API Error:', {
      url: '/users/settings/devices',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Delete Device endpoint function
 * Bağlı cihazı listeden kaldırır
 * 
 * @param deviceId - Kaldırılacak cihazın ID'si
 * @returns DeleteDeviceResponse - Silme sonucu
 */
export const deleteDevice = async (
  deviceId: string
): Promise<DeleteDeviceResponse> => {
  try {
    const response = await apiService.getClient().delete<DeleteDeviceResponse>(
      `/users/settings/devices/${deviceId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[deleteDevice] API Error:', {
      url: `/users/settings/devices/${deviceId}`,
      method: 'DELETE',
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};









