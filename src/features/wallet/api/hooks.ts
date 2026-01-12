import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWalletInfo,
  getWalletBalance,
  getWalletTransactions,
  sendTips,
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
  TransactionsResponse,
  SendTipRequest,
  SendTipResponse,
  // Backward compatibility
  Wallet,
  ConnectWalletRequest,
} from './walletApi';

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
 * Kullanıcının wallet bilgilerini getirir
 * 
 * Backend endpoint: GET /api/wallet/info
 */
export const useWalletInfo = () => {
  return useQuery<WalletInfo, Error>({
    queryKey: walletKeys.info(),
    queryFn: () => getWalletInfo(),
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

/**
 * useWalletBalance Hook
 * 
 * Cüzdan bakiyesini getirir (ledger-based, hesaplanmış)
 * 
 * Backend endpoint: GET /api/wallet/balance
 * 
 * **Önemli:**
 * - Her 10 saniyede bir refetch eder
 * - Backend 10 saniye cache kullanır
 * - Balance asla direkt tutulmaz, transaction'lardan hesaplanır
 */
export const useWalletBalance = () => {
  return useQuery<WalletBalance, Error>({
    queryKey: walletKeys.balance(),
    queryFn: () => getWalletBalance(),
    refetchInterval: 10000, // 10 saniye
    staleTime: 5000, // 5 saniye
    gcTime: 30000, // 30 saniye
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 2,
  });
};

/**
 * useWalletTransactions Hook
 * 
 * Cüzdan işlem geçmişini getirir (grouped by time)
 * 
 * Backend endpoint: GET /transactions/history
 * 
 * **Response format:**
 * ```
 * {
 *   today: Transaction[],
 *   yesterday: Transaction[],
 *   lastWeek: Transaction[],
 *   lastMonth: Transaction[]
 * }
 * ```
 * 
 * **Error Handling:**
 * - Backend hatası durumunda boş array döner
 * - UI'da "No transactions" gösterilir
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
        // Backend hatası varsa boş data dön (graceful degradation)
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
    staleTime: 30000, // 30 saniye
    gcTime: 5 * 60 * 1000, // 5 dakika
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: false, // Backend hatası varsa retry yapma
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
 * TIPS gönderme işlemi
 * 
 * Backend endpoint: POST /api/transactions/send-tip
 * 
 * **Önemli:**
 * - Direkt success dönmez!
 * - Backend transaction yaratır (status: pending)
 * - Frontend useTransactionStatus ile poll eder
 * - 2-3 saniye sonra confirmed olur
 * 
 * **UI Flow:**
 * ```tsx
 * const { mutate, isPending } = useSendTips();
 * 
 * mutate(
 *   { recipientId, amount, message },
 *   {
 *     onSuccess: (data) => {
 *       // data.transactionId ile status poll et
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
      // Balance'ı invalidate et (pending balance değişir)
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      // Transaction history'yi invalidate et
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions() });
    },
    onError: (error) => {
      console.error('[useSendTips] Error:', error);
    },
  });
};

/**
 * ============================================
 * BACKWARD COMPATIBILITY HOOKS
 * ============================================
 * 
 * Eski hook'lar (geçici olarak korunuyor)
 * 
 * @deprecated Kullanmayın. Yeni hook'ları kullanın.
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
