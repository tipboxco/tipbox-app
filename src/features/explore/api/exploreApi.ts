import { apiService } from '../../../services/ApiService';
import type { FeedApiResponse } from '@/src/features/feed/api/feedApi';
import type { MarketplaceBanner } from '../types';

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

