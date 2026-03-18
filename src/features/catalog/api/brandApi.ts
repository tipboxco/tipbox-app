import { apiService } from '../../../services/ApiService';
import type { 
  BrandCategory, 
  BrandListItem, 
  BrandCatalogResponse, 
  BrandFollowResponse,
  BrandFeedResponse, 
  BrandProductBookResponse, 
  BrandSurveysResponse, 
  BrandTrendsResponse, 
  BrandEventsResponse,
  BrandHistory,
  BrandStats,
  GlobalBrandSearchResponse,
  BrandsByCategoryResponse,
  SurveyQuestionsResponse
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
 * Get Brands by Category endpoint function (paginated)
 * GET /brands/categories/{categoryId}/brands?page=1&limit=20
 *
 * @param categoryId - Seçili brand kategorisinin ID'si
 * @param page - Sayfa numarası (1-based)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns BrandsByCategoryResponse - items + pagination
 */
export const getBrandsByCategory = async (
  categoryId: string,
  page: number = 1,
  limit: number = 20
): Promise<BrandsByCategoryResponse> => {
  try {
    const response = await apiService.getClient().get<BrandsByCategoryResponse>(
      `/brands/categories/${categoryId}/brands`,
      { params: { page, limit } }
    );
    return {
      items: response.data?.items ?? [],
      pagination: response.data?.pagination ?? { page: 1, limit, hasMore: false },
    };
  } catch (error: any) {
    // 404 hatası: Kategori bulunamadı - bu normal bir durum olabilir (kategori silinmiş veya mevcut değil)
    if (error.response?.status === 404) {
      if (__DEV__) {
        console.warn('[getBrandsByCategory] ⚠️ Category not found (404):', {
          categoryId,
          url: `/brands/categories/${categoryId}/brands`,
          message: 'Category may have been deleted or does not exist.',
        });
      }
      return { items: [], pagination: { page: 1, limit, hasMore: false } };
    }
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
    const response = await apiService.getClient().get<any>(
      `/brands/search?${params.toString()}`
    );

    const responseData = response.data;

    if (__DEV__) {
      console.log('[searchGlobalBrands] 🔍 Raw API Response:', {
        url: `/brands/search?${params.toString()}`,
        search,
        responseKeys: responseData ? Object.keys(responseData) : 'null',
        hasItems: !!responseData?.items,
        hasData: !!responseData?.data,
        itemsCount: Array.isArray(responseData?.items) ? responseData.items.length : 'N/A',
      });
    }

    // Backend response format'ını normalize et
    // Olası formatlar: { items: [...] }, { data: { items: [...] } }, { data: [...] }
    let items: any[] = [];
    let pagination: any = null;

    if (responseData) {
      // Format 1: { items: [...], pagination: {...} } (documented format)
      if (Array.isArray(responseData.items)) {
        items = responseData.items;
        pagination = responseData.pagination;
      }
      // Format 2: { data: { items: [...], pagination: {...} } } (wrapped format)
      else if (responseData.data && Array.isArray(responseData.data.items)) {
        items = responseData.data.items;
        pagination = responseData.data.pagination;
      }
      // Format 3: { data: [...] } (flat array in data)
      else if (Array.isArray(responseData.data)) {
        items = responseData.data;
        pagination = responseData.pagination;
      }
      // Format 4: Direct array response
      else if (Array.isArray(responseData)) {
        items = responseData;
      }
    }

    const safeResponse: GlobalBrandSearchResponse = {
      items,
      pagination: pagination || {
        hasMore: false,
        limit: limit,
      },
    };

    if (__DEV__) {
      console.log('[searchGlobalBrands] ✅ Parsed Response:', {
        itemsCount: safeResponse.items.length,
        hasMore: safeResponse.pagination.hasMore,
        categories: safeResponse.items.map(cat => ({
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          brandsCount: cat.brands?.length || 0,
        })),
      });
    }

    return safeResponse;
  } catch (error: any) {
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
 * ---------------------------------------------------------------------------
 * Brand Follow / Unfollow (Backend spec)
 * ---------------------------------------------------------------------------
 * - POST   /brands/:brandId/follow → 200: { isJoined: true, followers }
 * - DELETE /brands/:brandId/follow → 200: { isJoined: false, followers }
 * - GET /brands/:brandId/catalog → isJoined, followers (catalog ile uyumlu)
 * ---------------------------------------------------------------------------
 */

/**
 * Markayı takip et (Follow)
 * POST /brands/:brandId/follow - Bearer token zorunlu, body yok
 *
 * @param brandId - Takip edilecek markanın ID'si (UUID)
 * @returns { isJoined: true, followers } - Güncel takipçi sayısı
 */
export const followBrand = async (brandId: string): Promise<BrandFollowResponse> => {
  const response = await apiService.getClient().post<BrandFollowResponse>(
    `/brands/${brandId}/follow`
  );
  return response.data;
};

/**
 * Markayı bırak (Unfollow / Leave)
 * DELETE /brands/:brandId/follow - Bearer token zorunlu, body yok
 *
 * @param brandId - Bırakılacak markanın ID'si (UUID)
 * @returns { isJoined: false, followers } - Güncel takipçi sayısı
 */
export const unfollowBrand = async (brandId: string): Promise<BrandFollowResponse> => {
  const response = await apiService.getClient().delete<BrandFollowResponse>(
    `/brands/${brandId}/follow`
  );
  return response.data;
};

/** @deprecated Use followBrand. Kept for backward compatibility. */
export const joinBrand = followBrand;

/** @deprecated Use unfollowBrand. Kept for backward compatibility. */
export const leaveBrand = unfollowBrand;

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
    const response = await apiService.getClient().get<any>(
      `/brands/${brandId}/feed?${params.toString()}`
    );
    
    console.log('🔍 [getBrandFeed] Raw API Response:', {
      url: `/brands/${brandId}/feed?${params.toString()}`,
      responseKeys: Object.keys(response.data || {}),
      hasPosts: !!response.data?.posts,
      postsCount: response.data?.posts?.length || 0,
      hasPagination: !!response.data?.pagination,
      rawData: response.data,
    });
    
    // Backend response format: { brandId, name, posts: [...], pagination: {...} }
    // Frontend expected format: { items: [...], pagination: {...} }
    const backendData = response.data;
    
    const mappedResponse = {
      items: backendData.posts || [],
      pagination: backendData.pagination,
    };
    
    console.log('✅ [getBrandFeed] Mapped Response:', {
      itemsCount: mappedResponse.items.length,
      hasPagination: !!mappedResponse.pagination,
      firstItem: mappedResponse.items[0] ? {
        type: mappedResponse.items[0].type,
        id: mappedResponse.items[0].data?.id,
      } : 'No items',
    });
    
    return mappedResponse;
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

    // Response formatı: { items: [...], pagination: {...} } — item'lar categoryId, categoryName, products içerir
    if (responseData && typeof responseData === 'object' && 'items' in responseData) {
      const items = responseData.items || [];
      const rawPagination = responseData.pagination;
      const pagination = rawPagination && typeof rawPagination === 'object'
        ? { hasMore: !!rawPagination.hasMore, limit: rawPagination.limit ?? limit, cursor: rawPagination.cursor }
        : {
            hasMore: items.length >= limit,
            limit,
            cursor: items.length > 0 ? items[items.length - 1]?.categoryId : undefined,
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
 * Get Survey Questions
 * GET /brands/:brandId/surveys/:surveyId/questions – anket soruları
 */
export const getSurveyQuestions = async (
  brandId: string,
  surveyId: string
): Promise<SurveyQuestionsResponse> => {
  try {
    const response = await apiService.getClient().get<{ data?: SurveyQuestionsResponse } | SurveyQuestionsResponse>(
      `/brands/${brandId}/surveys/${surveyId}/questions`
    );
    const raw = (response.data as { data?: SurveyQuestionsResponse })?.data ?? response.data;
    const questions = Array.isArray((raw as SurveyQuestionsResponse)?.questions)
      ? (raw as SurveyQuestionsResponse).questions
      : [];
    return { questions };
  } catch (error: any) {
    console.error('[getSurveyQuestions] API Error:', { brandId, surveyId, message: error.message });
    throw error;
  }
};

/**
 * Submit Survey Answer
 * POST /brands/:brandId/surveys/:surveyId/answers – anket cevabı gönder
 *
 * Backend beklentisi: Anket tamamlandığında (son soru cevaplandığında) response body'de
 * SurveyCompletionResponse dönebilir: { awardedPoints, newTotalPoints }. Bu sayede UI'da
 * "X puan kazandınız" gösterilebilir. Şu an response void; backend hazır olunca tip güncellenebilir.
 */
export const submitSurveyAnswer = async (
  brandId: string,
  surveyId: string,
  payload: { questionId: string; answerId: string }
): Promise<void> => {
  await apiService.getClient().post(
    `/brands/${brandId}/surveys/${surveyId}/answers`,
    payload
  );
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
 * Get Brand History Feed endpoint function
 * /brands/{brandId}/history/feed API'sinden markanın geçmiş feed'ini getirir (infinite scroll ile)
 *
 * @param brandId - Marka ID'si
 * @param cursor - Pagination için cursor (ilk istek için undefined)
 * @param limit - Sayfa başına item sayısı (default: 10)
 * @returns BrandFeedResponse - Marka history feed'i (posts, benchmarks, vb.)
 */
export const getBrandHistoryFeed = async (
  brandId: string,
  cursor?: string,
  limit: number = 10
): Promise<BrandFeedResponse> => {
  try {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());

    const response = await apiService.getClient().get<any>(
      `/brands/${brandId}/history/feed?${params.toString()}`
    );

    // Backend response format: { items: [...], pagination: {...} }
    // Already matches frontend expected format
    return {
      items: response.data.items || [],
      pagination: response.data.pagination,
    };
  } catch (error: any) {
    console.error('[getBrandHistoryFeed] API Error:', {
      url: `/brands/${brandId}/history/feed`,
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
  const query = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() }).toString();
  const url = `/brands/${brandId}/products/${productId}/news/${newsId}/comments?${query}`;
  try {
    const response = await apiService.getClient().get<import('../types').NewsCommentsResponse>(url);
    return response.data;
  } catch (error: any) {
    console.error('[getBrandProductNewsComments] API Error:', {
      url,
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
 * /brands/{brandId}/products/{productId}/news/{newsId}/comments endpoint'ine POST request gönderir
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
      `/brands/${brandId}/products/${productId}/news/${newsId}/comments`,
      request
    );
    return response.data;
  } catch (error: any) {
    console.error('[createBrandProductNewsComment] API Error:', {
      url: `/brands/${brandId}/products/${productId}/news/${newsId}/comments`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};
