import { apiService } from '../../../services/ApiService';
import type { 
  BrandCategory, 
  BrandListItem, 
  BrandCatalogResponse, 
  BrandFeedResponse, 
  BrandProductBookResponse, 
  BrandSurveysResponse, 
  BrandTrendsResponse, 
  BrandEventsResponse,
  BrandHistory,
  BrandStats,
  GlobalBrandSearchResponse
} from '../types';

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
 * Global Brand Search endpoint function
 * Tüm brand kategorileri arasında arama yapar ve sonuçları category bazında gruplar
 * 
 * BACKEND ENDPOINT YAPISI İSTENİYOR:
 * GET /brands/search
 * 
 * Query Parameters:
 * - search: string (required) - Brand adında arama
 * - cursor: string (optional) - Pagination cursor (ilk istek için undefined)
 * - limit: number (optional, default: 20, max: 50) - Sayfa başına item sayısı
 * 
 * Response Format (Backend'den beklenen):
 * {
 *   items: GlobalBrandSearchCategoryItem[],
 *   pagination: {
 *     cursor?: string,
 *     hasMore: boolean,
 *     limit: number
 *   }
 * }
 * 
 * Önemli Notlar:
 * - Eşleşen veri olmayan category'ler response'da yer almamalıdır
 * - Sonuçlar category bazında gruplanmalıdır
 * - Her category için category bilgileri (id, name, image) dahil edilmelidir
 * 
 * @param search - Brand adında arama (zorunlu)
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns GlobalBrandSearchResponse - Category bazında gruplanmış brand listesi ve pagination bilgisi
 */
export const searchGlobalBrands = async (
  search: string,
  cursor?: string,
  limit: number = 20
): Promise<GlobalBrandSearchResponse> => {
  if (!search || search.trim().length === 0) {
    throw new Error('Search query is required');
  }

  const params = new URLSearchParams();
  params.append('search', search.trim());
  
  if (cursor) {
    params.append('cursor', cursor);
  }
  
  params.append('limit', limit.toString());
  
  try {
    const response = await apiService.getClient().get<GlobalBrandSearchResponse>(
      `/brands/search?${params.toString()}`
    );
    
    // Ensure items is always an array (defensive programming)
    const safeResponse: GlobalBrandSearchResponse = {
      items: Array.isArray(response.data?.items) ? response.data.items : [],
      pagination: response.data?.pagination || {
        hasMore: false,
        limit: limit,
      },
    };
    
    return safeResponse;
  } catch (error: any) {
    // 404 hatası: Endpoint backend'de mevcut değil
    if (error.response?.status === 404) {
      // Sadece debug modunda log bas (production'da sessiz)
      if (__DEV__) {
        console.warn('[searchGlobalBrands] ⚠️ Endpoint not found (404). Backend endpoint may not be implemented yet:', {
          url: `/brands/search`,
          search,
          message: 'This endpoint is not available on the backend server. Please contact backend team.',
        });
      }
      
      // Boş response döndür (kullanıcıya hata göstermek yerine boş sonuç göster)
      return {
        items: [],
        pagination: {
          hasMore: false,
          limit: limit,
        },
      };
    }
    
    console.error('[searchGlobalBrands] API Error:', {
      url: `/brands/search?${params.toString()}`,
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
 * OpenAPI dokümantasyonuna göre: brandId, name, description, bannerImage, followers, isJoined
 * Not: Posts için ayrı endpoint kullanılır: /brands/{brandId}/feed
 *
 * @param brandId - Marka ID'si
 * @returns BrandCatalogResponse - Marka katalog bilgileri (banner, description, followers, isJoined)
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
 * /brands/{brandId}/groups API'sinden marka ürün gruplarını getirir (pagination ile)
 * Search parametresi ile sadece eşleşen ürünleri içeren gruplar döner
 *
 * @param brandId - Marka ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @param search - Product adında arama (opsiyonel) - Sadece eşleşen ürünleri içeren gruplar döner
 * @returns BrandProductBookResponse - Marka ürün grupları ve pagination bilgisi
 */
export const getBrandProductBook = async (
  brandId: string,
  cursor?: string,
  limit: number = 20,
  search?: string
): Promise<BrandProductBookResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());
  if (search && search.trim().length > 0) {
    params.append('search', search.trim());
  }

  try {
    const response = await apiService.getClient().get<any>(
      `/brands/${brandId}/groups?${params.toString()}`
    );

    const responseData = response.data;

    // Response formatı: { items: [...], pagination: {...} }
    if (responseData && typeof responseData === 'object' && 'items' in responseData) {
      const items = responseData.items || [];
      const pagination = responseData.pagination || {
        hasMore: items.length >= limit,
        limit,
        cursor: items.length > 0 ? items[items.length - 1]?.productGroupId : undefined,
      };

      return {
        items,
        pagination,
      };
    }

    // Beklenmeyen format
    console.warn('[getBrandProductBook] Unexpected response format:', responseData);
    return {
      items: [],
      pagination: {
        hasMore: false,
        limit,
      },
    };
  } catch (error: any) {
    console.error('[getBrandProductBook] API Error:', {
      url: `/brands/${brandId}/groups?${params.toString()}`,
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

/**
 * Get Brand History endpoint function
 * /brands/{brandId}/history API'sinden marka geçmişi, istatistikler, rozetler, puan geçmişi getirir
 *
 * @param brandId - Marka ID'si
 * @returns BrandHistory - Marka geçmişi bilgileri
 */
export const getBrandHistory = async (
  brandId: string
): Promise<BrandHistory> => {
  try {
    console.log('[getBrandHistory] 📡 API Request:', {
      url: `/brands/${brandId}/history`,
      brandId,
    });
    
    const response = await apiService.getClient().get<BrandHistory>(
      `/brands/${brandId}/history`
    );
    
    console.log('[getBrandHistory] ✅ API Response:', {
      url: `/brands/${brandId}/history`,
      status: response.status,
      data: {
        brandId: response.data.brandId,
        name: response.data.name,
        totalPoints: response.data.totalPoints,
        stats: response.data.stats,
        badgesCount: response.data.badges?.length || 0,
        pointsHistoryCount: response.data.pointsHistory?.length || 0,
      },
    });
    
    // Response'u detaylı logla
    if (response.data) {
      console.log('[getBrandHistory] 📊 Response Details:', {
        brandId: response.data.brandId,
        name: response.data.name,
        totalPoints: response.data.totalPoints,
        stats: response.data.stats,
        badges: response.data.badges?.map(b => ({ id: b.id, title: b.title })) || [],
        pointsHistory: response.data.pointsHistory?.map(p => ({ id: p.id, title: p.title, points: p.points })) || [],
      });
    }
    
    return response.data;
  } catch (error: any) {
    console.error('[getBrandHistory] ❌ API Error:', {
      url: `/brands/${brandId}/history`,
      brandId,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Stats endpoint function
 * /brands/{brandId}/stats API'sinden marka istatistiklerini getirir
 *
 * @param brandId - Marka ID'si
 * @returns BrandStats - Marka istatistikleri (surveys, shares, events, totalPoints)
 */
export const getBrandStats = async (
  brandId: string
): Promise<BrandStats> => {
  try {
    const response = await apiService.getClient().get<BrandStats>(
      `/brands/${brandId}/stats`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getBrandStats] API Error:', {
      url: `/brands/${brandId}/stats`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Product Group Products endpoint function
 * /brands/groups/{productGroupId}/products API'sinden product group'a göre ürünleri getirir
 *
 * @param productGroupId - Product Group ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns BrandProductGroupProductsResponse - Product listesi ve pagination bilgisi
 */
export const getBrandProductGroupProducts = async (
  productGroupId: string,
  cursor?: string,
  limit: number = 20
): Promise<import('../types').BrandProductGroupProductsResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<import('../types').BrandProductGroupProductsResponse>(
      `/brands/groups/${productGroupId}/products?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getBrandProductGroupProducts] API Error:', {
      url: `/brands/groups/${productGroupId}/products?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Product Detail endpoint function
 * /brands/{brandId}/products/{productId} endpoint'inden brand product detay bilgilerini getirir
 *
 * @param brandId - Brand ID'si
 * @param productId - Product ID'si
 * @returns BrandProductDetail - Brand product detay bilgileri
 */
export const getBrandProductDetail = async (
  brandId: string,
  productId: string
): Promise<import('../types').BrandProductDetail> => {
  try {
    const response = await apiService.getClient().get<import('../types').BrandProductDetail>(
      `/brands/${brandId}/products/${productId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getBrandProductDetail] API Error:', {
      url: `/brands/${brandId}/products/${productId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Product Feed endpoint function
 * /brands/{brandId}/products/{productId}/feed endpoint'inden brand product feed postlarını getirir
 *
 * @param brandId - Brand ID'si
 * @param productId - Product ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns BrandFeedResponse - Brand product feed postları ve pagination bilgisi
 */
export const getBrandProductFeed = async (
  brandId: string,
  productId: string,
  cursor?: string,
  limit: number = 20
): Promise<BrandFeedResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<BrandFeedResponse>(
      `/brands/${brandId}/products/${productId}/feed?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getBrandProductFeed] API Error:', {
      url: `/brands/${brandId}/products/${productId}/feed?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Product Reviews endpoint function
 * /brands/{brandId}/products/{productId}/reviews endpoint'inden brand product review postlarını getirir
 *
 * @param brandId - Brand ID'si
 * @param productId - Product ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns BrandFeedResponse - Brand product review postları ve pagination bilgisi
 */
export const getBrandProductReviews = async (
  brandId: string,
  productId: string,
  cursor?: string,
  limit: number = 20
): Promise<BrandFeedResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<BrandFeedResponse>(
      `/brands/${brandId}/products/${productId}/reviews?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getBrandProductReviews] API Error:', {
      url: `/brands/${brandId}/products/${productId}/reviews?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Product Benchmarks endpoint function
 * /brands/{brandId}/products/{productId}/benchmarks endpoint'inden brand product benchmark postlarını getirir
 *
 * @param brandId - Brand ID'si
 * @param productId - Product ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns BrandFeedResponse - Brand product benchmark postları ve pagination bilgisi
 */
export const getBrandProductBenchmarks = async (
  brandId: string,
  productId: string,
  cursor?: string,
  limit: number = 20
): Promise<BrandFeedResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<BrandFeedResponse>(
      `/brands/${brandId}/products/${productId}/benchmarks?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getBrandProductBenchmarks] API Error:', {
      url: `/brands/${brandId}/products/${productId}/benchmarks?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Product Tips endpoint function
 * /brands/{brandId}/products/{productId}/tips endpoint'inden brand product tips postlarını getirir
 *
 * @param brandId - Brand ID'si
 * @param productId - Product ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns BrandFeedResponse - Brand product tips postları ve pagination bilgisi
 */
export const getBrandProductTips = async (
  brandId: string,
  productId: string,
  cursor?: string,
  limit: number = 20
): Promise<BrandFeedResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<BrandFeedResponse>(
      `/brands/${brandId}/products/${productId}/tips?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getBrandProductTips] API Error:', {
      url: `/brands/${brandId}/products/${productId}/tips?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Product Questions endpoint function
 * /brands/{brandId}/products/{productId}/questions endpoint'inden brand product question postlarını getirir
 *
 * @param brandId - Brand ID'si
 * @param productId - Product ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns BrandFeedResponse - Brand product question postları ve pagination bilgisi
 */
export const getBrandProductQuestions = async (
  brandId: string,
  productId: string,
  cursor?: string,
  limit: number = 20
): Promise<BrandFeedResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<BrandFeedResponse>(
      `/brands/${brandId}/products/${productId}/questions?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getBrandProductQuestions] API Error:', {
      url: `/brands/${brandId}/products/${productId}/questions?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Product Experiences endpoint function
 * /brands/{brandId}/products/{productId}/experiences endpoint'inden brand product experience postlarını getirir
 *
 * @param brandId - Brand ID'si
 * @param productId - Product ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns BrandFeedResponse - Brand product experience postları ve pagination bilgisi
 */
export const getBrandProductExperiences = async (
  brandId: string,
  productId: string,
  cursor?: string,
  limit: number = 20
): Promise<BrandFeedResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<BrandFeedResponse>(
      `/brands/${brandId}/products/${productId}/experiences?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getBrandProductExperiences] API Error:', {
      url: `/brands/${brandId}/products/${productId}/experiences?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Product Comparisons endpoint function
 * /brands/{brandId}/products/{productId}/comparisons endpoint'inden brand product comparison postlarını getirir
 *
 * @param brandId - Brand ID'si
 * @param productId - Product ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns BrandFeedResponse - Brand product comparison postları ve pagination bilgisi
 */
export const getBrandProductComparisons = async (
  brandId: string,
  productId: string,
  cursor?: string,
  limit: number = 20
): Promise<BrandFeedResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<BrandFeedResponse>(
      `/brands/${brandId}/products/${productId}/comparisons?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getBrandProductComparisons] API Error:', {
      url: `/brands/${brandId}/products/${productId}/comparisons?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Product News endpoint function
 * /brands/{brandId}/products/{productId}/news endpoint'inden brand product news'lerini getirir
 * Backend'den array olarak geliyor, normalize ediyoruz
 *
 * @param brandId - Brand ID'si
 * @param productId - Product ID'si
 * @param cursor - Pagination cursor (opsiyonel, page number olarak kullanılır)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns ProductNewsResponse - Brand product news'leri ve pagination bilgisi
 */
export const getBrandProductNews = async (
  brandId: string,
  productId: string,
  cursor?: string,
  limit: number = 20
): Promise<import('../types').ProductNewsResponse> => {
  const params = new URLSearchParams();
  // Backend page-based pagination kullanıyor, cursor'ı page number'a çevir
  const page = cursor ? parseInt(cursor, 10) : 1;
  if (page > 1) {
    params.append('page', page.toString());
  }
  params.append('limit', limit.toString());

  try {
    console.log('[getBrandProductNews] 📡 API Request:', {
      url: `/brands/${brandId}/products/${productId}/news?${params.toString()}`,
      brandId,
      productId,
      page,
      limit,
      cursor,
    });
    
    // Backend'den array olarak geliyor, normalize ediyoruz
    const response = await apiService.getClient().get<import('../types').NewsItem[]>(
      `/brands/${brandId}/products/${productId}/news?${params.toString()}`
    );
    
    console.log('[getBrandProductNews] ✅ API Response:', {
      status: response.status,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
      data: response.data,
    });
    
    const newsItems = Array.isArray(response.data) ? response.data : [];
    
    console.log('[getBrandProductNews] 📊 News Items:', {
      count: newsItems.length,
      items: newsItems.map(item => ({
        id: item.id,
        title: item.title,
        source: item.source,
        date: item.date,
      })),
    });
    
    // Response'u normalize et: array'i {items, pagination} formatına çevir
    const normalizedResponse = {
      items: newsItems,
      pagination: {
        cursor: newsItems.length >= limit ? (page + 1).toString() : undefined,
        hasMore: newsItems.length >= limit,
        limit,
      },
    };
    
    console.log('[getBrandProductNews] 🔄 Normalized Response:', normalizedResponse);
    
    return normalizedResponse;
  } catch (error: any) {
    console.error('[getBrandProductNews] API Error:', {
      url: `/brands/${brandId}/products/${productId}/news?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Product News Detail endpoint function
 * /brands/{brandId}/products/{productId}/news/{newsId} endpoint'inden news detay bilgilerini getirir
 *
 * @param brandId - Brand ID'si
 * @param productId - Product ID'si
 * @param newsId - News ID'si
 * @returns NewsDetail - News detay bilgileri
 */
export const getBrandProductNewsDetail = async (
  brandId: string,
  productId: string,
  newsId: string
): Promise<import('../types').NewsDetail> => {
  try {
    const response = await apiService.getClient().get<import('../types').NewsDetail>(
      `/brands/${brandId}/products/${productId}/news/${newsId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getBrandProductNewsDetail] API Error:', {
      url: `/brands/${brandId}/products/${productId}/news/${newsId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Brand Product News Comments endpoint function
 * /brands/{brandId}/products/{productId}/news/{newsId}/comments endpoint'inden news yorumlarını getirir
 *
 * @param brandId - Brand ID'si
 * @param productId - Product ID'si
 * @param newsId - News ID'si
 * @param limit - Sayfa başına yorum sayısı (default: 50)
 * @param offset - Offset değeri (default: 0)
 * @returns NewsCommentsResponse - News comments ve pagination bilgisi
 */
export const getBrandProductNewsComments = async (
  brandId: string,
  productId: string,
  newsId: string,
  limit: number = 50,
  offset: number = 0
): Promise<import('../types').NewsCommentsResponse> => {
  try {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await apiService.getClient().get<import('../types').NewsCommentsResponse>(
      `/brands/${brandId}/products/${productId}/news/${newsId}/comments?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getBrandProductNewsComments] API Error:', {
      url: `/brands/${brandId}/products/${productId}/news/${newsId}/comments?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Create Brand Product News Comment endpoint function
 * /brands/{brandId}/products/{productId}/news/{newsId}/comment endpoint'ine POST request gönderir
 *
 * @param brandId - Brand ID'si
 * @param productId - Product ID'si
 * @param newsId - News ID'si
 * @param request - Comment create request
 * @returns NewsCommentCreateResponse - Created comment response
 */
export const createBrandProductNewsComment = async (
  brandId: string,
  productId: string,
  newsId: string,
  request: import('../types').NewsCommentCreateRequest
): Promise<import('../types').NewsCommentCreateResponse> => {
  try {
    const response = await apiService.getClient().post<import('../types').NewsCommentCreateResponse>(
      `/brands/${brandId}/products/${productId}/news/${newsId}/comment`,
      request
    );
    return response.data;
  } catch (error: any) {
    console.error('[createBrandProductNewsComment] API Error:', {
      url: `/brands/${brandId}/products/${productId}/news/${newsId}/comment`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};
