export const API_CONFIG = { // Environment variable'dan al (öncelikli)
    BASE_URL: 'http://192.168.1.178:3000',
    TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export type ApiConfig = typeof API_CONFIG;
 
