import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { getTrustList } from './trustApi';
import type { TrustUser } from '../types';

/**
 * Query Keys - Profile feature için cache key pattern'leri
 */
export const profileKeys = {
  all: ['profile'] as const,
  trusts: () => [...profileKeys.all, 'trusts'] as const,
  trustList: (userId: string, searchQuery?: string) => 
    [...profileKeys.trusts(), userId, ...(searchQuery ? ['search', searchQuery] : [])] as const,
};

/**
 * Get Trust List query hook
 * Kullanıcının trust listesini getirir ve cache'ler
 * 
 * @param userId - Kullanıcı ID'si
 * @param searchQuery - İsim veya kullanıcı adına göre arama (opsiyonel)
 * @returns React Query hook result
 * 
 * @example
 * const { data, isLoading, error } = useTrustList('user-123', 'john');
 */
export const useTrustList = (
  userId: string | undefined,
  searchQuery?: string
) => {
  const queryClient = useQueryClient();

  // Search query varsa cache'i devre dışı bırak (her zaman fresh data)
  // Search query yoksa normal cache kullan (5 dakika staleTime)
  const hasSearchQuery = !!searchQuery && searchQuery.trim().length > 0;

  // Search query değiştiğinde önceki query'yi reset et ve cache'i temizle
  const previousSearchQueryRef = useRef<string | undefined>(searchQuery);
  
  const queryResult = useQuery<TrustUser[], Error>({
    queryKey: userId 
      ? profileKeys.trustList(userId, searchQuery) 
      : ['profile', 'trusts', 'disabled'],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return getTrustList(userId, searchQuery);
    },
    enabled: !!userId,
    staleTime: hasSearchQuery ? 0 : 5 * 60 * 1000, // Search varsa 0 (her zaman fresh), yoksa 5 dakika
    gcTime: hasSearchQuery ? 0 : 10 * 60 * 1000, // Search varsa cache'leme yok, yoksa 10 dakika
    refetchOnMount: hasSearchQuery ? 'always' : false, // Search varsa her zaman refetch
    refetchOnWindowFocus: hasSearchQuery, // Search varsa window focus'ta refetch
    // Search query değiştiğinde önceki data'yı gösterme
    placeholderData: undefined,
    // Search query değiştiğinde query'yi yeniden başlat
    retry: hasSearchQuery ? 0 : 1, // Search varsa retry yok (hızlı hata göster)
  });

  // Search query değiştiğinde cache'i temizle ve manuel refetch yap
  useEffect(() => {
    if (previousSearchQueryRef.current !== searchQuery && userId) {
      // Search query değiştiğinde önceki tüm trust list cache'lerini temizle
      queryClient.removeQueries({
        queryKey: profileKeys.trusts(),
        exact: false,
      });
      
      // Search query varsa manuel refetch yap (cache bypass)
      if (hasSearchQuery) {
        queryResult.refetch();
      }
      
      previousSearchQueryRef.current = searchQuery;
    }
  }, [searchQuery, userId, hasSearchQuery, queryClient, queryResult]);

  // Cache kontrolü için log - React Query v5'te onSuccess/onError yok, useEffect kullanıyoruz
  useEffect(() => {
    if (queryResult.isSuccess && queryResult.data && userId) {
      const hasSearch = hasSearchQuery;
      
      // Cache kontrolü için log
      console.log('✅ [React Query Cache] Trust list fetched successfully');
      console.log('📊 [React Query Cache] Data count:', queryResult.data.length);
      console.log('🔍 [React Query Cache] Search query:', searchQuery || '(empty)');
      console.log('🚫 [React Query Cache] Cache disabled for search:', hasSearch);
      console.log('🔑 [React Query Cache] Query Key:', profileKeys.trustList(userId, searchQuery));
      
      // Cache'deki veriyi kontrol et (sadece search yoksa)
      if (!hasSearch) {
        const cachedData = queryClient.getQueryData<TrustUser[]>(
          profileKeys.trustList(userId, searchQuery)
        );
        console.log('💾 [React Query Cache] Cached data exists:', !!cachedData);
        console.log('💾 [React Query Cache] Cached data count:', cachedData?.length || 0);
      } else {
        console.log('💾 [React Query Cache] Cache bypassed (search active)');
      }
      
      console.log('🔄 [React Query Cache] Is fetching:', queryResult.isFetching);
      console.log('📦 [React Query Cache] Data from cache:', queryResult.dataUpdatedAt > 0 && !hasSearch ? 'Yes' : 'No (fresh)');
    }
    
    if (queryResult.isError && queryResult.error) {
      console.error('❌ [React Query Cache] Trust list fetch error:', queryResult.error);
      console.error('🔍 [React Query Cache] Search query:', searchQuery || '(empty)');
      console.error('🚫 [React Query Cache] Cache disabled for search:', hasSearchQuery);
    }
  }, [queryResult.isSuccess, queryResult.isError, queryResult.data, queryResult.isFetching, queryResult.dataUpdatedAt, queryResult.error, userId, searchQuery, hasSearchQuery, queryClient]);

  return queryResult;
};

