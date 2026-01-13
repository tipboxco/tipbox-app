import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMarketplaceListings, getMyNFTs, getMyListings, getAvailableNFTs, createListing, deleteListing, updateListingPrice, getNFTSellInfo, getNFTSellDetail, buyNFT } from './marketplaceApi';
import type { MarketplaceListingsApiResponse, MarketplaceListingsParams, UserNFTApiItem } from '../types';
import type { CreateListingRequest, CreateListingResponse, DeleteListingResponse, UpdateListingPriceResponse, NFTSellInfo, NFTSellDetail, BuyNFTRequest, BuyNFTResponse } from './marketplaceApi';

/**
 * Query Keys - Marketplace feature için cache key pattern'leri
 */
export const marketplaceKeys = {
  all: ['marketplace'] as const,
  listings: (params?: MarketplaceListingsParams) =>
    [...marketplaceKeys.all, 'listings', params] as const,
  myNFTs: () => [...marketplaceKeys.all, 'my-nfts'] as const,
  myListings: () => [...marketplaceKeys.all, 'my-listings'] as const,
  availableNFTs: () => [...marketplaceKeys.all, 'available-nfts'] as const,
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
    // Çok kısa cache - her zaman fresh data
    staleTime: 0,  // Her zaman stale - her seferinde backend'e sor
    gcTime: 30 * 1000,     // 30 saniye garbage collection
    refetchOnMount: 'always',     // Her mount'ta kesin refetch
    refetchOnWindowFocus: true,   // Window focus'ta refetch
    refetchOnReconnect: true,     // Network reconnect'te refetch
    retry: 1,
  });
};

/**
 * Get My NFTs query hook
 * Kullanıcıya ait NFT'leri getirir
 *
 * @param limit - Getirilecek NFT sayısı (default: 50)
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error, refetch } = useMyNFTs(50);
 */
export const useMyNFTs = (limit: number = 50) => {
  return useQuery<UserNFTApiItem[], Error>({
    queryKey: [...marketplaceKeys.myNFTs(), limit],
    queryFn: () => getMyNFTs(limit, 0),
    // Çok kısa cache - her zaman fresh data
    staleTime: 0,  // Her zaman stale - her seferinde backend'e sor
    gcTime: 30 * 1000,    // 30 saniye garbage collection
    refetchOnMount: 'always',     // Her mount'ta kesin refetch
    refetchOnWindowFocus: true,   // Window focus'ta refetch
    refetchOnReconnect: true,     // Network reconnect'te refetch
    retry: 1,
  });
};

/**
 * Get My Listings query hook
 * Kullanıcının oluşturduğu tüm listing'leri getirir (ACTIVE, SOLD, CANCELLED)
 *
 * @param limit - Getirilecek listing sayısı (default: 50)
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error, refetch } = useMyListings(50);
 */
export const useMyListings = (limit: number = 50) => {
  return useQuery<UserNFTApiItem[], Error>({
    queryKey: [...marketplaceKeys.myListings(), limit],
    queryFn: async () => {
      const response = await getMyListings(limit);
      return response.items || [];
    },
    // Çok kısa cache - her zaman fresh data
    staleTime: 0,
    gcTime: 30 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  });
};

/**
 * Get Available NFTs query hook
 * Satışa koyulabilecek NFT'leri getirir (ACTIVE listing'i olmayanlar)
 *
 * @param limit - Getirilecek NFT sayısı (default: 50)
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error, refetch } = useAvailableNFTs(50);
 */
export const useAvailableNFTs = (limit: number = 50) => {
  return useQuery<UserNFTApiItem[], Error>({
    queryKey: [...marketplaceKeys.availableNFTs(), limit],
    queryFn: async () => {
      const response = await getAvailableNFTs(limit);
      return response.items || [];
    },
    // Çok kısa cache - her zaman fresh data
    staleTime: 0,
    gcTime: 30 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
      console.log('[useCreateListing] Successfully listed NFT, invalidating caches...');
      // Listings ve myNFTs query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.all });
      // My NFTs, My Listings, Available NFTs cache'ini direkt sil
      queryClient.removeQueries({ queryKey: marketplaceKeys.myNFTs() });
      queryClient.removeQueries({ queryKey: marketplaceKeys.myListings() });
      queryClient.removeQueries({ queryKey: marketplaceKeys.availableNFTs() });
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
      console.log('[useDeleteListing] Successfully delisted NFT, invalidating caches...');
      // Listings ve myNFTs query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.all });
      // My NFTs, My Listings, Available NFTs cache'ini direkt sil
      queryClient.removeQueries({ queryKey: marketplaceKeys.myNFTs() });
      queryClient.removeQueries({ queryKey: marketplaceKeys.myListings() });
      queryClient.removeQueries({ queryKey: marketplaceKeys.availableNFTs() });
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
      console.log('[useUpdateListingPrice] Successfully updated listing price, invalidating caches...');
      // Listings ve myNFTs query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.all });
      // My NFTs, My Listings cache'ini direkt sil (Available NFTs etkilenmez)
      queryClient.removeQueries({ queryKey: marketplaceKeys.myNFTs() });
      queryClient.removeQueries({ queryKey: marketplaceKeys.myListings() });
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

/**
 * Buy NFT mutation hook
 * Marketplace'teki bir NFT'yi satın alır
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const { mutate: buyNFTMutation, isPending } = useBuyNFT();
 * buyNFTMutation({ listingId: 'listing-123' });
 */
export const useBuyNFT = () => {
  const queryClient = useQueryClient();

  return useMutation<BuyNFTResponse, Error, BuyNFTRequest>({
    mutationFn: buyNFT,
    onSuccess: () => {
      console.log('[useBuyNFT] Successfully purchased NFT, invalidating caches...');
      // Listings ve myNFTs query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.all });
      // My NFTs cache'ini direkt sil (yeni NFT sahibi değişti)
      queryClient.removeQueries({ queryKey: marketplaceKeys.myNFTs() });
      queryClient.removeQueries({ queryKey: marketplaceKeys.myListings() });
      queryClient.removeQueries({ queryKey: marketplaceKeys.availableNFTs() });
      // Wallet balance'ı da invalidate et (bakiye değişecek)
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (error) => {
      console.error('[useBuyNFT] Mutation error:', error);
    },
  });
};

