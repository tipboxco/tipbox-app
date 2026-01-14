export const API_CONFIG = { // Environment variable'dan al (öncelikli)
    BASE_URL: 'https://api-test.tipbox.co',
    TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export type ApiConfig = typeof API_CONFIG;
 