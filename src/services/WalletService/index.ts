import AsyncStorage from '@react-native-async-storage/async-storage';

const WALLET_CONNECTED_KEY = 'wallet_connected';

/**
 * WalletService
 * Wallet bağlantı durumunu AsyncStorage'da yönetir
 * Logout olana kadar connected bilgisini tutar
 */
export const WalletService = {
  /**
   * Wallet bağlantı durumunu AsyncStorage'dan getirir
   */
  async getWalletConnectionStatus(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(WALLET_CONNECTED_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error getting wallet connection status:', error);
      return false;
    }
  },

  /**
   * Wallet bağlantı durumunu AsyncStorage'a kaydeder
   */
  async setWalletConnectionStatus(isConnected: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(WALLET_CONNECTED_KEY, String(isConnected));
    } catch (error) {
      console.error('Error setting wallet connection status:', error);
      throw error;
    }
  },

  /**
   * Wallet bağlantı durumunu AsyncStorage'dan siler (logout işlemi)
   */
  async clearWalletConnection(): Promise<void> {
    try {
      await AsyncStorage.removeItem(WALLET_CONNECTED_KEY);
    } catch (error) {
      console.error('Error clearing wallet connection:', error);
    }
  },
};

