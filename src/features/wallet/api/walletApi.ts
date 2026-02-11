import { apiService } from '../../../services/ApiService';

/**
 * ============================================
 * WEB2-READY WALLET API
 * ============================================
 * 
 * Bu dosya Web2 motor ile çalışacak şekilde hazırlanmıştır.
 * Endpoint isimleri ve response formatları Web3'e geçiş için hazır.
 * 
 * Şimdi: Backend ledger sistemi
 * Sonra: Thirdweb + Smart Contract
 */

/**
 * Wallet Info Response (Web2-Ready)
 */
export interface WalletInfo {
  walletId: string;
  walletIdentifier: string; // Şimdi: fake address, Sonra: real blockchain address
  provider: string; // Şimdi: 'CUSTOM', Sonra: 'thirdweb'
  balance: number;
  isConnected: boolean;
  createdAt: string;
}

/**
 * Wallet Balance Response
 */
export interface WalletBalance {
  balance: number;
  pending: number;
  cached: boolean; // 10 saniye cache
}

/**
 * Transaction Response (Web3 Uyumlu)
 */
export interface Transaction {
  id: string;
  type: 'sent' | 'received';
  actionType: 'TIP_SEND' | 'TIP_RECEIVE' | 'CLAIM_REWARD' | 'CLAIM_BADGE' | 'AIRDROP' | 'NFT_LIST' | 'NFT_DELIST' | 'SWAP';
  amount: number;
  currency: string;
  from: {
    id: string;
    name: string;
    avatar: string | null;
    walletAddress?: string | null; // Backend'den gelen wallet adresi (opsiyonel - Web3 için)
  } | null;
  to: {
    id: string;
    name: string;
    avatar: string | null;
    walletAddress?: string | null; // Backend'den gelen wallet adresi (opsiyonel - Web3 için)
  } | null;
  reason: string | null;
  status: 'created' | 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  // UI için ek alanlar (transform edilmiş)
  description?: string;
  amountColor?: string;
}

/**
 * Backend API Response (raw format)
 */
