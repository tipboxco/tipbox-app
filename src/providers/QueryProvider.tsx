import React, { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * React Query Client yapılandırması
 * PERFORMANCE FIX: Singleton pattern - QueryClient created once and reused
 * 
 * Optimized defaults:
 * - staleTime: 2 hours (cache invalid olana kadar backend'e istek atma)
 * - gcTime: 4 hours (cache'de ne kadar süre kalacak)
 * - refetchOnMount: false (use cache when available)
 * - refetchOnWindowFocus: false (prevent unnecessary refetches)
 * 
 * Note: Backend arkaplanda yeni veriler gönderdiğinde mutation'larda cache invalidation yapılır
 * Individual features can override these defaults for their specific needs:
 * - Feed: 2-3 minutes (more dynamic content)
 * - Catalog: 1 hour (static/semi-static content)
 * - Profile: 5 minutes (default)
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 60 * 1000, // 2 saat - data ne kadar süre fresh kalacak
      gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de ne kadar süre kalacak (eski cacheTime)
      retry: 1, // Hata durumunda 1 kez daha dene
      refetchOnWindowFocus: false, // Window focus olduğunda otomatik refetch yapma
      refetchOnReconnect: true, // İnternet bağlantısı geldiğinde refetch yap
      refetchOnMount: false, // PERFORMANCE FIX: Cache varsa kullan, yoksa fetch et (reduces unnecessary API calls)
      // PERFORMANCE FIX: Network mode optimization
      networkMode: 'online', // Only fetch when online (default, but explicit)
    },
    mutations: {
      retry: 1, // Mutation hatalarında 1 kez daha dene
      // PERFORMANCE FIX: Network mode for mutations
      networkMode: 'online', // Only mutate when online
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * QueryProvider
 * Uygulamanın root'unda kullanılmalı
 * Tüm React Query hook'ları bu provider içinde çalışır
 * 
 * PERFORMANCE FIX: Memoized to prevent unnecessary re-renders
 */
export const QueryProvider: React.FC<QueryProviderProps> = React.memo(({ children }) => {
  // QueryClient is already a singleton, but we memoize the provider component
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
});
QueryProvider.displayName = 'QueryProvider';

/**
 * QueryClient instance'ı export et (manuel invalidation için)
 */
export { queryClient };

