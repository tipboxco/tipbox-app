import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const ENCRYPTED_PASSWORD_KEY = 'encrypted_password';

/**
 * BiometricService
 * Face ID / Touch ID ile şifre saklama ve doğrulama işlemlerini yönetir
 */
export const BiometricService = {
  /**
   * Cihazda biometrik kimlik doğrulama desteği olup olmadığını kontrol eder
   */
  async isAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch (error) {
      console.error('[BiometricService] ❌ Error checking availability:', error);
      return false;
    }
  },

  /**
   * Biometrik kimlik doğrulama türünü getirir (Face ID, Touch ID, Fingerprint, etc.)
   */
  async getBiometricType(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('[BiometricService] ❌ Error getting biometric type:', error);
      return [];
    }
  },

  /**
   * Biometrik kimlik doğrulama ile şifreyi doğrular ve şifreyi döndürür
   * @returns Şifre veya null (başarısız olursa)
   */
  async authenticateAndGetPassword(): Promise<string | null> {
    try {
      // Önce biometrik desteği kontrol et
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        console.log('[BiometricService] ⚠️ Biometric authentication not available');
        return null;
      }

      // Biometrik kimlik doğrulama yap
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Şifrenizi açmak için kimlik doğrulaması yapın',
        cancelLabel: 'İptal',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        console.log('[BiometricService] ❌ Biometric authentication failed');
        return null;
      }

      // Başarılı olduysa şifreyi SecureStore'dan al
      const encryptedPassword = await SecureStore.getItemAsync(ENCRYPTED_PASSWORD_KEY);
      if (!encryptedPassword) {
        console.log('[BiometricService] ⚠️ No saved password found');
        return null;
      }

      // Şifreyi döndür (şimdilik şifreleme yapmıyoruz, güvenlik için daha sonra eklenebilir)
      return encryptedPassword;
    } catch (error) {
      console.error('[BiometricService] ❌ Error authenticating:', error);
      return null;
    }
  },

  /**
   * Şifreyi SecureStore'a kaydeder (biometrik ile açılabilir)
   */
  async savePassword(password: string): Promise<void> {
    try {
      // Şifreyi SecureStore'a kaydet (güvenli depolama)
      await SecureStore.setItemAsync(ENCRYPTED_PASSWORD_KEY, password);
      
      // Biometrik özelliğinin aktif olduğunu işaretle
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    } catch (error) {
      console.error('[BiometricService] ❌ Error saving password:', error);
      throw error;
    }
  },

  /**
   * Biometrik özelliğinin aktif olup olmadığını kontrol eder
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('[BiometricService] ❌ Error checking biometric enabled:', error);
      return false;
    }
  },

  /**
   * Kaydedilmiş şifreyi temizler (logout veya biometrik kapatıldığında)
   */
  async clearPassword(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ENCRYPTED_PASSWORD_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    } catch (error) {
      console.error('[BiometricService] ❌ Error clearing password:', error);
    }
  },
};
