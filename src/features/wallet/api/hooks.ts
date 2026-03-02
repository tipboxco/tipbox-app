import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/src/store/appStore';
import {
  getWalletInfo,
  getWalletBalance,
  getWalletTransactions,
  getTransactionById,
  sendTips,
  withdrawTips,
  cancelTransaction,
  transferNft,
  // Reward API
  getRewardSummary,
  getClaimableRewards,
  getRewardsBySource,
  claimReward,
  claimAllRewards,
  getClaimHistory,
  // Backward compatibility
  getWallets,
  getActiveWallet,
  connectWallet,
  disconnectWallet,
  activateWallet,
  deleteWallet,
} from './walletApi';
import type {
  WalletInfo,
  WalletBalance,
  Transaction,
  TransactionsResponse,
  SendTipRequest,
  SendTipResponse,
  WithdrawRequest,
  WithdrawResponse,
  CancelTransactionResponse,
  NftTransferRequest,
  NftTransferResponse,
  // Reward types
  RewardSummary,
  RewardClaim,
  RewardSourceType,
  ClaimResult,
  ClaimAllResult,
  // Backward compatibility
  Wallet,
  ConnectWalletRequest,
} from './walletApi';
import { marketplaceKeys } from '@/src/features/marketplace/api/hooks';

/**
 * ============================================
 * QUERY KEYS (Web2-Ready)
 * ============================================
 */
export const walletKeys = {
  all: ['wallet'] as const,
  info: () => [...walletKeys.all, 'info'] as const,
  balance: () => [...walletKeys.all, 'balance'] as const,
  transactions: (params?: any) => [...walletKeys.all, 'transactions', params] as const,
  transaction: (id: string) => [...walletKeys.all, 'transaction', id] as const,
  // Reward keys
  rewards: () => [...walletKeys.all, 'rewards'] as const,
  rewardSummary: () => [...walletKeys.rewards(), 'summary'] as const,
  claimableRewards: () => [...walletKeys.rewards(), 'claimable'] as const,
  rewardsBySource: (sourceType: RewardSourceType) => [...walletKeys.rewards(), 'source', sourceType] as const,
  claimHistory: () => [...walletKeys.rewards(), 'history'] as const,
  // Backward compatibility
  wallets: () => [...walletKeys.all, 'wallets'] as const,
  active: () => [...walletKeys.all, 'active'] as const,
};

/**
 * ============================================
 * WALLET QUERIES (Web2-Ready)
 * ============================================
 */

/**
 * useWalletInfo Hook
 * 
 * Returns the user's wallet info
 * 
 * Backend endpoint: GET /api/wallet/info
 * 
 * **PERFORMANCE FIX:**
 * Avoid excessive retries when backend is not ready (retry once)
 */
export const useWalletInfo = () => {
  return useQuery<WalletInfo, Error>({
    queryKey: walletKeys.info(),
    queryFn: () => getWalletInfo(),
    staleTime: 0, // 5 dakika
    gcTime: 0, // 10 dakika
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1, // ✅ PERFORMANCE FIX: Sadece 1 kez dene (backend hazır değilse fazla deneme)
  });
};

/**
 * useWalletBalance Hook
 * 
 * Returns wallet balance (ledger-based, computed)
 * 
 * Backend endpoint: GET /api/wallet/balance
 * 
 * Balance is never stored directly; it is computed from transactions.
 * Refetches every 10 seconds (only when successful). Backend uses 10 second cache.
 * Refetch interval is disabled on error.
 */
export const useWalletBalance = () => {
  const setWalletBalance = useAppStore((state) => state.setWalletBalance);
  
  return useQuery<WalletBalance, Error>({
    queryKey: walletKeys.balance(),
    queryFn: async () => {
      const balance = await getWalletBalance();
      // Update store
      if (balance?.balance !== undefined && balance.balance !== null) {
        setWalletBalance(balance.balance);
      }
      return balance;
    },
    refetchInterval: (query) => {
      // Only refetch on successful response
      // Do not refetch when backend is not ready or on error
      return query.state.status === 'success' ? 10000 : false;
    },
    staleTime: 5000, // 5 seconds
    gcTime: 30000, // 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1, // Only retry once when backend is not ready
  });
};

/**
 * useWalletTransactions Hook
 * 
 * Returns wallet transaction history (grouped by time)
 * 
 * Backend endpoint: GET /transactions/history
 * 
 * **Response format:**
 * {
 *   today: Transaction[],
 *   yesterday: Transaction[],
 *   lastWeek: Transaction[],
 *   lastMonth: Transaction[]
 * }
 * 
 * Returns empty array on backend error; UI shows "No transactions".
 * Refetch interval is disabled on error.
 */
