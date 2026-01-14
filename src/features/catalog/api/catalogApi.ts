import { apiService } from '../../../services/ApiService';
import type { 
  CatalogCategory, 
  CatalogSubCategory, 
  CatalogProductGroup, 
  CatalogProduct,
  ProductDetail,
  ProductPostsResponse,
  ProductNewsResponse,
  NewsDetail
} from '../types';
import type { FeedApiResponse } from '@/src/features/feed/api/feedApi';

/**
 * Get Catalog Categories endpoint function
 * Tüm katalog kategorilerini getirir
 * 
 * @returns CatalogCategory[] - Katalog kategorileri listesi
 */
export const getCatalogCategories = async (): Promise<CatalogCategory[]> => {
  const response = await apiService.getClient().get<CatalogCategory[]>(
    '/catalog/categories'
  );
  return response.data;
};

/**
 * Get Catalog SubCategories endpoint function
 * Belirli bir kategoriye ait alt kategorileri getirir
 * 
 * @param categoryId - Kategori ID'si
 * @returns CatalogSubCategory[] - Alt kategori listesi
 */
export const getCatalogSubCategories = async (
  categoryId: string
): Promise<CatalogSubCategory[]> => {
  const response = await apiService.getClient().get<CatalogSubCategory[]>(
    `/catalog/categories/${categoryId}/sub-categories`
  );
  return response.data;
};

/**
 * Get Catalog ProductGroups endpoint function
 * Belirli bir alt kategoriye ait ürün gruplarını getirir
 * 
 * @param subCategoryId - Alt kategori ID'si
 * @returns CatalogProductGroup[] - Ürün grubu listesi
 */
export const getCatalogProductGroups = async (
  subCategoryId: string
): Promise<CatalogProductGroup[]> => {
  const response = await apiService.getClient().get<CatalogProductGroup[]>(
    `/catalog/sub-categories/${subCategoryId}/product-groups`
  );
  return response.data;
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
 * @param productId - Product ID'si
 * @param type - Post type (experience, comments, benchmark) - opsiyonel
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns ProductPostsResponse - Product postları ve pagination bilgisi
 */
export const getProductPosts = async (
  productId: string,
  type?: 'experience' | 'comments' | 'benchmark',
  cursor?: string,
  limit: number = 20
): Promise<ProductPostsResponse> => {
  const params = new URLSearchParams();
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
 * Get Sub Category Posts endpoint function
 * /catalog/sub-categories/:subCategoryId/posts endpoint'inden sub category postlarını getirir
 * 
 * Hiyerarşik Feed Mantığı:
 * - Sub category'ye ait gönderiler
 * - Alt product group'ların gönderileri
 * - Alt product'ların gönderileri (sadece Free, Tips, Question)
 * 
 * Otomatik Post Type Filtreleme:
 * - Experience, Update, Benchmark otomatik olarak filtrelenir
 * 
 * @param subCategoryId - Sub category ID'si
 * @param type - Post type (tips, experience, comments, benchmark) - opsiyonel
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns FeedApiResponse - Feed items ve pagination bilgisi
 * 
 * @see docs/MOBILE_API_COMPATIBILITY.md - Detaylı endpoint dokümantasyonu
 */
export const getSubCategoryPosts = async (
  subCategoryId: string,
  type?: 'tips' | 'experience' | 'comments' | 'benchmark',
  cursor?: string,
  limit: number = 20
): Promise<FeedApiResponse> => {
  const params = new URLSearchParams();
  if (type) {
    params.append('type', type);
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
 * Otomatik Post Type Filtreleme:
 * - Experience, Update, Benchmark otomatik olarak filtrelenir
 * 
 * @param productGroupId - Product group ID'si
 * @param type - Post type (tips, experience, comments, benchmark) - opsiyonel
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns FeedApiResponse - Feed items ve pagination bilgisi
 * 
 * @see docs/MOBILE_API_COMPATIBILITY.md - Detaylı endpoint dokümantasyonu
 */
export const getProductGroupPosts = async (
  productGroupId: string,
  type?: 'tips' | 'experience' | 'comments' | 'benchmark',
  cursor?: string,
  limit: number = 20
): Promise<FeedApiResponse> => {
  const params = new URLSearchParams();
  if (type) {
    params.append('type', type);
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
 * Post Type Filtreleme:
 * - Tüm post tipleri gösterilir (filtreleme yok)
 * - type parametresi ile manuel filtreleme yapılabilir
 * 
 * @param productId - Product ID'si
 * @param type - Post type (tips, experience, comments, benchmark) - opsiyonel
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
  type?: 'tips' | 'experience' | 'comments' | 'benchmark',
  cursor?: string,
  limit: number = 20
): Promise<FeedApiResponse> => {
  const params = new URLSearchParams();
  if (type) {
    params.append('type', type);
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
