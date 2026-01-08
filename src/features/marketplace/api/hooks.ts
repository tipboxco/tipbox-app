import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMarketplaceListings, getMyNFTs, createListing, deleteListing, updateListingPrice, getNFTSellInfo, getNFTSellDetail } from './marketplaceApi';
import type { MarketplaceListingsApiResponse, MarketplaceListingsParams, UserNFTsApiResponse } from '../types';
import type { CreateListingRequest, CreateListingResponse, DeleteListingResponse, UpdateListingPriceResponse, NFTSellInfo, NFTSellDetail } from './marketplaceApi';

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
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
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
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
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

/**
 * Update Listing Price mutation hook
 * Listing fiyatını günceller
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const { mutate: updatePrice, isPending } = useUpdateListingPrice();
 * updatePrice({ listingId: 'listing-123', amount: 150.00 });
 */
export const useUpdateListingPrice = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateListingPriceResponse, Error, { listingId: string; amount: number }>({
    mutationFn: ({ listingId, amount }) => updateListingPrice(listingId, amount),
    onSuccess: () => {
      // Listings ve myNFTs query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.all });
    },
    onError: (error) => {
      console.error('[useUpdateListingPrice] Mutation error:', error);
    },
  });
};

/**
 * Get NFT Sell Info query hook
 * NFT satış bilgilerini getirir
 *
 * @param nftId - NFT ID'si
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useNFTSellInfo('nft-123');
 */
export const useNFTSellInfo = (nftId: string | undefined) => {
  return useQuery<NFTSellInfo, Error>({
    queryKey: [...marketplaceKeys.all, 'sell-info', nftId],
    queryFn: () => {
      if (!nftId) {
        throw new Error('NFT ID is required');
      }
      return getNFTSellInfo(nftId);
    },
    enabled: !!nftId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
    retry: 1,
  });
};

/**
 * Get NFT Sell Detail query hook
 * NFT satış detay bilgilerini getirir
 *
 * @param nftId - NFT ID'si
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useNFTSellDetail('nft-123');
 */
export const useNFTSellDetail = (nftId: string | undefined) => {
  return useQuery<NFTSellDetail, Error>({
    queryKey: [...marketplaceKeys.all, 'sell-detail', nftId],
    queryFn: () => {
      if (!nftId) {
        throw new Error('NFT ID is required');
      }
      return getNFTSellDetail(nftId);
    },
    enabled: !!nftId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
    retry: 1,
  });
};

