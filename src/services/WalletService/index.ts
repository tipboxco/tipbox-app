import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../ApiService';

const WALLET_ID_KEY = 'wallet_id';
const WALLET_IDENTIFIER_KEY = 'wallet_identifier';
const WALLET_CONNECTED_KEY = 'wallet_connected'; // Backward compatibility

interface WalletInfo {
  walletId: string;
  walletIdentifier: string;
}

interface CreateWalletResponse {
  walletId: string;
  walletIdentifier: string;
  provider: string;
  balance: number;
}

/**
 * WalletService
 * Wallet lifecycle yönetimi
 * 
 * Web2 Aşaması: Backend API ile wallet oluşturma ve yönetme
 * Web3 Aşaması: Thirdweb embedded wallet entegrasyonu
 * 
 * Not: createWallet() metodu login sonrası otomatik çağrılır
 */
export const WalletService = {
  /**
   * Wallet oluştur (login sonrası otomatik çağrılır)
   * 
   * Web2: Backend'e POST /wallet/create
   * Web3: Thirdweb embedded wallet çağrısı
   * 
   * @param userId - Kullanıcı ID'si
   * @returns Wallet bilgileri (walletId, walletIdentifier)
   */
  async createWallet(userId: string): Promise<WalletInfo> {
    try {
      console.log('[WalletService] 📋 Wallet oluşturuluyor...', { userId });
      
      // Backend'e wallet create request
      // Not: Backend'de endpoint çoğul: /wallets/create
      const response = await apiService.getClient().post<CreateWalletResponse>('/wallets/create', {
        userId,
      });
      
      const { walletId, walletIdentifier } = response.data;
      
      // AsyncStorage'a kaydet
      await Promise.all([
        AsyncStorage.setItem(WALLET_ID_KEY, walletId),
        AsyncStorage.setItem(WALLET_IDENTIFIER_KEY, walletIdentifier),
        AsyncStorage.setItem(WALLET_CONNECTED_KEY, 'true'), // Backward compatibility
      ]);
      
      console.log('[WalletService] ✅ Wallet oluşturuldu:', {
        walletId,
        walletIdentifier,
      });
      
      return { walletId, walletIdentifier };
    } catch (error: any) {
      console.error('[WalletService] ❌ Wallet oluşturma hatası:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },

  /**
   * Wallet bilgilerini AsyncStorage'dan getirir
   * 
   * @returns Wallet bilgileri veya null (wallet yoksa)
   */
  async getWalletInfo(): Promise<WalletInfo | null> {
    try {
      const [walletId, walletIdentifier] = await Promise.all([
        AsyncStorage.getItem(WALLET_ID_KEY),
        AsyncStorage.getItem(WALLET_IDENTIFIER_KEY),
      ]);

      if (!walletId || !walletIdentifier) {
        console.log('[WalletService] ⚠️ Wallet bilgisi bulunamadı');
        return null;
      }

      return { walletId, walletIdentifier };
    } catch (error) {
      console.error('[WalletService] ❌ Wallet bilgisi okuma hatası:', error);
      return null;
    }
  },

  /**
   * Wallet bilgilerini AsyncStorage'dan temizler (logout işlemi)
   */
  async clearWallet(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(WALLET_ID_KEY),
        AsyncStorage.removeItem(WALLET_IDENTIFIER_KEY),
        AsyncStorage.removeItem(WALLET_CONNECTED_KEY), // Backward compatibility
      ]);
      console.log('[WalletService] ✅ Wallet bilgileri temizlendi');
    } catch (error) {
      console.error('[WalletService] ❌ Wallet temizleme hatası:', error);
    }
  },

  // Backward compatibility methods
  /**
   * @deprecated Geriye dönük uyumluluk için. Bunun yerine getWalletInfo() kullanın.
   */
  async getWalletConnectionStatus(): Promise<boolean> {
    const walletInfo = await this.getWalletInfo();
    return walletInfo !== null;
  },

  /**
   * @deprecated Geriye dönük uyumluluk için. Bunun yerine createWallet() kullanın.
   */
  async setWalletConnectionStatus(isConnected: boolean): Promise<void> {
    await AsyncStorage.setItem(WALLET_CONNECTED_KEY, String(isConnected));
  },

  /**
   * @deprecated Geriye dönük uyumluluk için. Bunun yerine clearWallet() kullanın.
   */
  async clearWalletConnection(): Promise<void> {
    await this.clearWallet();
  },
};
