import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * PERFORMANCE FIX: Memory cache for tokens
 * Reduces SecureStore reads from ~5-6 per app start to 1-2
 * Cache is invalidated on token updates/clears
 */
interface TokenCache {
  accessToken: string | null;
  refreshToken: string | null;
  isInitialized: boolean;
}

let tokenCache: TokenCache = {
  accessToken: null,
  refreshToken: null,
  isInitialized: false,
};

/**
 * TokenService
 * JWT token'ları SecureStore'da güvenli şekilde saklar ve yönetir
 * 
 * PERFORMANCE FIX: Memory cache added to reduce SecureStore reads
 * - First read: SecureStore'dan oku ve cache'e kaydet
 * - Subsequent reads: Cache'den dön (SecureStore okuma yok)
 * - Cache invalidation: Token update/clear işlemlerinde cache temizlenir
 */
export const TokenService = {
  /**
   * Access Token'ı SecureStore'dan getirir
   * PERFORMANCE FIX: Memory cache kullanarak SecureStore okumalarını azaltır
   */
  async getAccessToken(): Promise<string | null> {
    try {
      // Cache'de varsa direkt dön (SecureStore okuma yok)
      if (tokenCache.isInitialized && tokenCache.accessToken !== undefined) {
        return tokenCache.accessToken;
      }

      // Cache'de yoksa SecureStore'dan oku ve cache'e kaydet
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      tokenCache.accessToken = token;
      tokenCache.isInitialized = true;

      return token;
    } catch (error) {
      console.error('[TokenService] ❌ Error getting access token:', error);
      // Hata durumunda cache'i temizle
      tokenCache.accessToken = null;
      return null;
    }
  },

  /**
   * Refresh Token'ı SecureStore'dan getirir
   * PERFORMANCE FIX: Memory cache kullanarak SecureStore okumalarını azaltır
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      // Cache'de varsa direkt dön (SecureStore okuma yok)
      if (tokenCache.isInitialized && tokenCache.refreshToken !== undefined) {
        return tokenCache.refreshToken;
      }

      // Cache'de yoksa SecureStore'dan oku ve cache'e kaydet
      const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      tokenCache.refreshToken = token;
      tokenCache.isInitialized = true;

      return token;
    } catch (error) {
      console.error('[TokenService] ❌ Error getting refresh token:', error);
      // Hata durumunda cache'i temizle
      tokenCache.refreshToken = null;
      return null;
    }
  },

  /**
   * Access Token ve Refresh Token'ı SecureStore'a kaydeder
   * PERFORMANCE FIX: Cache'i de güncelle (sonraki okumalar cache'den döner)
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      
      // PERFORMANCE FIX: Cache'i güncelle (sonraki okumalar cache'den döner)
      tokenCache.accessToken = accessToken;
      tokenCache.refreshToken = refreshToken;
      tokenCache.isInitialized = true;
    } catch (error) {
      console.error('[TokenService] ❌ Error setting tokens:', error);
      // Hata durumunda cache'i temizle
      tokenCache.accessToken = null;
      tokenCache.refreshToken = null;
      throw error;
    }
  },

  /**
   * Access Token'ı günceller (refresh işlemi sonrası)
   * PERFORMANCE FIX: Cache'i de güncelle
   */
  async setAccessToken(accessToken: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      // PERFORMANCE FIX: Cache'i güncelle
      tokenCache.accessToken = accessToken;
      tokenCache.isInitialized = true;
    } catch (error) {
      console.error('[TokenService] ❌ Error setting access token:', error);
      // Hata durumunda cache'i temizle
      tokenCache.accessToken = null;
      throw error;
    }
  },

  /**
   * Tüm token'ları SecureStore'dan siler (logout işlemi)
   * PERFORMANCE FIX: Cache'i de temizle
   */
  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      
      // PERFORMANCE FIX: Cache'i temizle
      tokenCache.accessToken = null;
      tokenCache.refreshToken = null;
      tokenCache.isInitialized = false;
    } catch (error) {
      console.error('[TokenService] ❌ Error clearing tokens:', error);
      // Hata durumunda da cache'i temizle
      tokenCache.accessToken = null;
      tokenCache.refreshToken = null;
      tokenCache.isInitialized = false;
    }
  },
};

