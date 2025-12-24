import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMarketplaceListings, getMyNFTs, createListing, deleteListing } from './marketplaceApi';
import type { MarketplaceListingsApiResponse, MarketplaceListingsParams, UserNFTsApiResponse } from '../types';
import type { CreateListingRequest, CreateListingResponse, DeleteListingResponse } from './marketplaceApi';

/**
 * Query Keys - Marketplace feature için cache key pattern'leri
 */
export const marketplaceKeys = {
  all: ['marketplace'] as const,
  listings: (params?: MarketplaceListingsParams) =>
    [...marketplaceKeys.all, 'listings', params] as const,
  myNFTs: () => [...marketplaceKeys.all, 'my-nfts'] as const,
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

/**
 * Get My NFTs infinite query hook
 * Kullanıcıya ait NFT'leri infinite scroll ile getirir
 *
 * @param limit - Her sayfada getirilecek NFT sayısı (default: 12)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMyNFTs(12);
 */
export const useMyNFTs = (limit: number = 12) => {
  return useInfiniteQuery<UserNFTsApiResponse, Error>({
    queryKey: marketplaceKeys.myNFTs(),
    queryFn: ({ pageParam }) => {
      const offset = pageParam as number;
      return getMyNFTs(offset, limit);
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

/**
 * Create Marketplace Listing mutation hook
 * NFT'yi satışa koyar
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const { mutate: listNFT, isPending } = useCreateListing();
 * listNFT({ nftId: 'nft-123', amount: 125.50 });
 */
export const useCreateListing = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateListingResponse, Error, CreateListingRequest>({
    mutationFn: createListing,
    onSuccess: () => {
      // Listings ve myNFTs query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.all });
    },
    onError: (error) => {
      console.error('[useCreateListing] Mutation error:', error);
    },
  });
};

/**
 * Delete Marketplace Listing mutation hook
 * Listing'i satıştan kaldırır (delist)
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const { mutate: delistNFT, isPending } = useDeleteListing();
 * delistNFT('listing-123');
 */
export const useDeleteListing = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteListingResponse, Error, string>({
    mutationFn: deleteListing,
    onSuccess: () => {
      // Listings ve myNFTs query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.all });
    },
    onError: (error) => {
      console.error('[useDeleteListing] Mutation error:', error);
    },
  });
};

