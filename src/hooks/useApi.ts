import { useEffect } from 'react';
import { apiService, useApiInterceptors } from '../services/ApiService';

/**
 * Global API hook'u
 * Bu hook sadece API istemcisinin yapılandırması ve interceptor'ların yönetimi için kullanılır.
 * Spesifik API çağrıları için ilgili feature'ın api.ts dosyasını veya shared API'lerini kullanın.
 */
export const useApi = () => {
  const interceptors = useApiInterceptors();

  useEffect(() => {
    apiService.setupInterceptors(interceptors);
  }, []);
}; 