export interface TransactionHistoryApiResponse {
  items: Transaction[];
  pagination: {
    cursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Transactions Response (Grouped by Time)
 */
export interface TransactionsResponse {
  today: Transaction[];
  yesterday: Transaction[];
  lastWeek: Transaction[];
  lastMonth: Transaction[];
  total: number;
  page: number;
}

/**
 * Send Tip Request
 */
export interface SendTipRequest {
  recipientId?: string;      // User ID (friend-to-friend için) - opsiyonel
  walletAddress?: string;    // Wallet address (external wallet için) - opsiyonel
  amount: number;            // TIPS miktarı - zorunlu
  message?: string;          // Opsiyonel mesaj
}

/**
 * Send Tip Response
 */
export interface SendTipResponse {
  transactionId: string;
  status: 'pending'; // Hemen confirmed değil!
  estimatedConfirmTime: number; // Saniye cinsinden
}

/**
 * NFT Transfer Request
 * Backend endpoint: POST /transactions/nft-transfer
 */
export interface NftTransferRequest {
  nftId: string;
  recipientId: string;
  message?: string;
}

/**
 * NFT Transfer Response
 */
export interface NftTransferResponse {
  success: boolean;
  nftId: string;
  fromUserId: string;
  toUserId: string;
  nftTransactionId: string;
  transferredAt: string;
}

/**
 * ============================================
 * WALLET ENDPOINTS
 * ============================================
 */

/**
 * Get Wallet Info
 * 
 * Backend endpoint: GET /wallets/info
 * 
 * Kullanıcının wallet bilgilerini getirir
 */
export const getWalletInfo = async (): Promise<WalletInfo> => {
  try {
    const response = await apiService.getClient().get<WalletInfo>('/wallets/info');
    return response.data;
  } catch (error: any) {
    console.error('[getWalletInfo] API Error:', {
      url: '/wallets/info',
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

/**
 * Get Wallet Balance
 * 
 * Backend endpoint: GET /wallets/balance
 * 
 * Cüzdan bakiyesini getirir (ledger-based, hesaplanmış)
 */
export const getWalletBalance = async (): Promise<WalletBalance> => {
  try {
    const response = await apiService.getClient().get<WalletBalance>('/wallets/balance');
    return response.data;
  } catch (error: any) {
    console.error('[getWalletBalance] API Error:', {
      url: '/wallets/balance',
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

/**
 * ============================================
 * TRANSACTION ENDPOINTS
 * ============================================
 */

/**
 * Send TIPS
 * 
 * Backend endpoint: POST /api/transactions/send-tip
 * 
 * Önemli: Direkt success dönmez! Transaction yaratır ve pending döner.
 * Frontend status'u poll ederek takip eder.
 */
export const sendTips = async (data: SendTipRequest): Promise<SendTipResponse> => {
  try {
    const response = await apiService.getClient().post<SendTipResponse>(
      '/transactions/send-tip',
      data,{
        timeout: 10000*60,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('[sendTips] API Error:', {
      url: '/transactions/send-tip',
      status: error.response?.status,
      data: error.response?.data,
      requestData: data,
    });
    throw error;
  }
};

/**
 * Transfer NFT (User -> User)
 *
 * Backend endpoint: POST /transactions/nft-transfer
 */
export const transferNft = async (data: NftTransferRequest): Promise<NftTransferResponse> => {
  try {
    const response = await apiService.getClient().post<NftTransferResponse>('/transactions/nft-transfer', data);
    return response.data;
  } catch (error: any) {
    console.error('[transferNft] API Error:', {
      url: '/transactions/nft-transfer',
      status: error.response?.status,
      data: error.response?.data,
      requestData: data,
    });
    throw error;
  }
};

/**
 * Get Transaction By ID
 * 
 * Backend endpoint: GET /api/transactions/:id
 * 
 * Transaction status'ünü getirir (polling için)
 */
export const getTransactionById = async (transactionId: string): Promise<Transaction> => {
  try {
    const response = await apiService.getClient().get<Transaction>(
      `/transactions/${transactionId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getTransactionById] API Error:', {
      url: `/transactions/${transactionId}`,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

/**
 * Transform transaction to UI format
 */
const transformTransaction = (tx: Transaction): Transaction => {
  let description = '';
  let amountColor = '#000000';

  // Type'a göre description ve renk belirle
  if (tx.type === 'sent') {
    if (tx.status === 'failed') {
      description = `Failed: ${tx.to?.name || 'Unknown'}`;
      amountColor = '#CE4A4A'; // Kırmızı
    } else {
      description = `Sent to ${tx.to?.name || 'Unknown'}`;
      amountColor = '#CE4A4A'; // Kırmızı
    }
  } else if (tx.type === 'received') {
    if (tx.actionType === 'CLAIM_REWARD') {
      description = 'Claimed Reward';
      amountColor = '#4CAF50'; // Yeşil
    } else if (tx.actionType === 'CLAIM_BADGE') {
      description = 'Claimed Badge Reward';
      amountColor = '#4CAF50'; // Yeşil
    } else if (tx.actionType === 'AIRDROP') {
      description = 'Airdrop Received';
      amountColor = '#4CAF50'; // Yeşil
    } else if (tx.from) {
      description = `Received from ${tx.from.name}`;
      amountColor = '#4CAF50'; // Yeşil
    } else {
      description = 'Received';
      amountColor = '#4CAF50'; // Yeşil
    }
  }

  return {
    ...tx,
    description,
    amountColor,
  };
};

/**
 * Group transactions by time period
 */
const groupTransactionsByTime = (transactions: Transaction[]): TransactionsResponse => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastMonthStart = new Date(today);
  lastMonthStart.setDate(lastMonthStart.getDate() - 30);

  const grouped: TransactionsResponse = {
    today: [],
    yesterday: [],
    lastWeek: [],
    lastMonth: [],
    total: transactions.length,
    page: 1,
  };

  transactions.forEach((tx) => {
    const txDate = new Date(tx.createdAt);
    const transformedTx = transformTransaction(tx);

    if (txDate >= today) {
      grouped.today.push(transformedTx);
    } else if (txDate >= yesterday && txDate < today) {
      grouped.yesterday.push(transformedTx);
    } else if (txDate >= lastWeekStart && txDate < yesterday) {
      grouped.lastWeek.push(transformedTx);
    } else if (txDate >= lastMonthStart && txDate < lastWeekStart) {
      grouped.lastMonth.push(transformedTx);
    }
  });

  return grouped;
};

/**
 * Get Wallet Transactions
 * 
 * Backend endpoint: GET /api/transactions/history
 * 
 * Cüzdan işlem geçmişini getirir (grouped by time)
 */
export const getWalletTransactions = async (params?: {
  page?: number;
  limit?: number;
  actionType?: string;
  status?: string;
}): Promise<TransactionsResponse> => {
  try {
    const response = await apiService.getClient().get<TransactionHistoryApiResponse>(
      '/transactions/history',
      { params }
    );

    // Transform: Backend format -> Frontend grouped format
    const grouped = groupTransactionsByTime(response.data.items);

    return grouped;
  } catch (error: any) {
    console.error('[getWalletTransactions] API Error:', {
      url: '/transactions/history',
      status: error.response?.status,
      data: error.response?.data,
      params,
    });
    throw error;
  }
};

/**
 * ============================================
 * BACKWARD COMPATIBILITY (OLD ENDPOINTS)
 * ============================================
 * 
 * Eski endpoint'ler (geçici olarak korunuyor)
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

export interface ConnectWalletRequest {
  publicAddress: string;
  provider: 'METAMASK' | 'WALLET_CONNECT' | 'COINBASE' | string;
}

/**
 * ============================================
 * REWARD CLAIM TYPES
 * ============================================
 */

export enum RewardClaimType {
  TIPS = 'TIPS',
  BADGE = 'BADGE',
  ACHIEVEMENT = 'ACHIEVEMENT',
  LADDER = 'LADDER',
  SUPPORT = 'SUPPORT',
  EVENT = 'EVENT',
}

export enum RewardSourceType {
  LADDER_REWARD = 'LADDER_REWARD',
  TIPS_RECEIVED = 'TIPS_RECEIVED',
  SUPPORT_SESSION = 'SUPPORT_SESSION',
  BADGE_EARNED = 'BADGE_EARNED',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  EVENT_PARTICIPATION = 'EVENT_PARTICIPATION',
  SYSTEM_GRANT = 'SYSTEM_GRANT',
}

export enum RewardClaimStatus {
  PENDING = 'PENDING',
  CLAIMED = 'CLAIMED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface RewardClaim {
  id: string;
  userId: string;
  rewardType: RewardClaimType;
  sourceType: RewardSourceType;
  amount: number;
  status: RewardClaimStatus;
  earnedAt: string;
  claimedAt: string | null;
  expiresAt: string | null;
  metadata: Record<string, any> | null;
  isClaimable: boolean;
  rewardTypeDisplay: string;
  sourceTypeDisplay: string;
  amountFormatted: string;
  description: string;
}

export interface RewardSummary {
  totalPending: number;
  totalClaimable: number;
  totalAmount: number;
  bySourceType: Record<string, {
    count: number;
    amount: number;
    claims: RewardClaim[];
  }>;
}

export interface ClaimResult {
  success: boolean;
  rewardClaim?: RewardClaim;
  transactionId?: string;
  error?: string;
}

export interface ClaimAllResult {
  success: boolean;
  totalAmount: number;
  claimedCount: number;
  failedCount: number;
  transactionId?: string;
  claims: RewardClaim[];
  errors?: string[];
}

/**
 * ============================================
 * REWARD ENDPOINTS
 * ============================================
 */

/**
 * Get Reward Summary
 * 
 * Backend endpoint: GET /wallets/rewards/summary
 * 
 * Kullanıcının tüm claimable reward'larının özetini getirir
 */
export const getRewardSummary = async (): Promise<RewardSummary> => {
  try {
    const response = await apiService.getClient().get<RewardSummary>('/wallets/rewards/summary');
    return response.data;
  } catch (error: any) {
    console.error('[getRewardSummary] API Error:', {
      url: '/wallets/rewards/summary',
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

/**
 * Get Claimable Rewards
 * 
 * Backend endpoint: GET /wallets/rewards/claimable
 * 
 * Kullanıcının claim edebileceği tüm reward'ları detaylı olarak getirir
 */
export const getClaimableRewards = async (): Promise<RewardClaim[]> => {
  try {
    const response = await apiService.getClient().get<RewardClaim[]>('/wallets/rewards/claimable');
    return response.data;
  } catch (error: any) {
    console.error('[getClaimableRewards] API Error:', {
      url: '/wallets/rewards/claimable',
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

/**
 * Get Rewards by Source Type
 * 
 * Backend endpoint: GET /wallets/rewards/source/:sourceType
 * 
 * Belirli bir kaynak tipine göre reward'ları getirir
 */
export const getRewardsBySource = async (sourceType: RewardSourceType): Promise<RewardClaim[]> => {
  try {
    const response = await apiService.getClient().get<RewardClaim[]>(
      `/wallets/rewards/source/${sourceType}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getRewardsBySource] API Error:', {
      url: `/wallets/rewards/source/${sourceType}`,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

/**
 * Claim Single Reward
 * 
 * Backend endpoint: POST /wallets/rewards/claim/:rewardId
 * 
 * Belirli bir reward'ı claim eder
 */
export const claimReward = async (rewardId: string): Promise<ClaimResult> => {
  try {
    const response = await apiService.getClient().post<ClaimResult>(
      `/wallets/rewards/claim/${rewardId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[claimReward] API Error:', {
      url: `/wallets/rewards/claim/${rewardId}`,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

/**
 * Claim All Rewards
 * 
 * Backend endpoint: POST /wallets/rewards/claim-all
 * 
 * Kullanıcının tüm claimable reward'larını tek seferde claim eder
 */
export const claimAllRewards = async (): Promise<ClaimAllResult> => {
  try {
    const response = await apiService.getClient().post<ClaimAllResult>(
      '/wallets/rewards/claim-all'
    );
    return response.data;
  } catch (error: any) {
    console.error('[claimAllRewards] API Error:', {
      url: '/wallets/rewards/claim-all',
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

/**
 * Get Claim History
 * 
 * Backend endpoint: GET /wallets/rewards/history
 * 
 * Kullanıcının daha önce claim ettiği reward'ların geçmişini getirir
 */
export const getClaimHistory = async (): Promise<RewardClaim[]> => {
  try {
    const response = await apiService.getClient().get<RewardClaim[]>('/wallets/rewards/history');
    return response.data;
  } catch (error: any) {
    console.error('[getClaimHistory] API Error:', {
      url: '/wallets/rewards/history',
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

/**
 * @deprecated Kullanmayın. Bunun yerine getWalletInfo() kullanın.
 */
export const getWallets = async (): Promise<Wallet[]> => {
  try {
    const response = await apiService.getClient().get<Wallet[]>('/wallets');
    return response.data;
  } catch (error: any) {
    console.error('[getWallets] API Error:', error);
    throw error;
  }
};

/**
 * @deprecated Kullanmayın. Bunun yerine getWalletInfo() kullanın.
 */
export const getActiveWallet = async (): Promise<Wallet> => {
  try {
    const response = await apiService.getClient().get<Wallet>('/wallets/active');
    return response.data;
  } catch (error: any) {
    console.error('[getActiveWallet] API Error:', error);
    throw error;
  }
};

/**
 * @deprecated Kullanmayın. Wallet otomatik oluşturulur.
 */
export const connectWallet = async (data: ConnectWalletRequest): Promise<Wallet> => {
  try {
    const response = await apiService.getClient().post<Wallet>('/wallets/connect', data);
    return response.data;
  } catch (error: any) {
    console.error('[connectWallet] API Error:', error);
    throw error;
  }
};

/**
 * @deprecated Kullanmayın.
 */
export const disconnectWallet = async (walletId: string): Promise<Wallet> => {
  try {
    const response = await apiService.getClient().patch<Wallet>(`/wallets/${walletId}/disconnect`);
    return response.data;
  } catch (error: any) {
    console.error('[disconnectWallet] API Error:', error);
    throw error;
  }
};

/**
 * @deprecated Kullanmayın.
 */
export const activateWallet = async (walletId: string): Promise<Wallet> => {
  try {
    const response = await apiService.getClient().patch<Wallet>(`/wallets/${walletId}/activate`);
    return response.data;
  } catch (error: any) {
    console.error('[activateWallet] API Error:', error);
    throw error;
  }
};

/**
 * @deprecated Kullanmayın.
 */
export const deleteWallet = async (walletId: string): Promise<void> => {
  try {
    await apiService.getClient().delete(`/wallets/${walletId}`);
  } catch (error: any) {
    console.error('[deleteWallet] API Error:', error);
    throw error;
  }
};
