import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeed, getFilteredFeed } from './feedApi';
import type { FeedApiResponse, FeedApiItem, FeedFilterParams } from './feedApi';

/**
 * Query Keys - Feed feature için cache key pattern'leri
 */
export const feedKeys = {
  all: ['feed'] as const,
  feed: (cursor?: string, limit?: number, contextType?: string, contextId?: string) =>
    [...feedKeys.all, cursor, limit, contextType, contextId] as const,
  filtered: (cursor?: string, limit?: number, filters?: FeedFilterParams) =>
    [...feedKeys.all, 'filtered', cursor, limit, filters] as const,
  // Context-based feed keys
  productFeed: (productId: string, cursor?: string, limit?: number) =>
    [...feedKeys.all, 'product', productId, cursor, limit] as const,
  productGroupFeed: (productGroupId: string, cursor?: string, limit?: number) =>
    [...feedKeys.all, 'productGroup', productGroupId, cursor, limit] as const,
  subCategoryFeed: (subCategoryId: string, cursor?: string, limit?: number) =>
    [...feedKeys.all, 'subCategory', subCategoryId, cursor, limit] as const,
};

/**
 * Get Feed infinite query hook
 * Kullanıcının feed akışını infinite scroll ile getirir
 * 
 * List-based caching: Liste scroll'unda anında yüklenmiş ekran göster
 *
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @param contextType - Context type (opsiyonel): 'sub_category' | 'product_group' | 'product'
 * @param contextId - Context ID (opsiyonel): UUID
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useFeed();
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useFeed(20, 'product', 'product-123');
 */
export const useFeed = (
  limit: number = 20,
  contextType?: 'sub_category' | 'product_group' | 'product',
  contextId?: string
) => {
  return useInfiniteQuery<FeedApiResponse, Error>({
    queryKey: feedKeys.feed(undefined, limit, contextType, contextId),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getFeed(cursor, limit, contextType, contextId);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // Kalıcı çözüm: lastPage ve pagination kontrolü
      if (!lastPage || !lastPage.pagination) {
        return undefined;
      }
      
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      
      // Backend'den cursor geliyorsa onu kullan, yoksa son item'ın id'sini kullan
      // Ensure items is an array and has valid data before accessing
      const items = Array.isArray(lastPage.items) ? lastPage.items : [];
      if (items.length > 0) {
        const lastItem = items[items.length - 1];
        if (lastItem && typeof lastItem === 'object' && 'data' in lastItem) {
          const itemData = lastItem.data;
          if (itemData && typeof itemData === 'object' && 'id' in itemData && itemData.id) {
            return lastPage.pagination.cursor || String(itemData.id);
          }
        }
      }
      
      return lastPage.pagination.cursor || undefined;
    },
    // List-based caching: Liste scroll'unda anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,      // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Liste ekranlarında refetch yapma
    retry: (failureCount, error: any) => {
      // 500 hatası için retry yapma (backend sorunu)
      if (error?.response?.status === 500) {
        console.error('[useFeed] Server error (500), skipping retry:', error.response?.data);
        return false;
      }
      // Diğer hatalar için 1 kez retry yap
      return failureCount < 1;
    },
  });
};

/**
 * Get Filtered Feed infinite query hook
 * Filtrelenmiş feed akışını infinite scroll ile getirir
 * 
 * List-based caching: Liste scroll'unda anında yüklenmiş ekran göster
 *
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @param filters - Filtre parametreleri (interests, tags, category, sort)
 * @param enabled - Query'nin çalışıp çalışmayacağını belirler (default: true)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useFeedFiltered(20, {
 *   interests: ['category-1', 'category-2'],
 *   tags: ['Review', 'Benchmark'],
 *   sort: 'recent'
 * }, true);
 */
export const useFeedFiltered = (
  limit: number = 20,
  filters?: FeedFilterParams,
  enabled: boolean = true
) => {
  return useInfiniteQuery<FeedApiResponse, Error>({
    queryKey: feedKeys.filtered(undefined, limit, filters),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getFilteredFeed(cursor, limit, filters);
    },
    enabled, // PERFORMANCE FIX: Only run query when enabled (prevents duplicate API calls)
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // Kalıcı çözüm: lastPage ve pagination kontrolü
      if (!lastPage || !lastPage.pagination) {
        return undefined;
      }
      
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      
      // Backend'den cursor geliyorsa onu kullan, yoksa son item'ın id'sini kullan
      // Ensure items is an array and has valid data before accessing
      const items = Array.isArray(lastPage.items) ? lastPage.items : [];
      if (items.length > 0) {
        const lastItem = items[items.length - 1];
        if (lastItem && typeof lastItem === 'object' && 'data' in lastItem) {
          const itemData = lastItem.data;
          if (itemData && typeof itemData === 'object' && 'id' in itemData && itemData.id) {
            return lastPage.pagination.cursor || String(itemData.id);
          }
        }
      }
      
      return lastPage.pagination.cursor || undefined;
    },
    // List-based caching: Liste scroll'unda anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,      // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Liste ekranlarında refetch yapma
    retry: (failureCount, error: any) => {
      // 500 hatası için retry yapma (backend sorunu)
      if (error?.response?.status === 500) {
        console.error('[useFeedFiltered] Server error (500), skipping retry:', error.response?.data);
        return false;
      }
      // Diğer hatalar için 1 kez retry yap
      return failureCount < 1;
    },
  });
};

