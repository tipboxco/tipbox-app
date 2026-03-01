import { apiService } from '../../../services/ApiService';

/**
 * ============================================
 * WEB2-READY WALLET API
 * ============================================
 * 
 * This file is prepared for Web2 backend.
 * Endpoint names and response formats are ready for Web3 migration.
 * 
 * Current: Backend ledger system
 * Later: Thirdweb + Smart Contract
 */

/**
 * Wallet Info Response (Web2-Ready)
 */
export interface WalletInfo {
  walletId: string;
  walletIdentifier: string; // Current: fake address; later: real blockchain address
  provider: string; // Current: 'CUSTOM'; later: 'thirdweb'
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
  cached: boolean; // 10 second cache
}

/**
 * Transaction Response (Web3 Uyumlu)
 */
export interface Transaction {
  id: string;
  type: 'sent' | 'received';
  actionType: 'TIP_SEND' | 'TIP_RECEIVE' | 'DEPOSIT' | 'WITHDRAW' | 'CLAIM_REWARD' | 'CLAIM_BADGE' | 'AIRDROP' | 'NFT_LIST' | 'NFT_DELIST' | 'SWAP';
  amount: number;
  currency: string;
  from: {
    id: string;
    name: string;
    avatar: string | null;
    walletAddress?: string | null; // Wallet address from backend (optional, for Web3)
  } | null;
  to: {
    id: string;
    name: string;
    avatar: string | null;
    walletAddress?: string | null; // Wallet address from backend (optional, for Web3)
  } | null;
  reason: string | null;
  status: 'created' | 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  /** On-chain transaction hash (undefined until broadcast/confirmed) */
  txHash?: string | null;
  /** Backend/API error message when status is failed */
  errorMessage?: string | null;
  // Extra fields for UI (transformed)
  description?: string;
  amountColor?: string;
}

/** Send-tip response status (matches backend flow: create → pending → confirmed/failed) */
export type SendTipStatus = 'created' | 'pending' | 'confirmed' | 'failed';

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
  recipientId?: string;      // User ID (friend-to-friend) - optional
  walletAddress?: string;   // Wallet address (external wallet) - optional
  amount: number;           // TIPS amount - required
  message?: string;         // Optional message
}

/**
 * Send Tip Response
 * Backend: POST /transactions/send-tip returns immediately; on-chain processing is queued, ~15s delay.
 * First response usually has status "created", txHash undefined. After worker/webhook: pending → confirmed/failed.
 */
export interface SendTipResponse {
  /** Transaction id (use for polling and cancel) */
  id: string;
  /** Alias for id (backward compat) */
  transactionId?: string;
  /** created | pending | confirmed | failed */
  status: SendTipStatus;
  amount: number;
  /** On-chain hash; undefined until broadcast/confirmed */
  txHash?: string;
  toAddress?: string;
  toUserId?: string;
  metadata?: Record<string, unknown>;
  provider?: string;
  createdAt?: string;
  /** Error message when status is failed; "Cancelled by user" when cancelled */
  errorMessage?: string;
  estimatedConfirmTime?: number;
}

/** POST /transactions/:transactionId/cancel response */
export interface CancelTransactionResponse {
  id: string;
  status: SendTipStatus;
  errorMessage?: string;
  message: string;
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
 * Returns the user's wallet info
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
 * Returns wallet balance (ledger-based, computed)
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
 * Does not return success immediately. Creates transaction and returns (often status: created).
 * Frontend polls status until confirmed/failed.
 */
export const sendTips = async (data: SendTipRequest): Promise<SendTipResponse> => {
  try {
    const response = await apiService.getClient().post<SendTipResponse & { transactionId?: string }>(
      '/transactions/send-tip',
      data,{
        timeout: 10000*60,
      }
    );
    const raw = response.data;
    // Normalize: backend may return id or transactionId
    return {
      ...raw,
      id: raw.id ?? raw.transactionId ?? '',
    } as SendTipResponse;
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
 * Returns transaction status (for polling)
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
 * Cancel Transaction (tip only; only when status is "created")
 * 
 * Backend endpoint: POST /transactions/:transactionId/cancel
 * 200: { id, status, errorMessage?, message: "Transaction cancelled" }
 * 400: Transaction cannot be cancelled
 * 404: Transaction not found
 */
export const cancelTransaction = async (transactionId: string): Promise<CancelTransactionResponse> => {
  try {
    const response = await apiService.getClient().post<CancelTransactionResponse>(
      `/transactions/${transactionId}/cancel`
    );
    return response.data;
  } catch (error: any) {
    console.error('[cancelTransaction] API Error:', {
      url: `/transactions/${transactionId}/cancel`,
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

  if (tx.type === 'sent') {
    if (tx.status === 'failed') {
      description = `Failed: ${tx.to?.name || 'Unknown'}`;
      amountColor = '#CE4A4A'; // Red
    } else {
      description = `Sent to ${tx.to?.name || 'Unknown'}`;
      amountColor = '#CE4A4A'; // Red
    }
  } else if (tx.type === 'received') {
    if (tx.actionType === 'CLAIM_REWARD') {
      description = 'Claimed Reward';
      amountColor = '#4CAF50'; // Green
    } else if (tx.actionType === 'CLAIM_BADGE') {
      description = 'Claimed Badge Reward';
      amountColor = '#4CAF50'; // Green
    } else if (tx.actionType === 'AIRDROP') {
      description = 'Airdrop Received';
      amountColor = '#4CAF50'; // Green
    } else if (tx.from) {
      description = `Received from ${tx.from.name}`;
      amountColor = '#4CAF50'; // Green
    } else {
      description = 'Received';
      amountColor = '#4CAF50'; // Green
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
 * Returns wallet transaction history (grouped by time)
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
 * Legacy endpoints (kept for compatibility)
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
 * Returns summary of user's claimable rewards
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
 * Returns all rewards the user can claim (detailed)
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
 * Returns rewards by source type
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
 * Claims a single reward
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
 * Claims all claimable rewards at once
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
 * Returns history of rewards the user has claimed
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
 * @deprecated Do not use. Use getWalletInfo() instead.
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
 * @deprecated Do not use. Use getWalletInfo() instead.
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
 * @deprecated Do not use. Wallet is created automatically.
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
 * @deprecated Do not use.
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
 * @deprecated Do not use.
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
 * @deprecated Do not use.
 */
export const deleteWallet = async (walletId: string): Promise<void> => {
  try {
    await apiService.getClient().delete(`/wallets/${walletId}`);
  } catch (error: any) {
    console.error('[deleteWallet] API Error:', error);
    throw error;
  }
};
