import { apiService } from '../../../services/ApiService';

/**
 * Wallet Response Types
 */
export interface Wallet {
  id: string;
  userId: string;
  publicAddress: string;
  provider: 'METAMASK' | 'WALLET_CONNECT' | 'COINBASE' | string;
  isConnected: boolean;
  shortAddress: string;
  providerIcon: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Connect Wallet Request
 */
export interface ConnectWalletRequest {
  publicAddress: string;
  provider: 'METAMASK' | 'WALLET_CONNECT' | 'COINBASE' | string;
}

/**
 * Wallet Balance Response
 */
export interface WalletBalance {
  balance: number;
  currency: string;
  locked: number;
  available: number;
}

/**
 * Transaction User Info
 */
export interface TransactionUser {
  id: string;
  name: string;
  avatar: string | null;
}

/**
 * Transaction Response
 */
export interface Transaction {
  id: string;
  type: 'received' | 'sent';
  amount: number;
  currency: string;
  from: TransactionUser | null;
  to: TransactionUser | null;
  reason: string | null;
  createdAt: string;
}

/**
 * Transactions Response (with pagination)
 */
export interface TransactionsResponse {
  items: Transaction[];
  pagination: {
    cursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Get Wallets endpoint function
 * Kullanıcının tüm cüzdanlarını listeler
 *
 * @returns Wallet[] - Cüzdan listesi
 */
export const getWallets = async (): Promise<Wallet[]> => {
  try {
    const response = await apiService.getClient().get<Wallet[]>('/wallets');
    return response.data;
  } catch (error: any) {
    console.error('[getWallets] API Error:', {
      url: '/wallets',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Active Wallet endpoint function
 * Aktif cüzdanı getirir
 *
 * @returns Wallet - Aktif cüzdan
 */
export const getActiveWallet = async (): Promise<Wallet> => {
  try {
    const response = await apiService.getClient().get<Wallet>('/wallets/active');
    return response.data;
  } catch (error: any) {
    console.error('[getActiveWallet] API Error:', {
      url: '/wallets/active',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Connect Wallet endpoint function
 * Cüzdan bağlar
 *
 * @param data - Connect wallet request data
 * @returns Wallet - Bağlanan cüzdan
 */
export const connectWallet = async (data: ConnectWalletRequest): Promise<Wallet> => {
  try {
    const response = await apiService.getClient().post<Wallet>('/wallets/connect', data);
    return response.data;
  } catch (error: any) {
    console.error('[connectWallet] API Error:', {
      url: '/wallets/connect',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      requestData: data,
    });
    throw error;
  }
};

/**
 * Disconnect Wallet endpoint function
 * Cüzdan bağlantısını keser
 *
 * @param walletId - Cüzdan ID'si
 * @returns Wallet - Güncellenmiş cüzdan
 */
export const disconnectWallet = async (walletId: string): Promise<Wallet> => {
  try {
    const response = await apiService.getClient().patch<Wallet>(`/wallets/${walletId}/disconnect`);
    return response.data;
  } catch (error: any) {
    console.error('[disconnectWallet] API Error:', {
      url: `/wallets/${walletId}/disconnect`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Activate Wallet endpoint function
 * Cüzdanı aktifleştirir
 *
 * @param walletId - Cüzdan ID'si
 * @returns Wallet - Güncellenmiş cüzdan
 */
export const activateWallet = async (walletId: string): Promise<Wallet> => {
  try {
    const response = await apiService.getClient().patch<Wallet>(`/wallets/${walletId}/activate`);
    return response.data;
  } catch (error: any) {
    console.error('[activateWallet] API Error:', {
      url: `/wallets/${walletId}/activate`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Delete Wallet endpoint function
 * Cüzdanı siler
 *
 * @param walletId - Cüzdan ID'si
 * @returns void - 204 No Content
 */
export const deleteWallet = async (walletId: string): Promise<void> => {
  try {
    await apiService.getClient().delete(`/wallets/${walletId}`);
  } catch (error: any) {
    console.error('[deleteWallet] API Error:', {
      url: `/wallets/${walletId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Wallet Balance endpoint function
 * Cüzdan bakiyesini getirir
 * 
 * Backend endpoint: GET /wallets/balance
 *
 * @returns WalletBalance - Cüzdan bakiyesi
 */
export const getWalletBalance = async (): Promise<WalletBalance> => {
  try {
    const response = await apiService.getClient().get<WalletBalance>('/wallets/balance');
    return response.data;
  } catch (error: any) {
    console.error('[getWalletBalance] API Error:', {
      url: '/wallets/balance',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Wallet Transactions endpoint function
 * Cüzdan işlem geçmişini getirir (pagination ile)
 * 
 * Backend endpoint: GET /wallets/transactions
 *
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns TransactionsResponse - İşlem geçmişi ve pagination bilgisi
 */
export const getWalletTransactions = async (
  cursor?: string,
  limit: number = 20
): Promise<TransactionsResponse> => {
  try {
    const params = new URLSearchParams();
    if (cursor) {
      params.append('cursor', cursor);
    }
    params.append('limit', Math.min(limit, 50).toString());

    const response = await apiService.getClient().get<TransactionsResponse>(
      `/wallets/transactions?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getWalletTransactions] API Error:', {
      url: `/wallets/transactions?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

