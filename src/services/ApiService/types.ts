import { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiConfig, ApiEndpoints } from '../../config/api.config';

export interface ApiServiceConfig {
  config: ApiConfig;
  endpoints: ApiEndpoints;
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