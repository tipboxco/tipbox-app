import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import apiClient from './axios';

// Request interceptor - token ekleme
const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  // AsyncStorage'dan token alınabilir
  // const token = await AsyncStorage.getItem('auth_token');
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  
  console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
};

const requestErrorInterceptor = (error: AxiosError) => {
  console.error('❌ Request Error:', error);
  return Promise.reject(error);
};

// Response interceptor - error handling
const responseInterceptor = (response: AxiosResponse) => {
  console.log(`✅ API Response: ${response.status} ${response.config.url}`);
  return response;
};

const responseErrorInterceptor = (error: AxiosError) => {
  const { response } = error;
  
  if (response) {
    const { status } = response;
    console.error(`❌ API Error: ${status} ${response.config.url}`);
    
    // 401 Unauthorized - logout işlemi
    if (status === 401) {
      console.log('🔒 Unauthorized - Token geçersiz');
      // Logout logic buraya
    }
    
    // 403 Forbidden
    if (status === 403) {
      console.log('🚫 Forbidden - Yetki yok');
    }
    
    // 404 Not Found
    if (status === 404) {
      console.log('🔍 Not Found - Kaynak bulunamadı');
    }
    
    // 500 Server Error
    if (status >= 500) {
      console.log('🔥 Server Error - Sunucu hatası');
    }
  } else {
    console.error('🌐 Network Error - Ağ bağlantısı hatası');
  }
  
  return Promise.reject(error);
};

// Interceptor'ları axios instance'a ekleme
export const setupInterceptors = () => {
  apiClient.interceptors.request.use(
    requestInterceptor,
    requestErrorInterceptor
  );

  apiClient.interceptors.response.use(
    responseInterceptor,
    responseErrorInterceptor
  );
};

// Interceptor'ları başlat
setupInterceptors(); 