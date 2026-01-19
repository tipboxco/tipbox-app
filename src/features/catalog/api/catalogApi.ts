import { apiService } from '../../../services/ApiService';
import type { 
  CatalogCategory, 
  CatalogSubCategory, 
  CatalogProductGroup, 
  CatalogProduct,
  ProductDetail,
  ProductPostsResponse,
  ProductNewsResponse,
  NewsDetail,
  NewsCommentCreateRequest,
  NewsCommentCreateResponse,
  NewsCommentsResponse,
  NewsShareRequest,
  NewsShareResponse,
  NewsApiResponse
} from '../types';
import type { FeedApiResponse } from '@/src/features/feed/api/feedApi';

/**
 * Catalog Pagination Response - Pagination destekli response formatı
 */
export interface CatalogPaginationResponse<T> {
  items: T[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Get Catalog Categories endpoint function
 * Tüm katalog kategorilerini getirir (pagination ile)
 * 
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns CatalogPaginationResponse<CatalogCategory> - Katalog kategorileri listesi ve pagination bilgisi
 */
export const getCatalogCategories = async (
  cursor?: string,
  limit: number = 20
): Promise<CatalogPaginationResponse<CatalogCategory>> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());
  
  try {
    const response = await apiService.getClient().get<CatalogPaginationResponse<CatalogCategory> | CatalogCategory[]>(
      `/catalog/categories?${params.toString()}`
    );
    
    // Backend pagination destekliyorsa direkt döndür
    if (response.data && typeof response.data === 'object' && 'items' in response.data && 'pagination' in response.data) {
      return response.data as CatalogPaginationResponse<CatalogCategory>;
    }
    
    // Backend pagination desteklemiyorsa, array döndürebilir - fallback
    if (Array.isArray(response.data)) {
      return {
        items: response.data,
        pagination: {
          hasMore: false,
          limit: limit,
        },
      };
    }
    
    // Beklenmeyen format
    throw new Error('Unexpected response format from /catalog/categories');
  } catch (error: any) {
    // Backend pagination desteklemiyorsa, array döndürebilir - fallback
    if (error.response?.data && Array.isArray(error.response.data)) {
      return {
        items: error.response.data,
        pagination: {
          hasMore: false,
          limit: limit,
        },
      };
    }
    throw error;
  }
};

/**
 * Get Catalog SubCategories endpoint function
 * Belirli bir kategoriye ait alt kategorileri getirir (pagination ile)
 * 
 * @param categoryId - Kategori ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns CatalogPaginationResponse<CatalogSubCategory> - Alt kategori listesi ve pagination bilgisi
 */
export const getCatalogSubCategories = async (
  categoryId: string,
  cursor?: string,
  limit: number = 20
): Promise<CatalogPaginationResponse<CatalogSubCategory>> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());
  
  try {
    const response = await apiService.getClient().get<CatalogPaginationResponse<CatalogSubCategory> | CatalogSubCategory[]>(
      `/catalog/categories/${categoryId}/sub-categories?${params.toString()}`
    );
    
    // Backend pagination destekliyorsa direkt döndür
    if (response.data && typeof response.data === 'object' && 'items' in response.data && 'pagination' in response.data) {
      return response.data as CatalogPaginationResponse<CatalogSubCategory>;
    }
    
    // Backend pagination desteklemiyorsa, array döndürebilir - fallback
    if (Array.isArray(response.data)) {
      return {
        items: response.data,
        pagination: {
          hasMore: false,
          limit: limit,
        },
      };
    }
    
    // Beklenmeyen format
    throw new Error('Unexpected response format from /catalog/categories/{categoryId}/sub-categories');
  } catch (error: any) {
    // Backend pagination desteklemiyorsa, array döndürebilir - fallback
    if (error.response?.data && Array.isArray(error.response.data)) {
      return {
        items: error.response.data,
        pagination: {
          hasMore: false,
          limit: limit,
        },
      };
    }
    throw error;
  }
};

/**
 * Get Catalog ProductGroups endpoint function
 * Belirli bir alt kategoriye ait ürün gruplarını getirir (pagination ile)
 * 
 * @param subCategoryId - Alt kategori ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns CatalogPaginationResponse<CatalogProductGroup> - Ürün grubu listesi ve pagination bilgisi
 */
