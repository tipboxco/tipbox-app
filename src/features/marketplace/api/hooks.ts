import { useInfiniteQuery } from '@tanstack/react-query';
import { getMarketplaceListings } from './marketplaceApi';
import type { MarketplaceListingsApiResponse, MarketplaceListingsParams } from '../types';

/**
 * Query Keys - Marketplace feature için cache key pattern'leri
 */
export const marketplaceKeys = {
  all: ['marketplace'] as const,
  listings: (params?: MarketplaceListingsParams) =>
    [...marketplaceKeys.all, 'listings', params] as const,
};

/**
 * Get Marketplace Listings infinite query hook
 * Marketplace'te satışta olan NFT'leri infinite scroll ile getirir
 *
 * @param params - Query parametreleri (search, minPrice, maxPrice, type, rarity, limit, offset, orderBy)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMarketplaceListings({ limit: 50 });
 */
export const useMarketplaceListings = (params: MarketplaceListingsParams = {}) => {
  const limit = params.limit ?? 8; // Default limit 8
  const orderBy = params.orderBy ?? 'listedAt_desc'; // Default orderBy

  return useInfiniteQuery<MarketplaceListingsApiResponse, Error>({
    queryKey: marketplaceKeys.listings(params),
    queryFn: ({ pageParam }) => {
      const offset = pageParam as number;
      return getMarketplaceListings({
        ...params,
        limit,
        offset,
        orderBy,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // Eğer son sayfadaki item sayısı limit'ten azsa, daha fazla veri yok
      if (lastPage.length < limit) {
        return undefined;
      }
      
      // Bir sonraki offset'i hesapla
      const currentOffset = allPages.reduce((sum, page) => sum + page.length, 0);
      return currentOffset;
    },
    staleTime: 0, // Cache yok
    gcTime: 0, // Cache yok
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

