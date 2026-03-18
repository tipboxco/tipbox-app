import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { search } from './searchApi';
import type { SearchResponse, SearchParams } from './searchApi';

/**
 * Query Keys - Search feature için cache key pattern'leri
 */
export const searchKeys = {
  all: ['search'] as const,
  query: (params: SearchParams) => [...searchKeys.all, 'query', params.keyword, params.types, params.limit] as const,
  infinite: (params: Omit<SearchParams, 'cursor'>) => [...searchKeys.all, 'infinite', params.keyword, params.types, params.limit] as const,
};

/**
 * Search query hook
 * Genel arama endpoint'ini kullanır
 *
 * @param params - Search parameters (keyword, types, limit)
 * @param enabled - Query'nin aktif olup olmayacağı (default: true)
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useSearch({ keyword: 'iPhone', types: ['product'] });
 */
export const useSearch = (
  params: SearchParams,
  enabled: boolean = true
) => {
  // Keyword boşsa default verileri getir, doluysa arama yap
  // enabled kontrolü dışarıdan geliyor (input boşken default, dolu iken arama)

  return useQuery<SearchResponse, Error>({
    queryKey: searchKeys.query(params),
    queryFn: () => search(params),
    enabled: enabled, // enabled kontrolü SearchModal'dan geliyor
    staleTime: 30 * 1000, // 30 saniye - arama sonuçları kısa süreli cache'lenebilir
    gcTime: 5 * 60 * 1000, // 5 dakika - cache'de tut
    retry: (failureCount, error: any) => {
      // 404 hatası için retry yapma (endpoint implement edilmemiş)
      if (error?.response?.status === 404) {
        return false;
      }
      // Diğer hatalar için 1 kez retry
      return failureCount < 1;
    },
    retryDelay: 1000,
  });
};

/**
 * Search infinite query hook
 * Cursor-based pagination ile arama yapar
 * Sadece keyword varken (search mode) kullanılır
 *
 * @param params - Search parameters (keyword, types, limit) - cursor otomatik yönetilir
 * @param enabled - Query'nin aktif olup olmayacağı (default: true)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSearchInfinite(
 *   { keyword: 'apple', types: ['user', 'brand', 'product'], limit: 10 },
 *   debouncedQuery.length > 0
 * );
 */
export const useSearchInfinite = (
  params: Omit<SearchParams, 'cursor'>,
  enabled: boolean = true
) => {
  return useInfiniteQuery<SearchResponse, Error>({
    queryKey: searchKeys.infinite(params),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return search({ ...params, cursor });
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination.cursor;
    },
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 1;
    },
    retryDelay: 1000,
  });
};