export const getCatalogProductGroups = async (
  subCategoryId: string,
  cursor?: string,
  limit: number = 20
): Promise<CatalogPaginationResponse<CatalogProductGroup>> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());
  
  try {
    const response = await apiService.getClient().get<CatalogPaginationResponse<CatalogProductGroup> | CatalogProductGroup[]>(
      `/catalog/sub-categories/${subCategoryId}/product-groups?${params.toString()}`
    );
    
    // Backend pagination destekliyorsa direkt döndür
    if (response.data && typeof response.data === 'object' && 'items' in response.data && 'pagination' in response.data) {
      return response.data as CatalogPaginationResponse<CatalogProductGroup>;
    }
    
    // Backend pagination desteklemiyorsa, array döndürebilir - fallback
    if (Array.isArray(response.data)) {
      return {
        items: response.data,
        pagination: {
          hasMore: false,
          limit: limit,
        },
      };
    }
    
    // Beklenmeyen format
    throw new Error('Unexpected response format from /catalog/sub-categories/{subCategoryId}/product-groups');
  } catch (error: any) {
    // Backend pagination desteklemiyorsa, array döndürebilir - fallback
    if (error.response?.data && Array.isArray(error.response.data)) {
      return {
        items: error.response.data,
        pagination: {
          hasMore: false,
          limit: limit,
        },
      };
    }
    throw error;
  }
};

/**
 * Get Catalog Products endpoint function
 * Belirli bir ürün grubuna ait ürünleri getirir
 * 
 * @param productGroupId - Ürün grubu ID'si
 * @param search - Product adı, marka veya açıklamasında arama (opsiyonel)
 * @returns CatalogProduct[] - Ürün listesi
 */
export const getCatalogProducts = async (
  productGroupId: string,
  search?: string
): Promise<CatalogProduct[]> => {
  const params = search ? { search } : undefined;
  const response = await apiService.getClient().get<CatalogProduct[]>(
    `/catalog/product-groups/${productGroupId}/products`,
    { params }
  );
  return response.data;
};

/**
 * Get Product Detail endpoint function
 * /products/{productId} endpoint'inden product detay bilgilerini getirir
 *
 * @param productId - Product ID'si
 * @returns ProductDetail - Product detay bilgileri
 */
