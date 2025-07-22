import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiInterceptors } from '../types';

export const useApiInterceptors = (): ApiInterceptors => {
  const requestInterceptor = (config: InternalAxiosRequestConfig) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  };

  const requestErrorInterceptor = (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  };

  const responseInterceptor = (response: AxiosResponse) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  };

  const responseErrorInterceptor = (error: AxiosError) => {
    const { response } = error;

    if (response) {
      const { status } = response;
      console.error(`❌ API Error: ${status} ${response.config.url}`);

      if (status === 401) {
        console.log('🔒 Unauthorized - Token geçersiz');
      }

      if (status === 403) {
        console.log('🚫 Forbidden - Yetki yok');
      }

      if (status === 404) {
        console.log('🔍 Not Found - Kaynak bulunamadı');
      }

      if (status >= 500) {
        console.log('🔥 Server Error - Sunucu hatası');
      }
    } else {
      console.error('🌐 Network Error - Ağ bağlantısı hatası');
    }

    return Promise.reject(error);
  };

  return {
    request: {
      onFulfilled: requestInterceptor,
      onRejected: requestErrorInterceptor,
    },
    response: {
      onFulfilled: responseInterceptor,
      onRejected: responseErrorInterceptor,
    },
  };
}; 