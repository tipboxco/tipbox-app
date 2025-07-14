// Main axios instance
export { default as apiClient } from './axios';

// Configuration
export { API_CONFIG, ENDPOINTS } from './config';

// Interceptors (automatically setup)
export { setupInterceptors } from './interceptors';

// Shared APIs
export * as userApi from './shared/user/userApi';

// Shared Types
export type * from './shared/user/types';