export const useWalletTransactions = (params?: {
  page?: number;
  limit?: number;
  actionType?: string;
  status?: string;
}) => {
  return useQuery<TransactionsResponse, Error>({
    queryKey: walletKeys.transactions(params),
    queryFn: async () => {
      try {
        return await getWalletTransactions(params);
      } catch (error: any) {
        // Return empty data on backend error (graceful degradation)
        console.warn('[useWalletTransactions] Backend error, returning empty data:', {
          status: error?.response?.status,
          code: error?.response?.data?.error?.code,
        });
        return {
          today: [],
          yesterday: [],
          lastWeek: [],
          lastMonth: [],
          total: 0,
          page: 1,
        };
      }
    },
    refetchInterval: (query) => {
      // Only refetch on successful response
      // Do not refetch when backend is not ready or on error
      return query.state.status === 'success' ? 10000 : false;
    },
    staleTime: 5000, // 5 seconds
    gcTime: 5 * 60 * 1000, // 5 dakika
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false, // Do not retry on backend error
  });
};

/**
 * useTransactionById Hook
 *
 * GET /transactions/:id — Used for polling.
 * When transactionId is provided and status is "created" or "pending", polls periodically;
 * Polling stops when status is "confirmed" or "failed".
 */
export const useTransactionById = (
  transactionId: string | null,
  options?: { pollUntilFinal?: boolean }
) => {
  const pollUntilFinal = options?.pollUntilFinal !== false;

  return useQuery<Transaction, Error>({
    queryKey: walletKeys.transaction(transactionId ?? ''),
    queryFn: () => getTransactionById(transactionId!),
    enabled: !!transactionId,
    refetchInterval: (query) => {
      if (!pollUntilFinal || !transactionId) return false;
      const tx = query.state.data;
      const status = tx?.status;
      if (status === 'created' || status === 'pending') return 4000; // every 4 seconds
      return false; // stop polling when confirmed or failed
    },
    staleTime: 0,
    gcTime: 60 * 1000,
  });
};

/**
 * useNftTransfer Hook
 *
 * NFT transfer (User -> User)
 * Backend endpoint: POST /transactions/nft-transfer
 */
export const useNftTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation<NftTransferResponse, Error, NftTransferRequest>({
    mutationFn: (data) => transferNft(data),
    onSuccess: () => {
      // Invalidate NFT list
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.myNFTs() });
    },
  });
};

/**
 * ============================================
 * TRANSACTION MUTATIONS (Web2-Ready)
 * ============================================
 */

/**
 * useSendTips Hook
 * 
 * Send TIPS mutation
 * 
 * Backend endpoint: POST /api/transactions/send-tip
 * 
 * Does not return success immediately;
 * Backend creates transaction (status: pending/created)
 * Frontend polls with useTransactionById until confirmed/failed
 * Typically confirmed within a few seconds
 * 
 * **UI Flow:**
 * ```tsx
 * const { mutate, isPending } = useSendTips();
 * 
 * mutate(
 *   { recipientId, amount, message },
 *   {
 *     onSuccess: (data) => {
 *       // Poll status with data.id
 *       const { data: tx } = useTransactionStatus(data.transactionId);
 *     }
 *   }
 * );
 * ```
 */
export const useSendTips = () => {
  const queryClient = useQueryClient();

  return useMutation<SendTipResponse, Error, SendTipRequest>({
    mutationFn: sendTips,
    onSuccess: () => {
      // Invalidate balance (pending balance changes)
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      // Invalidate transaction history
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions() });
    },
    onError: (error) => {
      console.error('[useSendTips] Error:', error);
    },
  });
};

/**
 * useCancelTransaction Hook
 *
 * POST /transactions/:transactionId/cancel — Should only be called when status === "created".
 */
export const useCancelTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<CancelTransactionResponse, Error, string>({
    mutationFn: (transactionId: string) => cancelTransaction(transactionId),
    onSuccess: (_data, transactionId) => {
      queryClient.invalidateQueries({ queryKey: walletKeys.transaction(transactionId) });
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions() });
    },
    onError: (error) => {
      console.error('[useCancelTransaction] Error:', error);
    },
  });
};

/**
 * useWithdrawTips Hook
 *
 * Withdraw TIPS to external wallet
 *
 * Backend endpoint: POST /transactions/withdraw
 *
 * Supports ERC20 token transfers to external blockchain addresses.
 * Transaction status can be polled using useTransactionById.
 *
 * **UI Flow:**
 * ```tsx
 * const { mutate, isPending } = useWithdrawTips();
 *
 * mutate(
 *   { amount, walletAddress, tokenType: 'TIPS' },
 *   {
 *     onSuccess: (data) => {
 *       // Poll status with data.id
 *       const { data: tx } = useTransactionById(data.id, { pollUntilFinal: true });
 *     }
 *   }
 * );
 * ```
 */
export const useWithdrawTips = () => {
  const queryClient = useQueryClient();

  return useMutation<WithdrawResponse, Error, WithdrawRequest>({
    mutationFn: withdrawTips,
    onSuccess: () => {
      // Invalidate balance (pending balance changes)
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      // Invalidate transaction history
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions() });
    },
    onError: (error) => {
      console.error('[useWithdrawTips] Error:', error);
    },
  });
};

/**
 * ============================================
 * REWARD QUERIES
 * ============================================
 */

