import axios, { AxiosInstance } from 'axios';
import { API_CONFIG, ENDPOINTS } from '../../config/api.config';
import { ApiInterceptors, ApiServiceConfig, IApiService } from './types';

class ApiService implements IApiService {
  private static instance: ApiService;
  public client: AxiosInstance;
  private config: ApiServiceConfig;

  private constructor() {
    this.config = {
      config: API_CONFIG,
      endpoints: ENDPOINTS,
    };

    this.client = axios.create({
      baseURL: this.config.config.BASE_URL,
      timeout: this.config.config.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
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
export * from './hooks/useApiInterceptors'; 