import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../../config/api.config';
import { ApiInterceptors, ApiServiceConfig, IApiService } from './types';
import { setupApiInterceptors } from './interceptors';

// React Native için fetch adapter kullan
// Bu, React Native'de network isteklerinin düzgün çalışmasını sağlar
if (typeof XMLHttpRequest === 'undefined') {
  // React Native ortamında XMLHttpRequest yok, fetch kullan
  const { default: fetchAdapter } = require('axios/lib/adapters/xhr');
  // Not: React Native'de axios otomatik olarak doğru adapter'ı seçer
}

class ApiService implements IApiService {
  private static instance: ApiService;
  public client: AxiosInstance;
  private config: ApiServiceConfig;

  private constructor() {
    this.config = {
      config: API_CONFIG,
    };

    this.client = axios.create({
      baseURL: this.config.config.BASE_URL,
      timeout: this.config.config.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // React Native için adapter ayarı
      adapter: undefined, // Axios otomatik olarak doğru adapter'ı seçer
    });

    // JWT ve Refresh Token interceptor'larını otomatik olarak kur
    // Client'ı parametre olarak geçiyoruz (circular dependency'yi önlemek için)
    setupApiInterceptors(this.client);
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public setupInterceptors(interceptors: ApiInterceptors): void {
    this.client.interceptors.request.use(
      interceptors.request.onFulfilled,
      interceptors.request.onRejected
    );

    this.client.interceptors.response.use(
      interceptors.response.onFulfilled,
      interceptors.response.onRejected
    );
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiService = ApiService.getInstance();
export * from './types';
export * from './interceptors'; 