/**
 * useRewardSummary Hook
 * 
 * Returns summary of user's claimable rewards
 * 
 * Backend endpoint: GET /wallets/rewards/summary
 */
export const useRewardSummary = () => {
  return useQuery<RewardSummary, Error>({
    queryKey: walletKeys.rewardSummary(),
    queryFn: () => getRewardSummary(),
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 dakika
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

/**
 * useClaimableRewards Hook
 * 
 * Returns all rewards the user can claim (detailed)
 * 
 * Backend endpoint: GET /wallets/rewards/claimable
 */
export const useClaimableRewards = () => {
  return useQuery<RewardClaim[], Error>({
    queryKey: walletKeys.claimableRewards(),
    queryFn: () => getClaimableRewards(),
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 dakika
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

/**
 * useRewardsBySource Hook
 * 
 * Returns rewards by source type
 * 
 * Backend endpoint: GET /wallets/rewards/source/:sourceType
 */
export const useRewardsBySource = (sourceType: RewardSourceType) => {
  return useQuery<RewardClaim[], Error>({
    queryKey: walletKeys.rewardsBySource(sourceType),
    queryFn: () => getRewardsBySource(sourceType),
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 dakika
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

/**
 * useClaimHistory Hook
 * 
 * Returns history of rewards the user has claimed
 * 
 * Backend endpoint: GET /wallets/rewards/history
 */
export const useClaimHistory = () => {
  return useQuery<RewardClaim[], Error>({
    queryKey: walletKeys.claimHistory(),
    queryFn: () => getClaimHistory(),
    staleTime: 2 * 60 * 1000, // 2 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

/**
 * ============================================
 * REWARD MUTATIONS
 * ============================================
 */

/**
 * useClaimReward Hook
 * 
 * Claims a single reward
 * 
 * Backend endpoint: POST /wallets/rewards/claim/:rewardId
 */
export const useClaimReward = () => {
  const queryClient = useQueryClient();

  return useMutation<ClaimResult, Error, string>({
    mutationFn: (rewardId: string) => claimReward(rewardId),
    onSuccess: () => {
      // Invalidate reward summary
      queryClient.invalidateQueries({ queryKey: walletKeys.rewardSummary() });
      // Invalidate claimable rewards
      queryClient.invalidateQueries({ queryKey: walletKeys.claimableRewards() });
      // Invalidate balance (increases after claim)
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      // Invalidate transaction history
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions() });
    },
    onError: (error) => {
      console.error('[useClaimReward] Error:', error);
    },
  });
};

/**
 * useClaimAllRewards Hook
 * 
 * Claims all claimable rewards at once
 * 
 * Backend endpoint: POST /wallets/rewards/claim-all
 */
export const useClaimAllRewards = () => {
  const queryClient = useQueryClient();

  return useMutation<ClaimAllResult, Error, void>({
    mutationFn: () => claimAllRewards(),
    onSuccess: () => {
      // Invalidate reward summary
      queryClient.invalidateQueries({ queryKey: walletKeys.rewardSummary() });
      // Invalidate claimable rewards
      queryClient.invalidateQueries({ queryKey: walletKeys.claimableRewards() });
      // Invalidate balance (increases after claim)
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      // Invalidate transaction history
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions() });
    },
    onError: (error) => {
      console.error('[useClaimAllRewards] Error:', error);
    },
  });
};

/**
 * ============================================
 * BACKWARD COMPATIBILITY HOOKS
 * ============================================
 * 
 * Legacy hooks (kept for compatibility)
 * 
 * @deprecated Do not use. Use the new hooks instead.
 */

export const useWallets = () => {
  return useQuery<Wallet[], Error>({
    queryKey: walletKeys.wallets(),
    queryFn: () => getWallets(),
    staleTime: 2 * 60 * 60 * 1000,
    gcTime: 4 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useActiveWallet = () => {
  return useQuery<Wallet, Error>({
    queryKey: walletKeys.active(),
    queryFn: () => getActiveWallet(),
    staleTime: 2 * 60 * 60 * 1000,
    gcTime: 4 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useConnectWallet = () => {
  const queryClient = useQueryClient();

  return useMutation<Wallet, Error, ConnectWalletRequest>({
    mutationFn: connectWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.wallets() });
      queryClient.invalidateQueries({ queryKey: walletKeys.active() });
    },
  });
};

export const useDisconnectWallet = () => {
  const queryClient = useQueryClient();

  return useMutation<Wallet, Error, string>({
    mutationFn: disconnectWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.wallets() });
      queryClient.invalidateQueries({ queryKey: walletKeys.active() });
    },
  });
};

export const useActivateWallet = () => {
  const queryClient = useQueryClient();

  return useMutation<Wallet, Error, string>({
    mutationFn: activateWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.wallets() });
      queryClient.invalidateQueries({ queryKey: walletKeys.active() });
    },
  });
};

export const useDeleteWallet = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.wallets() });
      queryClient.invalidateQueries({ queryKey: walletKeys.active() });
    },
  });
};
