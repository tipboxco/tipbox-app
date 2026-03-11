export const API_CONFIG = {
  BASE_URL: 'https://api-test.tipbox.co/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  // Media base URL - tüm ortamlar için aynı
  MEDIA_BASE_URL: 'https://api-test.tipbox.co/media',
};

export type ApiConfig = typeof API_CONFIG;
 
