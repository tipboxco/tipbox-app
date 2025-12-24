import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getHottest, getMarketplaceBanners, getExploreEvents, getNewBrands, getNewProducts } from './exploreApi';
import type { FeedApiResponse } from '@/src/features/feed/api/feedApi';
import type { MarketplaceBanner, NewBrandsApiResponse, NewProductsApiResponse } from '../types';
import type { EventsApiResponse } from '@/src/types/EventCard';

/**
 * Query Keys - Explore feature için cache key pattern'leri
 */
export const exploreKeys = {
  all: ['explore'] as const,
  hottest: (cursor?: string, limit?: number) =>
    [...exploreKeys.all, 'hottest', cursor, limit] as const,
  marketplaceBanners: () => [...exploreKeys.all, 'marketplace-banners'] as const,
  events: (cursor?: string, limit?: number) =>
    [...exploreKeys.all, 'events', cursor, limit] as const,
  newBrands: (cursor?: string, limit?: number) =>
    [...exploreKeys.all, 'brands', 'new', cursor, limit] as const,
  newProducts: (cursor?: string, limit?: number) =>
    [...exploreKeys.all, 'products', 'new', cursor, limit] as const,
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
      // Eğer hasMore false ise veya items boşsa, daha fazla sayfa yok
      if (!lastPage.pagination.hasMore || lastPage.items.length === 0) {
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
 * Get Explore Events infinite query hook
 * Explore sayfasındaki "What's New" sekmesindeki yeni event'leri infinite scroll ile getirir
 *
 * @param limit - Sayfa başına event sayısı (default: 10, max: 10)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useExploreEvents(10);
 */
export const useExploreEvents = (limit: number = 10) => {
  return useInfiniteQuery<EventsApiResponse, Error>({
    queryKey: exploreKeys.events(undefined, limit),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getExploreEvents(cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // Eğer hasMore false ise veya items boşsa, daha fazla sayfa yok
      if (!lastPage.pagination.hasMore || lastPage.items.length === 0) {
        return undefined;
      }
      
      // Backend'den cursor geliyorsa onu kullan, yoksa son item'ın id'sini kullan
      return lastPage.pagination.cursor || (lastPage.items.length > 0 ? lastPage.items[lastPage.items.length - 1].eventId : undefined);
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get New Brands infinite query hook
 * Explore sayfasındaki "What's New" sekmesindeki yeni brand'leri infinite scroll ile getirir
 *
 * @param limit - Sayfa başına brand sayısı (default: 10)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useNewBrands(10);
 */
export const useNewBrands = (limit: number = 10) => {
  return useInfiniteQuery<NewBrandsApiResponse, Error>({
    queryKey: exploreKeys.newBrands(undefined, limit),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getNewBrands(cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // Eğer hasMore false ise veya items boşsa, daha fazla sayfa yok
      if (!lastPage.pagination.hasMore || lastPage.items.length === 0) {
        return undefined;
      }
      
      // Backend'den cursor geliyorsa onu kullan, yoksa son item'ın id'sini kullan
      return lastPage.pagination.cursor || (lastPage.items.length > 0 ? lastPage.items[lastPage.items.length - 1].brandId : undefined);
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get New Products infinite query hook
 * Explore sayfasındaki "What's New" sekmesindeki yeni product'leri infinite scroll ile getirir
 *
 * @param limit - Sayfa başına product sayısı (default: 10)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useNewProducts(10);
 */
export const useNewProducts = (limit: number = 10) => {
  return useInfiniteQuery<NewProductsApiResponse, Error>({
    queryKey: exploreKeys.newProducts(undefined, limit),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getNewProducts(cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // Eğer hasMore false ise veya items boşsa, daha fazla sayfa yok
      if (!lastPage.pagination.hasMore || lastPage.items.length === 0) {
        return undefined;
      }
      
      // Backend'den cursor geliyorsa onu kullan, yoksa son item'ın id'sini kullan
      return lastPage.pagination.cursor || (lastPage.items.length > 0 ? lastPage.items[lastPage.items.length - 1].productId : undefined);
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

