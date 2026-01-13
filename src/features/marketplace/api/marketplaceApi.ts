import { apiService } from '../../../services/ApiService';
import type { MarketplaceListingsApiResponse, MarketplaceListingsParams, UserNFTsApiResponse, UserNFTApiItem } from '../types';

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
 * @param limit - Getirilecek NFT sayısı (default: 12)
 * @param offset - Başlangıç offset'i (default: 0)
 * @returns UserNFTApiItem[] - Kullanıcıya ait NFT listesi (sadece items array'i)
 */
export const getMyNFTs = async (
  limit: number = 12,
  offset: number = 0
): Promise<UserNFTApiItem[]> => {
  const queryParams = new URLSearchParams();
  queryParams.append('limit', limit.toString());
  queryParams.append('offset', offset.toString());

  const response = await apiService.getClient().get<UserNFTsApiResponse>(
    `/marketplace/my-nfts?${queryParams.toString()}`
  );
  // Backend { items: [...] } formatında döndürüyor, direkt items array'ini döndür
  return response.data.items || [];
};

/**
 * Get My Listings
 * Kullanıcının oluşturduğu tüm listing'leri getirir (ACTIVE, SOLD, CANCELLED)
 * 
 * @param limit - Getirilecek listing sayısı
 * @param cursor - Pagination cursor
 * @returns Promise<UserNFTsApiResponse>
 */
export const getMyListings = async (
  limit: number = 50,
  cursor?: string
): Promise<UserNFTsApiResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append('limit', limit.toString());
  if (cursor) {
    queryParams.append('cursor', cursor);
  }

  const response = await apiService.getClient().get<UserNFTsApiResponse>(
    `/marketplace/my-listings?${queryParams.toString()}`
  );
  return response.data;
};

/**
 * Get Available NFTs
 * Satışa koyulabilecek NFT'leri getirir (ACTIVE listing'i olmayanlar)
 * 
 * @param limit - Getirilecek NFT sayısı
 * @param cursor - Pagination cursor
 * @returns Promise<UserNFTsApiResponse>
 */
export const getAvailableNFTs = async (
  limit: number = 50,
  cursor?: string
): Promise<UserNFTsApiResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append('limit', limit.toString());
  if (cursor) {
    queryParams.append('cursor', cursor);
  }

  const response = await apiService.getClient().get<UserNFTsApiResponse>(
    `/marketplace/available-nfts?${queryParams.toString()}`
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
  title?: string;
  description?: string;
  image?: string;
  viewer: number;
  rarity: string;
  price: number;
  suggestedPrice: number;
  gasFee: number;
  earningsAfterSales: number;
  listing?: {
    id: string;
    price: number;
    status: string;
    listedAt: string;
  };
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
  title: string;
  description?: string;
  image: string;
  type: string;
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
  priceHistory?: Array<{
    id: string;
    price: number;
    listedAt: string;
    status: string;
    seller: {
      id: string;
      name: string;
    };
  }>;
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

/**
 * Buy NFT Request Interface
 */
export interface BuyNFTRequest {
  listingId: string;
}

/**
 * Buy NFT Response Interface
 */
export interface BuyNFTResponse {
  success: boolean;
  nftId: string;
  buyerTransaction: {
    id: string;
    amount: number;
    status: string;
  };
  sellerTransaction: {
    id: string;
    amount: number;
    status: string;
  };
  newOwner: {
    id: string;
    name: string;
  };
}

/**
 * Buy NFT endpoint function
 * Marketplace'teki bir NFT'yi satın alır
 *
 * @param data - Buy NFT request data
 * @returns BuyNFTResponse - Satın alma sonucu
 */
export const buyNFT = async (
  data: BuyNFTRequest
): Promise<BuyNFTResponse> => {
  try {
    const response = await apiService.getClient().post<BuyNFTResponse>(
      '/marketplace/buy',
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('[buyNFT] API Error:', {
      url: '/marketplace/buy',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      listingId: data.listingId,
    });
    throw error;
  }
};

