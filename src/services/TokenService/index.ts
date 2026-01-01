import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * TokenService
 * JWT token'ları SecureStore'da güvenli şekilde saklar ve yönetir
 */
export const TokenService = {
  /**
   * Access Token'ı SecureStore'dan getirir
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      if (token) {
        console.log('[TokenService] ✅ Access Token retrieved from SecureStore');
        console.log('[TokenService]    - Length:', token.length, 'characters');
      } else {
        console.log('[TokenService] ⚠️ No access token found in SecureStore');
      }
      return token;
    } catch (error) {
      console.error('[TokenService] ❌ Error getting access token:', error);
      return null;
    }
  },

  /**
   * Refresh Token'ı SecureStore'dan getirir
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  /**
   * Access Token ve Refresh Token'ı SecureStore'a kaydeder
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      console.log('[TokenService] 📋 Saving tokens to SecureStore...');
      console.log('[TokenService]    - Access Token Length:', accessToken.length);
      console.log('[TokenService]    - Refresh Token Length:', refreshToken.length);
      
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      
      console.log('[TokenService] ✅ Tokens saved to SecureStore');
    } catch (error) {
      console.error('[TokenService] ❌ Error setting tokens:', error);
      throw error;
    }
  },

  /**
   * Access Token'ı günceller (refresh işlemi sonrası)
   */
  async setAccessToken(accessToken: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    } catch (error) {
      console.error('Error setting access token:', error);
      throw error;
    }
  },

  /**
   * Tüm token'ları SecureStore'dan siler (logout işlemi)
   */
  async clearTokens(): Promise<void> {
    try {
      console.log('[TokenService] 📋 Clearing tokens from SecureStore...');
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      console.log('[TokenService] ✅ Tokens cleared from SecureStore');
    } catch (error) {
      console.error('[TokenService] ❌ Error clearing tokens:', error);
    }
  },
};

