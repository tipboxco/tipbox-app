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

  const response = await apiService.getClient().get<MarketplaceListingsApiResponse>(
    `/marketplace/listings?${queryParams.toString()}`
  );
  return response.data;
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

