// Environment variable'dan API_BASE_URL al, yoksa default kullan
// React Native'de @env modülü ile environment variable'lar okunur
let baseUrl = 'http://10.5.49.172:3000';

try {
  // @env modülünden API_BASE_URL'i oku
  const { API_BASE_URL } = require('@env');
  if (API_BASE_URL && typeof API_BASE_URL === 'string' && API_BASE_URL.trim() !== '') {
    baseUrl = API_BASE_URL.trim();
    console.log('[API Config] ✅ Using API_BASE_URL from environment:', baseUrl);
  } else {
    console.log('[API Config] ⚠️ API_BASE_URL not found in environment, using default:', baseUrl);
  }
} catch (error) {
  // @env modülü yoksa veya hata varsa default kullan
  console.log('[API Config] ⚠️ Could not load @env, using default BASE_URL:', baseUrl);
  console.log('[API Config] 💡 Tip: Create .env.development file with API_BASE_URL=http://YOUR_IP:3000');
}

// Android Emulator için özel durum: 10.0.2.2 kullanılmalı
// iOS Simulator için localhost veya IP adresi çalışır
// Gerçek cihaz için bilgisayarın IP adresi kullanılmalı
export const API_CONFIG = {
  BASE_URL: baseUrl,
  TIMEOUT: 30000, // 30 saniye - büyük veri döndüren endpoint'ler için yeterli süre
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export type ApiConfig = typeof API_CONFIG;

// Debug için BASE_URL'i logla
console.log('[API Config] 📡 API Base URL:', API_CONFIG.BASE_URL);
 
