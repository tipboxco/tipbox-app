import { useQuery } from '@tanstack/react-query';
import { search } from './searchApi';
import type { SearchResponse, SearchParams } from './searchApi';

/**
 * Query Keys - Search feature için cache key pattern'leri
 */
export const searchKeys = {
  all: ['search'] as const,
  query: (params: SearchParams) => [...searchKeys.all, 'query', params.keyword, params.types, params.limit] as const,
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
  return useQuery<SearchResponse, Error>({
    queryKey: searchKeys.query(params),
    queryFn: () => search(params),
    enabled: enabled && !!params.keyword && params.keyword.trim().length > 0,
    staleTime: 30 * 1000, // 30 saniye - arama sonuçları kısa süreli cache'lenebilir
    gcTime: 5 * 60 * 1000, // 5 dakika - cache'de tut
    retry: 1,
    retryDelay: 1000,
  });
};

