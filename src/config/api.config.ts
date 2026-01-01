// Environment variable'dan API URL'ini al, yoksa fallback kullan
// Fiziksel cihazlar için: Host makinenin LAN IP'si kullanılmalı
// Android Emülatör için: 10.0.2.2 (host makinenin localhost'una erişim)
// Docker container adları (api, localhost, 127.0.0.1) fiziksel cihazlarda çalışmaz!
const getBaseUrl = (): string => {
  // Environment variable'dan al (öncelikli)
  if (typeof process !== 'undefined' && process.env?.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  // @env modülünden al (react-native-dotenv)
  try {
    const env = require('@env');
    if (env?.API_BASE_URL) {
      return env.API_BASE_URL;
    }
  } catch (e) {
    // @env modülü yoksa devam et
  }
  
  // Platform ve cihaz tipi kontrolü
  try {
    const Device = require('expo-device');
    const { Platform } = require('react-native');
    const port = process.env?.API_PORT || process.env?.PORT || '3000';
    
    // Android Emülatör kontrolü
    if (Platform.OS === 'android' && Device.isDevice === false) {
      // Android Emülatör: 10.0.2.2 host makinenin localhost'una erişim sağlar
      const baseUrl = `http://10.0.2.2:${port}`;
      console.log('[API Config] ========================================');
      console.log('[API Config] ✅ Android Emülatör Tespit Edildi');
      console.log('[API Config] ========================================');
      console.log('[API Config]    - Platform: Android Emulator');
      console.log('[API Config]    - Emulator IP: 10.0.2.2 (host localhost)');
      console.log('[API Config]    - Port:', port);
      console.log('[API Config]    - Base URL:', baseUrl);
      console.log('[API Config] ========================================');
      return baseUrl;
    }
    
    // Fiziksel cihaz kontrolü (Expo Go veya development build)
    if (Device.isDevice === true || __DEV__) {
      // Fiziksel cihazlar için host makinenin LAN IP'si kullanılmalı
      // ⚠️ DİKKAT: Bu IP Docker container adı değil, host makinenin LAN IP'si olmalı!
      // Fiziksel cihazlar Docker internal network'ü göremez
      // Windows'ta ipconfig ile alınan LAN IP'si (örn: 192.168.1.195)
      const LAN_IP = '192.168.1.195'; // Host makinenin LAN IP'si
      const baseUrl = `http://${LAN_IP}:${port}`;
      console.log('[API Config] ========================================');
      console.log('[API Config] ✅ Fiziksel Cihaz / Expo Go Tespit Edildi');
      console.log('[API Config] ========================================');
      console.log('[API Config]    - Platform:', Platform.OS);
      console.log('[API Config]    - Device Type:', Device.isDevice ? 'Physical Device' : 'Simulator/Emulator');
      console.log('[API Config]    - LAN IP:', LAN_IP);
      console.log('[API Config]    - Port:', port);
      console.log('[API Config]    - Base URL:', baseUrl);
      console.log('[API Config]    - ⚠️ Backend bu IP\'de erişilebilir olmalı!');
      console.log('[API Config] ========================================');
      return baseUrl;
    }
  } catch (e) {
    // expo-device yoksa veya hata varsa devam et
    console.warn('[API Config] ⚠️ Platform kontrolü yapılamadı:', e);
  }
  
  // Fallback: Development için LAN IP
  const LAN_IP = '192.168.1.195'; // Host makinenin LAN IP'si
  const port = process.env?.API_PORT || process.env?.PORT || '3000';
  const baseUrl = `http://${LAN_IP}:${port}`;
  console.log('[API Config] ⚠️ Fallback kullanılıyor:', baseUrl);
  return baseUrl;
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export type ApiConfig = typeof API_CONFIG;