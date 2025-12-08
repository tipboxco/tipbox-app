import { apiService } from '../../../services/ApiService';
import type { BrandCategory, BrandListItem, BrandCatalogResponse, BrandFeedResponse, BrandProductBookResponse, BrandSurveysResponse, BrandTrendsResponse, BrandEventsResponse } from '../types';

/**
 * Get Brand Categories endpoint function
 * /brands/categories API'sinden marka kategorilerini getirir
 *
 * @returns BrandCategory[] - Marka kategori listesi
 */
export const getBrandCategories = async (): Promise<BrandCategory[]> => {
  const response = await apiService.getClient().get<BrandCategory[]>(
    '/brands/categories'
  );
  return response.data;
};

/**
 * Get Brands by Category endpoint function
 * /brands/categories/{category_id}/brands API'sinden marka listesini getirir
 *
 * @param categoryId - Seçili brand kategorisinin ID'si
 * @returns BrandListItem[] - Marka listesi
 */
export const getBrandsByCategory = async (
  categoryId: string
): Promise<BrandListItem[]> => {
  try {
    const response = await apiService.getClient().get<BrandListItem[]>(
      `/brands/categories/${categoryId}/brands`
    );
    console.log('[BrandsByCategory API] Response:', JSON.stringify(response.data, null, 2));
    console.log('[BrandsByCategory API] Response length:', response.data?.length);
    if (response.data && response.data.length > 0) {
      console.log('[BrandsByCategory API] First item:', JSON.stringify(response.data[0], null, 2));
    }
    return response.data;
  } catch (error: any) {
    console.error('Brands By Category API Error:', {
      url: `/brands/categories/${categoryId}/brands`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Catalog endpoint function
 * /brands/{brandId}/catalog API'sinden marka katalog bilgilerini getirir
 *
 * @param brandId - Marka ID'si
 * @returns BrandCatalogResponse - Marka katalog bilgileri (banner, description, posts, vb.)
 */
export const getBrandCatalog = async (
  brandId: string
): Promise<BrandCatalogResponse> => {
  try {
    const response = await apiService.getClient().get<BrandCatalogResponse>(
      `/brands/${brandId}/catalog`
    );
    return response.data;
  } catch (error: any) {
    console.error('Brand Catalog API Error:', {
      url: `/brands/${brandId}/catalog`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Feed endpoint function
 * /brands/{brandId}/feed API'sinden marka feed postlarını getirir (pagination ile)
 *
 * @param brandId - Marka ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 3)
 * @returns BrandFeedResponse - Marka feed postları ve pagination bilgisi
 */
export const getBrandFeed = async (
  brandId: string,
  cursor?: string,
  limit: number = 3
): Promise<BrandFeedResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<BrandFeedResponse>(
      `/brands/${brandId}/feed?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Brand Feed API Error:', {
      url: `/brands/${brandId}/feed?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Product Book endpoint function
 * /brands/{brandId}/products API'sinden marka ürün listesini getirir
 *
 * @param brandId - Marka ID'si
 * @returns BrandProductBookResponse - Marka ürün grupları ve ürünleri
 */
export const getBrandProductBook = async (
  brandId: string
): Promise<BrandProductBookResponse> => {
  try {
    const response = await apiService.getClient().get<BrandProductBookResponse>(
      `/brands/${brandId}/products`
    );
    return response.data;
  } catch (error: any) {
    console.error('Brand Product Book API Error:', {
      url: `/brands/${brandId}/products`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Surveys endpoint function
 * /brands/{brandId}/surveys API'sinden marka survey listesini getirir (pagination ile)
 *
 * @param brandId - Marka ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns BrandSurveysResponse - Marka survey listesi ve pagination bilgisi
 */
export const getBrandSurveys = async (
  brandId: string,
  cursor?: string,
  limit: number = 20
): Promise<BrandSurveysResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<any>(
      `/brands/${brandId}/surveys?${params.toString()}`
    );

    const responseData = response.data;

    // API response formatı: { surveyList: [...], pagination: {...} }
    if (responseData && typeof responseData === 'object') {
      // surveyList field'ını kontrol et
      const surveyList = responseData.surveyList || responseData.items || [];
      
      // Status değerlerini normalize et: "viewresults" -> "view_results"
      const normalizedItems = surveyList.map((item: any) => ({
        ...item,
        status: item.status === 'viewresults' ? 'view_results' : item.status,
      }));

      // Pagination bilgisini al veya oluştur
      const pagination = responseData.pagination || {
        hasMore: normalizedItems.length >= limit,
        limit,
        cursor: normalizedItems.length > 0 ? normalizedItems[normalizedItems.length - 1].id : undefined,
      };

      return {
        items: normalizedItems,
        pagination,
      };
    }

    // Beklenmeyen format
    console.warn('[getBrandSurveys] Unexpected response format:', responseData);
    return {
      items: [],
      pagination: {
        hasMore: false,
        limit,
      },
    };
  } catch (error: any) {
    console.error('[getBrandSurveys] API Error:', {
      url: `/brands/${brandId}/surveys?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Trends endpoint function
 * /brands/{brandId}/trends API'sinden marka trend içeriklerini getirir (pagination ile)
 * Feed formatında döner (update, question, experience, tipsAndTricks, post, benchmark)
 *
 * @param brandId - Marka ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 5)
 * @returns BrandTrendsResponse - Marka trend içerikleri ve pagination bilgisi
 */
export const getBrandTrends = async (
  brandId: string,
  cursor?: string,
  limit: number = 5
): Promise<BrandTrendsResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<any>(
      `/brands/${brandId}/trends?${params.toString()}`
    );

    const responseData = response.data;

    // Response formatı: { items: [...], pagination: {...} }
    if (responseData && typeof responseData === 'object' && 'items' in responseData) {
      const items = responseData.items || [];
      const pagination = responseData.pagination || {
        hasMore: items.length >= limit,
        limit,
        cursor: items.length > 0 ? items[items.length - 1].data?.id : undefined,
      };

      return {
        items,
        pagination,
      };
    }

    // Beklenmeyen format
    console.warn('[getBrandTrends] Unexpected response format:', responseData);
    return {
      items: [],
      pagination: {
        hasMore: false,
        limit,
      },
    };
  } catch (error: any) {
    console.error('[getBrandTrends] API Error:', {
      url: `/brands/${brandId}/trends?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Events endpoint function
 * /brands/{brandId}/events API'sinden marka event listesini getirir (pagination ile)
 *
 * @param brandId - Marka ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns BrandEventsResponse - Marka event listesi ve pagination bilgisi
 */
export const getBrandEvents = async (
  brandId: string,
  cursor?: string,
  limit: number = 20
): Promise<BrandEventsResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<BrandEventsResponse>(
      `/brands/${brandId}/events?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getBrandEvents] API Error:', {
      url: `/brands/${brandId}/events?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

