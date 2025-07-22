export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://localhost:3000/api' : 'https://your-api.com/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
  },
} as const;

export type ApiConfig = typeof API_CONFIG;
export type ApiEndpoints = typeof ENDPOINTS; 