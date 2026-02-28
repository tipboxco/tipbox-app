import { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiConfig } from '../../config/api.config';

export interface ApiServiceConfig {
  config: ApiConfig;
}

export interface ApiInterceptors {
  request: {
    onFulfilled: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
    onRejected: (error: AxiosError) => Promise<AxiosError>;
  };
  response: {
    onFulfilled: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
    onRejected: (error: AxiosError) => Promise<AxiosError>;
  };
}

export interface IApiService {
  client: AxiosInstance;
  setupInterceptors: (interceptors: ApiInterceptors) => void;
  getClient: () => AxiosInstance;
}

/**
 * Backend standart response format (success)
 * Backend artik tum basarili response'lari bu formatta doner
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Backend standart response format (error)
 * Backend artik tum hata response'larini bu formatta doner
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
} 