export const getProductDetail = async (
  productId: string
): Promise<ProductDetail> => {
  try {
    const response = await apiService.getClient().get<ProductDetail>(
      `/products/${productId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getProductDetail] API Error:', {
      url: `/products/${productId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Product Posts endpoint function
 * /products/{productId}/posts endpoint'inden product postlarını getirir (pagination ile)
 * 
 * Filter Parametreleri:
 * - all: Tüm gönderiler (default)
 * - reviews: Sadece Experience (Review) gönderileri
 * - benchmarks: Sadece Benchmark gönderileri
 * - tips_and_tricks: Sadece Tips & Tricks gönderileri
 * 
 * Sort Parametreleri:
 * - newest: En yeni önce (default)
 * - oldest: En eski önce
 * - most_popular: Beğeni + yorum + kaydetme sayısına göre
 * 
 * Geriye Dönük Uyumluluk:
 * type parametresi otomatik olarak filter'a dönüştürülüyor:
 * - type=tips → filter=tips_and_tricks
 * - type=experience → filter=reviews
 * - type=benchmark → filter=benchmarks
 * - type=comments → filter=all (product için geçerli değil)
 *
 * @param productId - Product ID'si
 * @param filter - Post filter (all | reviews | benchmarks | tips_and_tricks) - opsiyonel, default: all
 * @param sort - Sort order (newest | oldest | most_popular) - opsiyonel, default: newest
 * @param type - Post type (experience, comments, benchmark, tips) - opsiyonel, geriye dönük uyumluluk için (filter'a dönüştürülür)
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns ProductPostsResponse - Product postları ve pagination bilgisi
 */
export const getProductPosts = async (
  productId: string,
  filter?: 'all' | 'reviews' | 'benchmarks' | 'tips_and_tricks',
  sort?: 'newest' | 'oldest' | 'most_popular',
  type?: 'experience' | 'comments' | 'benchmark' | 'tips',
  cursor?: string,
  limit: number = 20
): Promise<ProductPostsResponse> => {
  const params = new URLSearchParams();
  
  // Geriye dönük uyumluluk: type parametresini filter'a dönüştür
  let finalFilter = filter;
  if (type && !filter) {
    const typeToFilterMap: Record<string, 'all' | 'reviews' | 'benchmarks' | 'tips_and_tricks'> = {
      'tips': 'tips_and_tricks',
      'experience': 'reviews',
      'benchmark': 'benchmarks',
      'comments': 'all', // Product için comments geçerli değil, all kullan
    };
    finalFilter = typeToFilterMap[type] || 'all';
  }
  
  // Filter parametresi ekle (all ise ekleme)
  if (finalFilter && finalFilter !== 'all') {
    params.append('filter', finalFilter);
  }
  
  // Sort parametresi ekle (newest ise ekleme)
  if (sort && sort !== 'newest') {
    params.append('sort', sort);
  }
  
  // Geriye dönük uyumluluk: type parametresini de ekle (backend her ikisini de destekliyor)
  if (type) {
    params.append('type', type);
  }
  
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<ProductPostsResponse>(
      `/products/${productId}/posts?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getProductPosts] API Error:', {
      url: `/products/${productId}/posts?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Product News endpoint function
 * /products/{productId}/news endpoint'inden product haberlerini getirir (pagination ile)
 *
 * @param productId - Product ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns ProductNewsResponse - Product haberleri ve pagination bilgisi
 */
export const getProductNews = async (
  productId: string,
  cursor?: string,
  limit: number = 20
): Promise<ProductNewsResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<ProductNewsResponse>(
      `/products/${productId}/news?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getProductNews] API Error:', {
      url: `/products/${productId}/news?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get News Detail endpoint function
 * /news/{newsId} endpoint'inden news detay bilgilerini getirir
 *
 * @param newsId - News ID'si
 * @returns NewsDetail - News detay bilgileri
 */
export const getNewsDetail = async (
  newsId: string
): Promise<NewsDetail> => {
  try {
    const response = await apiService.getClient().get<NewsDetail>(
      `/news/${newsId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getNewsDetail] API Error:', {
      url: `/news/${newsId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Like News endpoint function
 * /news/{newsId}/like endpoint'ine POST request gönderir
 *
 * @param newsId - News ID'si
 * @returns NewsApiResponse - Success response
 */
export const likeNews = async (
  newsId: string
): Promise<NewsApiResponse> => {
  try {
    const response = await apiService.getClient().post<NewsApiResponse>(
      `/news/${newsId}/like`
    );
    return response.data;
  } catch (error: any) {
    console.error('[likeNews] API Error:', {
      url: `/news/${newsId}/like`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Unlike News endpoint function
 * /news/{newsId}/like endpoint'ine DELETE request gönderir
 *
 * @param newsId - News ID'si
 * @returns NewsApiResponse - Success response
 */
export const unlikeNews = async (
  newsId: string
): Promise<NewsApiResponse> => {
  try {
    const response = await apiService.getClient().delete<NewsApiResponse>(
      `/news/${newsId}/like`
    );
    return response.data;
  } catch (error: any) {
    console.error('[unlikeNews] API Error:', {
      url: `/news/${newsId}/like`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};


/**
 * Share News endpoint function
 * /news/{newsId}/share endpoint'ine POST request gönderir
 *
 * @param newsId - News ID'si
 * @param request - Share request
 * @returns NewsShareResponse - Success response
 */
export const shareNews = async (
  newsId: string,
  request: NewsShareRequest
): Promise<NewsShareResponse> => {
  try {
    const response = await apiService.getClient().post<NewsShareResponse>(
      `/news/${newsId}/share`,
      request
    );
    return response.data;
  } catch (error: any) {
    console.error('[shareNews] API Error:', {
      url: `/news/${newsId}/share`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Favorite News endpoint function
 * /news/{newsId}/favorite endpoint'ine POST request gönderir
 *
 * @param newsId - News ID'si
 * @returns NewsApiResponse - Success response
 */
export const favoriteNews = async (
  newsId: string
): Promise<NewsApiResponse> => {
  try {
    const response = await apiService.getClient().post<import('../types').NewsApiResponse>(
      `/news/${newsId}/favorite`
    );
    return response.data;
  } catch (error: any) {
    console.error('[favoriteNews] API Error:', {
      url: `/news/${newsId}/favorite`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Unfavorite News endpoint function
 * /news/{newsId}/favorite endpoint'ine DELETE request gönderir
 *
 * @param newsId - News ID'si
 * @returns NewsApiResponse - Success response
 */
export const unfavoriteNews = async (
  newsId: string
): Promise<NewsApiResponse> => {
  try {
    const response = await apiService.getClient().delete<NewsApiResponse>(
      `/news/${newsId}/favorite`
    );
    return response.data;
  } catch (error: any) {
    console.error('[unfavoriteNews] API Error:', {
      url: `/news/${newsId}/favorite`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Sub Category Posts endpoint function
 * /catalog/sub-categories/:subCategoryId/posts endpoint'inden sub category postlarını getirir
 * 
 * Hiyerarşik Feed Mantığı:
 * - Sub category'ye ait gönderiler
 * - Alt product group'ların gönderileri
 * - Alt product'ların gönderileri (sadece Free, Tips, Question)
 * 
 * Filter Parametreleri:
 * - all: Tüm gönderiler (default)
 * - free: Sadece Free gönderiler
 * - tips_and_tricks: Sadece Tips & Tricks gönderileri
 * - questions: Sadece Question gönderileri
 * 
 * Sort Parametreleri:
 * - newest: En yeni önce (default)
 * - oldest: En eski önce
 * - most_popular: Beğeni + yorum + kaydetme sayısına göre
 * 
 * @param subCategoryId - Sub category ID'si
 * @param filter - Post filter (all | free | tips_and_tricks | questions) - opsiyonel, default: all
 * @param sort - Sort order (newest | oldest | most_popular) - opsiyonel, default: newest
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns FeedApiResponse - Feed items ve pagination bilgisi
 * 
 * @see docs/MOBILE_API_COMPATIBILITY.md - Detaylı endpoint dokümantasyonu
 */
export const getSubCategoryPosts = async (
  subCategoryId: string,
  filter?: 'all' | 'free' | 'tips_and_tricks' | 'questions',
  sort?: 'newest' | 'oldest' | 'most_popular',
  cursor?: string,
  limit: number = 20
): Promise<FeedApiResponse> => {
  const params = new URLSearchParams();
  if (filter && filter !== 'all') {
    params.append('filter', filter);
  }
  if (sort && sort !== 'newest') {
    params.append('sort', sort);
  }
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<FeedApiResponse>(
      `/catalog/sub-categories/${subCategoryId}/posts?${params.toString()}`
    );
    
    // Ensure items is always an array (defensive programming)
    const safeResponse: FeedApiResponse = {
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
        console.warn('[getSubCategoryPosts] ⚠️ Endpoint not found (404). Backend endpoint may not be implemented yet:', {
          url: `/catalog/sub-categories/${subCategoryId}/posts`,
          subCategoryId,
          message: 'This endpoint is not available on the backend server. Please contact backend team.',
        });
      }
      
      // Boş response döndür (kullanıcıya hata göstermek yerine boş feed göster)
      return {
        items: [],
        pagination: {
          hasMore: false,
          limit: limit,
        },
      };
    }
    
    // 404 dışındaki hatalar için error log
    console.error('[getSubCategoryPosts] API Error:', {
      url: `/catalog/sub-categories/${subCategoryId}/posts?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Product Group Posts endpoint function
 * /catalog/product-groups/:productGroupId/posts endpoint'inden product group postlarını getirir
 * 
 * Hiyerarşik Feed Mantığı:
 * - Product group'a ait gönderiler
 * - Alt product'ların gönderileri (sadece Free, Tips, Question)
 * 
 * Filter Parametreleri:
 * - all: Tüm gönderiler (default)
 * - free: Sadece Free gönderiler
 * - tips_and_tricks: Sadece Tips & Tricks gönderileri
 * - questions: Sadece Question gönderileri
 * 
 * Sort Parametreleri:
 * - newest: En yeni önce (default)
 * - oldest: En eski önce
 * - most_popular: Beğeni + yorum + kaydetme sayısına göre
 * 
 * @param productGroupId - Product group ID'si
 * @param filter - Post filter (all | free | tips_and_tricks | questions) - opsiyonel, default: all
 * @param sort - Sort order (newest | oldest | most_popular) - opsiyonel, default: newest
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns FeedApiResponse - Feed items ve pagination bilgisi
 * 
 * @see docs/MOBILE_API_COMPATIBILITY.md - Detaylı endpoint dokümantasyonu
 */
export const getProductGroupPosts = async (
  productGroupId: string,
  filter?: 'all' | 'free' | 'tips_and_tricks' | 'questions',
  sort?: 'newest' | 'oldest' | 'most_popular',
  cursor?: string,
  limit: number = 20
): Promise<FeedApiResponse> => {
  const params = new URLSearchParams();
  if (filter && filter !== 'all') {
    params.append('filter', filter);
  }
  if (sort && sort !== 'newest') {
    params.append('sort', sort);
  }
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<FeedApiResponse>(
      `/catalog/product-groups/${productGroupId}/posts?${params.toString()}`
    );
    
    // Ensure items is always an array (defensive programming)
    const safeResponse: FeedApiResponse = {
      items: Array.isArray(response.data?.items) ? response.data.items : [],
      pagination: response.data?.pagination || {
        hasMore: false,
        limit: limit,
      },
    };
    
    return safeResponse;
  } catch (error: any) {
    console.error('[getProductGroupPosts] API Error:', {
      url: `/catalog/product-groups/${productGroupId}/posts?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Product Posts endpoint function (Catalog API)
 * /catalog/products/:productId/posts endpoint'inden product postlarını getirir
 * 
 * Filter Parametreleri:
 * - all: Tüm gönderiler (default)
 * - free: Sadece Free gönderiler
 * - tips_and_tricks: Sadece Tips & Tricks gönderileri
 * - questions: Sadece Question gönderileri
 * - updates: Sadece Update gönderileri
 * - benchmarks: Sadece Benchmark gönderileri
 * - reviews: Sadece Experience (Review) gönderileri
 * 
 * Sort Parametreleri:
 * - newest: En yeni önce (default)
 * - oldest: En eski önce
 * - most_popular: Beğeni + yorum + kaydetme sayısına göre
 * 
 * @param productId - Product ID'si
 * @param filter - Post filter (all | free | tips_and_tricks | questions | updates | benchmarks | reviews) - opsiyonel, default: all
 * @param sort - Sort order (newest | oldest | most_popular) - opsiyonel, default: newest
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns FeedApiResponse - Feed items ve pagination bilgisi
 * 
 * @see docs/MOBILE_API_COMPATIBILITY.md - Detaylı endpoint dokümantasyonu
 * 
 * Not: Bu fonksiyon /catalog/products/:productId/posts endpoint'ini kullanır
 * /products/:productId/posts endpoint'i için getProductPosts kullanılmalı
 */
export const getCatalogProductPosts = async (
  productId: string,
  filter?: 'all' | 'free' | 'tips_and_tricks' | 'questions' | 'updates' | 'benchmarks' | 'reviews',
  sort?: 'newest' | 'oldest' | 'most_popular',
  cursor?: string,
  limit: number = 20
): Promise<FeedApiResponse> => {
  const params = new URLSearchParams();
  if (filter && filter !== 'all') {
    params.append('filter', filter);
  }
  if (sort && sort !== 'newest') {
    params.append('sort', sort);
  }
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<FeedApiResponse>(
      `/catalog/products/${productId}/posts?${params.toString()}`
    );
    
    // Ensure items is always an array (defensive programming)
    const safeResponse: FeedApiResponse = {
      items: Array.isArray(response.data?.items) ? response.data.items : [],
      pagination: response.data?.pagination || {
        hasMore: false,
        limit: limit,
      },
    };
    
    return safeResponse;
  } catch (error: any) {
    console.error('[getCatalogProductPosts] API Error:', {
      url: `/catalog/products/${productId}/posts?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};
