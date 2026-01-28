export const API_CONFIG = { // Environment variable'dan al (öncelikli)
    BASE_URL: 'http://192.168.1.163:3000',
    TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export type ApiConfig = typeof API_CONFIG;

// Debug için BASE_URL'i logla
console.log('[API Config] 📡 API Base URL:', API_CONFIG.BASE_URL);
 
