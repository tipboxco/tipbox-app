export const API_CONFIG = {
  BASE_URL: "http://192.168.1.159:3000", //'http://188.245.150.117:3000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export type ApiConfig = typeof API_CONFIG;