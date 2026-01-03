import { apiService } from '../../../services/ApiService';
import type { MarketplaceListingsApiResponse, MarketplaceListingsParams, UserNFTsApiResponse } from '../types';

/**
 * Get Marketplace Listings endpoint function
 * Marketplace'te satışta olan NFT'leri getirir (pagination ile)
 *
 * @param params - Query parametreleri (search, minPrice, maxPrice, type, rarity, limit, offset, orderBy)
 * @returns MarketplaceListingsApiResponse - NFT listesi (array)
 */
export const getMarketplaceListings = async (
  params: MarketplaceListingsParams = {}
): Promise<MarketplaceListingsApiResponse> => {
  const queryParams = new URLSearchParams();

  if (params.search) {
    queryParams.append('search', params.search);
  }
  if (params.minPrice !== undefined) {
    queryParams.append('minPrice', params.minPrice.toString());
  }
  if (params.maxPrice !== undefined) {
    queryParams.append('maxPrice', params.maxPrice.toString());
  }
  if (params.type) {
    queryParams.append('type', params.type);
  }
  if (params.rarity) {
    queryParams.append('rarity', params.rarity);
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.offset !== undefined) {
    queryParams.append('offset', params.offset.toString());
  }
  if (params.orderBy) {
    queryParams.append('orderBy', params.orderBy);
  }

  const response = await apiService.getClient().get<{ items: MarketplaceListingsApiResponse }>(
    `/marketplace/listings?${queryParams.toString()}`
  );
  // Backend { items: [...] } formatında döndürüyor, direkt array'e çevir
  return response.data.items;
};

/**
 * Get My NFTs endpoint function
 * Kullanıcıya ait NFT'leri getirir (pagination ile)
 *
 * @param offset - Başlangıç offset'i (default: 0)
 * @param limit - Getirilecek NFT sayısı (default: 12)
 * @returns UserNFTsApiResponse - Kullanıcıya ait NFT listesi (array)
 */
export const getMyNFTs = async (
  offset: number = 0,
  limit: number = 12
): Promise<UserNFTsApiResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append('offset', offset.toString());
  queryParams.append('limit', limit.toString());

  const response = await apiService.getClient().get<UserNFTsApiResponse>(
    `/marketplace/my-nfts?${queryParams.toString()}`
  );
  return response.data;
};

/**
 * Create Listing Request Interface
 */
export interface CreateListingRequest {
  nftId: string;
  amount: number;
}

/**
 * Create Listing Response Interface
 */
export interface CreateListingResponse {
  id: string;
  title: string;
  description?: string;
  username: string;
  price: string;
  image: string;
  userAvatar?: string;
  rarity: string;
  type: string;
  listedAt: string;
  sellerId: string;
  nftId: string;
}

/**
 * Create Marketplace Listing endpoint function
 * NFT'yi satışa koyar
 *
 * @param data - Create Listing request data
 * @returns CreateListingResponse - Oluşturulan listing bilgileri
 */
export const createListing = async (
  data: CreateListingRequest
): Promise<CreateListingResponse> => {
  const response = await apiService.getClient().post<CreateListingResponse>(
    '/marketplace/listings',
    data
  );
  return response.data;
};

/**
 * Delete Listing Response Interface
 */
export interface DeleteListingResponse {
  message: string;
}

/**
 * Update Listing Price endpoint function
 * Listing fiyatını günceller
 *
 * @param listingId - Listing ID'si
 * @param amount - Yeni fiyat
 * @returns Updated listing response
 */
export interface UpdateListingPriceRequest {
  amount: number;
}

export interface UpdateListingPriceResponse {
  id: string;
  price: string;
  updatedAt: string;
}

export const updateListingPrice = async (
  listingId: string,
  amount: number
): Promise<UpdateListingPriceResponse> => {
  try {
    const response = await apiService.getClient().put<UpdateListingPriceResponse>(
      `/marketplace/listings/${listingId}/price`,
      { amount }
    );
    return response.data;
  } catch (error: any) {
    console.error('[updateListingPrice] API Error:', {
      url: `/marketplace/listings/${listingId}/price`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      amount,
    });
    throw error;
  }
};

/**
 * Delete Marketplace Listing endpoint function
 * Listing'i satıştan kaldırır (delist)
 *
 * @param listingId - Listing ID'si
 * @returns DeleteListingResponse - İşlem sonucu mesajı
 */
export const deleteListing = async (
  listingId: string
): Promise<DeleteListingResponse> => {
  const response = await apiService.getClient().delete<DeleteListingResponse>(
    `/marketplace/listings/${listingId}`
  );
  return response.data;
};

/**
 * Get NFT Sell Info endpoint function
 * NFT satış bilgilerini getirir
 *
 * @param nftId - NFT ID'si
 * @returns NFT sell info
 */
export interface NFTSellInfo {
  id: string;
  viewer: number;
  rarity: string;
  price: number;
  suggestedPrice: number;
  gasFee: number;
  earningsAfterSales: number;
}

export const getNFTSellInfo = async (nftId: string): Promise<NFTSellInfo> => {
  try {
    const response = await apiService.getClient().get<NFTSellInfo>(
      `/marketplace/sell/${nftId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getNFTSellInfo] API Error:', {
      url: `/marketplace/sell/${nftId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get NFT Sell Detail endpoint function
 * NFT satış detay bilgilerini getirir
 *
 * @param nftId - NFT ID'si
 * @returns NFT sell detail
 */
export interface NFTSellDetail {
  id: string;
  viewer: number;
  rarity: string;
  price: number;
  suggestedPrice: number;
  earnDate: string;
  totalOwner: number;
  ownerUser: {
    id: string;
    name: string;
  };
}

export const getNFTSellDetail = async (nftId: string): Promise<NFTSellDetail> => {
  try {
    const response = await apiService.getClient().get<NFTSellDetail>(
      `/marketplace/sell/${nftId}/detail`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getNFTSellDetail] API Error:', {
      url: `/marketplace/sell/${nftId}/detail`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

