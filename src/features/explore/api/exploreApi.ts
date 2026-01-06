import { apiService } from '../../../services/ApiService';
import type { FeedApiResponse } from '@/src/features/feed/api/feedApi';
import type { MarketplaceBanner, NewBrandsApiResponse, NewProductsApiResponse } from '../types';
import type { EventsApiResponse } from '@/src/types/EventCard';

/**
 * Get Hottest endpoint function
 * Explore sayfasındaki hottest içeriğini getirir (pagination ile)
 *
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @param search - Post başlığı veya içeriğinde arama (opsiyonel)
 * @returns FeedApiResponse - Hottest items ve pagination bilgisi
 */
export const getHottest = async (
  cursor?: string,
  limit: number = 20,
  search?: string
): Promise<FeedApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());
  if (search) {
    params.append('search', search);
  }

  const response = await apiService.getClient().get<FeedApiResponse>(
    `/explore/hottest?${params.toString()}`
  );
  
  const responseData = response.data;
  
  // Eğer items boşsa ve hasMore true ise, bu bir sorun demektir - hasMore'u false yap
  // Backend'in cursor pagination'ı düzgün çalışmıyor olabilir
  if (responseData.items.length === 0 && responseData.pagination.hasMore) {
    return {
      ...responseData,
      pagination: {
        ...responseData.pagination,
        hasMore: false,
      },
    };
  }
  
  // Eğer items.length < limit ise, daha fazla item yok demektir
  if (responseData.items.length > 0 && responseData.items.length < limit) {
    return {
      ...responseData,
      pagination: {
        ...responseData.pagination,
        hasMore: false,
      },
    };
  }
  
  return responseData;
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
 * Explore sayfasındaki "What's New" sekmesindeki yeni event'leri getirir (pagination ile)
 *
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına event sayısı (default: 10, max: 10)
 * @param search - Event başlığı veya açıklamasında arama (opsiyonel)
 * @returns EventsApiResponse - Event listesi ve pagination bilgisi
 */
export const getExploreEvents = async (
  cursor?: string,
  limit: number = 10,
  search?: string
): Promise<EventsApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', Math.min(limit, 10).toString()); // Max 10
  if (search) {
    params.append('search', search);
  }

  const response = await apiService.getClient().get<EventsApiResponse>(
    `/explore/events?${params.toString()}`
  );
  
  const responseData = response.data;
  
  // Eğer items boşsa ve hasMore true ise, bu bir sorun demektir - hasMore'u false yap
  if (responseData.items.length === 0 && responseData.pagination.hasMore) {
    return {
      ...responseData,
      pagination: {
        ...responseData.pagination,
        hasMore: false,
      },
    };
  }
  
  // Eğer items.length < limit ise, daha fazla item yok demektir
  if (responseData.items.length > 0 && responseData.items.length < limit) {
    return {
      ...responseData,
      pagination: {
        ...responseData.pagination,
        hasMore: false,
      },
    };
  }
  
  return responseData;
};

/**
 * Get New Brands endpoint function
 * Explore sayfasındaki "What's New" sekmesindeki yeni brand'leri getirir (pagination ile)
 *
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına brand sayısı (default: 10)
 * @param search - Marka adında arama (opsiyonel)
 * @returns NewBrandsApiResponse - Brand listesi ve pagination bilgisi
 */
export const getNewBrands = async (
  cursor?: string,
  limit: number = 10,
  search?: string
): Promise<NewBrandsApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());
  if (search) {
    params.append('search', search);
  }

  const response = await apiService.getClient().get<NewBrandsApiResponse>(
    `/explore/brands/new?${params.toString()}`
  );
  
  const responseData = response.data;
  
  // Eğer items boşsa ve hasMore true ise, bu bir sorun demektir - hasMore'u false yap
  if (responseData.items.length === 0 && responseData.pagination.hasMore) {
    return {
      ...responseData,
      pagination: {
        ...responseData.pagination,
        hasMore: false,
      },
    };
  }
  
  // Eğer items.length < limit ise, daha fazla item yok demektir
  if (responseData.items.length > 0 && responseData.items.length < limit) {
    return {
      ...responseData,
      pagination: {
        ...responseData.pagination,
        hasMore: false,
      },
    };
  }
  
  return responseData;
};

/**
 * Get New Products endpoint function
 * Explore sayfasındaki "What's New" sekmesindeki yeni product'leri getirir (pagination ile)
 *
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına product sayısı (default: 10)
 * @returns NewProductsApiResponse - Product listesi ve pagination bilgisi
 */
export const getNewProducts = async (
  cursor?: string,
  limit: number = 10
): Promise<NewProductsApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  const response = await apiService.getClient().get<NewProductsApiResponse>(
    `/explore/products/new?${params.toString()}`
  );
  
  const responseData = response.data;
  
  // Eğer items boşsa ve hasMore true ise, bu bir sorun demektir - hasMore'u false yap
  if (responseData.items.length === 0 && responseData.pagination.hasMore) {
    return {
      ...responseData,
      pagination: {
        ...responseData.pagination,
        hasMore: false,
      },
    };
  }
  
  // Eğer items.length < limit ise, daha fazla item yok demektir
  if (responseData.items.length > 0 && responseData.items.length < limit) {
    return {
      ...responseData,
      pagination: {
        ...responseData.pagination,
        hasMore: false,
      },
    };
  }
  
  return responseData;
};

