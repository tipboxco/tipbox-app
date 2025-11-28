import { apiService } from '../../../services/ApiService';
import type { FeedApiResponse } from '@/src/features/feed/api/feedApi';
import type { MarketplaceBanner, NewBrandsApiResponse } from '../types';
import type { EventsApiResponse } from '@/src/types/EventCard';

/**
 * Get Hottest endpoint function
 * Explore sayfasındaki hottest içeriğini getirir (pagination ile)
 *
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns FeedApiResponse - Hottest items ve pagination bilgisi
 */
export const getHottest = async (
  cursor?: string,
  limit: number = 20
): Promise<FeedApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  const response = await apiService.getClient().get<FeedApiResponse>(
    `/explore/hottest?${params.toString()}`
  );
  return response.data;
};

/**
 * Get Marketplace Banners endpoint function
 * Explore sayfasındaki marketplace banner'larını getirir
 *
 * @returns MarketplaceBanner[] - Banner listesi
 */
export const getMarketplaceBanners = async (): Promise<MarketplaceBanner[]> => {
  const response = await apiService.getClient().get<MarketplaceBanner[]>(
    '/explore/marketplace-banners'
  );
  return response.data;
};

/**
 * Get Explore Events endpoint function
 * Explore sayfasındaki "What's New" sekmesindeki yeni event'leri getirir
 *
 * @param limit - Gösterilecek event sayısı (default: 10, max: 10)
 * @returns EventsApiResponse - Event listesi ve pagination bilgisi
 */
export const getExploreEvents = async (limit: number = 10): Promise<EventsApiResponse> => {
  const params = new URLSearchParams();
  params.append('limit', Math.min(limit, 10).toString()); // Max 10

  const response = await apiService.getClient().get<EventsApiResponse>(
    `/explore/events?${params.toString()}`
  );
  return response.data;
};

/**
 * Get New Brands endpoint function
 * Explore sayfasındaki "What's New" sekmesindeki yeni brand'leri getirir
 *
 * @param limit - Gösterilecek brand sayısı (default: 10)
 * @returns NewBrandsApiResponse - Brand listesi ve pagination bilgisi
 */
export const getNewBrands = async (limit: number = 10): Promise<NewBrandsApiResponse> => {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());

  const response = await apiService.getClient().get<NewBrandsApiResponse>(
    `/explore/brands/new?${params.toString()}`
  );
  return response.data;
};

