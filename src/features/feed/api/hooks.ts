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
      // Backend'den gelen pagination.cursor'u kullan, yoksa son item'ın id'sini cursor olarak kullan
      console.log('[useFeed] getNextPageParam', { 
        hasMore: lastPage.pagination.hasMore, 
        itemsLength: lastPage.items.length,
        limit: lastPage.pagination.limit,
        cursor: lastPage.pagination.cursor
      });
      
      if (lastPage.pagination.hasMore) {
        // Backend'den cursor geliyorsa onu kullan, yoksa son item'ın id'sini kullan
        const cursor = lastPage.pagination.cursor || (lastPage.items.length > 0 ? lastPage.items[lastPage.items.length - 1].data.id : undefined);
        console.log('[useFeed] Returning cursor:', cursor);
        return cursor;
      }
      console.log('[useFeed] No more pages - hasMore is false');
      return undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

