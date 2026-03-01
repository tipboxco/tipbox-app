export const API_CONFIG = {
  BASE_URL: 'https://api.tipbox.co',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export type ApiConfig = typeof API_CONFIG;
 
