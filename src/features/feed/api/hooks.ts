import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeed } from './feedApi';
import type { FeedApiResponse, FeedApiItem } from './feedApi';

/**
 * Query Keys - Feed feature için cache key pattern'leri
 */
export const feedKeys = {
  all: ['feed'] as const,
  feed: (cursor?: string, limit?: number) =>
    [...feedKeys.all, cursor, limit] as const,
};

/**
 * Get Feed infinite query hook
 * Kullanıcının feed akışını infinite scroll ile getirir
 *
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed();
 */
export const useFeed = (limit: number = 20) => {
  return useInfiniteQuery<FeedApiResponse, Error>({
    queryKey: feedKeys.feed(undefined, limit),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getFeed(cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      
      // Backend'den cursor geliyorsa onu kullan, yoksa son item'ın id'sini kullan
      return lastPage.pagination.cursor || (lastPage.items.length > 0 ? lastPage.items[lastPage.items.length - 1].data.id : undefined);
    },
    staleTime: 0, // Cache yok - veri hemen stale olur
    gcTime: 0, // Cache yok - veri hemen temizlenir
    refetchOnMount: true, // Her mount'ta yeniden fetch
    refetchOnWindowFocus: true, // Focus'ta yeniden fetch
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

