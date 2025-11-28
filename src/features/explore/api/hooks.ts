import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getHottest, getMarketplaceBanners, getExploreEvents } from './exploreApi';
import type { FeedApiResponse } from '@/src/features/feed/api/feedApi';
import type { MarketplaceBanner } from '../types';
import type { EventsApiResponse } from '@/src/types/EventCard';

/**
 * Query Keys - Explore feature için cache key pattern'leri
 */
export const exploreKeys = {
  all: ['explore'] as const,
  hottest: (cursor?: string, limit?: number) =>
    [...exploreKeys.all, 'hottest', cursor, limit] as const,
  marketplaceBanners: () => [...exploreKeys.all, 'marketplace-banners'] as const,
  events: (limit?: number) => [...exploreKeys.all, 'events', limit] as const,
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

/**
 * Get Marketplace Banners query hook
 * Explore sayfasındaki marketplace banner'larını getirir
 *
 * @returns React Query query hook result
 *
 * @example
 * const { data, isLoading, error } = useMarketplaceBanners();
 */
export const useMarketplaceBanners = () => {
  return useQuery<MarketplaceBanner[], Error>({
    queryKey: exploreKeys.marketplaceBanners(),
    queryFn: getMarketplaceBanners,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get Explore Events query hook
 * Explore sayfasındaki "What's New" sekmesindeki yeni event'leri getirir
 * Scroll ile daha fazla veri getirilmez, sadece 10 tane gösterilir
 *
 * @param limit - Gösterilecek event sayısı (default: 10, max: 10)
 * @returns React Query query hook result
 *
 * @example
 * const { data, isLoading, error } = useExploreEvents();
 */
export const useExploreEvents = (limit: number = 10) => {
  return useQuery<EventsApiResponse, Error>({
    queryKey: exploreKeys.events(limit),
    queryFn: () => getExploreEvents(limit),
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

