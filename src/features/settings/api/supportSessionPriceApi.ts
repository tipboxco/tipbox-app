import { apiService } from '../../../services/ApiService';
import type { SupportSessionPriceResponse, UpdateSupportSessionPriceRequest, UpdateSupportSessionPriceResponse } from '../types';

/**
 * Get Support Session Price endpoint function
 * Kullanıcının destek oturumu fiyatını getirir
 * 
 * @returns SupportSessionPriceResponse - Destek oturumu fiyatı
 */
export const getSupportSessionPrice = async (): Promise<SupportSessionPriceResponse> => {
  try {
    const response = await apiService.getClient().get<SupportSessionPriceResponse>(
      '/users/settings/support-session-price'
    );
    return response.data;
  } catch (error: any) {
    console.error('[getSupportSessionPrice] API Error:', {
      url: '/users/settings/support-session-price',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Update Support Session Price endpoint function
 * Kullanıcının destek oturumu fiyatını günceller
 * Minimum 50 TIPS olmalı ve 10 günde bir değiştirilebilir
 * 
 * @param data - Update support session price request data
 * @returns UpdateSupportSessionPriceResponse - Güncelleme sonucu
 */
export const updateSupportSessionPrice = async (
  data: UpdateSupportSessionPriceRequest
): Promise<UpdateSupportSessionPriceResponse> => {
  try {
    const response = await apiService.getClient().put<UpdateSupportSessionPriceResponse>(
      '/users/settings/support-session-price',
      { price: data.price }
    );
    return response.data;
  } catch (error: any) {
    console.error('[updateSupportSessionPrice] API Error:', {
      url: '/users/settings/support-session-price',
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







