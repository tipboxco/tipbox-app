import AsyncStorage from '@react-native-async-storage/async-storage';

const REMEMBERED_EMAIL_KEY = 'remembered_email';

/**
 * LoginCredentialsService
 * Kullanıcının email adresini AsyncStorage'da saklar ve yönetir
 * Şifre güvenlik nedeniyle saklanmaz, sadece email saklanır
 */
export const LoginCredentialsService = {
  /**
   * Email'i AsyncStorage'a kaydeder
   */
  async saveEmail(email: string): Promise<void> {
    try {
      await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    } catch (error) {
      console.error('[LoginCredentialsService] ❌ Error saving email:', error);
    }
  },

  /**
   * AsyncStorage'dan email'i getirir
   */
  async getEmail(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(REMEMBERED_EMAIL_KEY);
    } catch (error) {
      console.error('[LoginCredentialsService] ❌ Error getting email:', error);
      return null;
    }
  },

  /**
   * Email'i AsyncStorage'dan siler (logout veya remember me kapatıldığında)
   */
  async clearEmail(): Promise<void> {
    try {
      await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
    } catch (error) {
      console.error('[LoginCredentialsService] ❌ Error clearing email:', error);
    }
  },
};
