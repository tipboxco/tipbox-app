import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWallets,
  getActiveWallet,
  connectWallet,
  disconnectWallet,
  activateWallet,
  deleteWallet,
  getWalletBalance,
  getWalletTransactions,
} from './walletApi';
import type {
  Wallet,
  ConnectWalletRequest,
  WalletBalance,
  TransactionsResponse,
} from './walletApi';

/**
 * Query Keys - Wallet feature için cache key pattern'leri
 */
export const walletKeys = {
  all: ['wallet'] as const,
  wallets: () => [...walletKeys.all, 'wallets'] as const,
  active: () => [...walletKeys.all, 'active'] as const,
  balance: () => [...walletKeys.all, 'balance'] as const,
  transactions: (cursor?: string, limit?: number) => 
    [...walletKeys.all, 'transactions', cursor, limit] as const,
};

/**
 * Get Wallets query hook
 * Kullanıcının tüm cüzdanlarını listeler
 *
 * @returns React Query hook result
 */
export const useWallets = () => {
  return useQuery<Wallet[], Error>({
    queryKey: walletKeys.wallets(),
    queryFn: () => getWallets(),
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get Active Wallet query hook
 * Aktif cüzdanı getirir
 *
 * @returns React Query hook result
 */
export const useActiveWallet = () => {
  return useQuery<Wallet, Error>({
    queryKey: walletKeys.active(),
    queryFn: () => getActiveWallet(),
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get Wallet Balance query hook
 * Cüzdan bakiyesini getirir
 *
 * @returns React Query hook result
 */
export const useWalletBalance = () => {
  return useQuery<WalletBalance, Error>({
    queryKey: walletKeys.balance(),
    queryFn: () => getWalletBalance(),
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get Wallet Transactions query hook
 * Cüzdan işlem geçmişini getirir
 *
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 50)
 * @returns React Query hook result
 */
export const useWalletTransactions = (
  cursor?: string,
  limit: number = 50
) => {
  return useQuery<TransactionsResponse, Error>({
    queryKey: walletKeys.transactions(cursor, limit),
    queryFn: () => getWalletTransactions(cursor, limit),
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Connect Wallet mutation hook
 * Cüzdan bağlar
 *
 * @returns React Query mutation hook
 */
export const useConnectWallet = () => {
  const queryClient = useQueryClient();

  return useMutation<Wallet, Error, ConnectWalletRequest>({
    mutationFn: connectWallet,
    onSuccess: () => {
      // Wallets ve active wallet query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: walletKeys.wallets() });
      queryClient.invalidateQueries({ queryKey: walletKeys.active() });
    },
  });
};

/**
 * Disconnect Wallet mutation hook
 * Cüzdan bağlantısını keser
 *
 * @returns React Query mutation hook
 */
export const useDisconnectWallet = () => {
  const queryClient = useQueryClient();

  return useMutation<Wallet, Error, string>({
    mutationFn: disconnectWallet,
    onSuccess: () => {
      // Wallets ve active wallet query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: walletKeys.wallets() });
      queryClient.invalidateQueries({ queryKey: walletKeys.active() });
    },
  });
};

/**
 * Activate Wallet mutation hook
 * Cüzdanı aktifleştirir
 *
 * @returns React Query mutation hook
 */
export const useActivateWallet = () => {
  const queryClient = useQueryClient();

  return useMutation<Wallet, Error, string>({
    mutationFn: activateWallet,
    onSuccess: () => {
      // Wallets ve active wallet query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: walletKeys.wallets() });
      queryClient.invalidateQueries({ queryKey: walletKeys.active() });
    },
  });
};

/**
 * Delete Wallet mutation hook
 * Cüzdanı siler
 *
 * @returns React Query mutation hook
 */
export const useDeleteWallet = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteWallet,
    onSuccess: () => {
      // Wallets ve active wallet query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: walletKeys.wallets() });
      queryClient.invalidateQueries({ queryKey: walletKeys.active() });
    },
  });
};

