import { useInfiniteQuery } from '@tanstack/react-query';
import { getHottest } from './exploreApi';
import type { FeedApiResponse } from '@/src/features/feed/api/feedApi';

/**
 * Query Keys - Explore feature için cache key pattern'leri
 */
export const exploreKeys = {
  all: ['explore'] as const,
  hottest: (cursor?: string, limit?: number) =>
    [...exploreKeys.all, 'hottest', cursor, limit] as const,
};

/**
 * Get Hottest infinite query hook
 * Explore sayfasındaki hottest içeriğini infinite scroll ile getirir
 *
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useHottest();
 */
export const useHottest = (limit: number = 20) => {
  return useInfiniteQuery<FeedApiResponse, Error>({
    queryKey: exploreKeys.hottest(undefined, limit),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getHottest(cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      
      // Backend'den cursor geliyorsa onu kullan, yoksa son item'ın id'sini kullan
      return lastPage.pagination.cursor || (lastPage.items.length > 0 ? lastPage.items[lastPage.items.length - 1].data.id : undefined);
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

