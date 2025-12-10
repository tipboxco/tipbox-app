import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * React Query Client yapılandırması
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // 5 dakika - data ne kadar süre fresh kalacak
      gcTime: 0, // 10 dakika - cache'de ne kadar süre kalacak (eski cacheTime)
      retry: 1, // Hata durumunda 1 kez daha dene
      refetchOnWindowFocus: false, // Window focus olduğunda otomatik refetch yapma
      refetchOnReconnect: true, // İnternet bağlantısı geldiğinde refetch yap
    },
    mutations: {
      retry: 1, // Mutation hatalarında 1 kez daha dene
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
 */
export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

/**
 * QueryClient instance'ı export et (manuel invalidation için)
 */
export { queryClient };

