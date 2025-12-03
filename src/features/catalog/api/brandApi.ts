import { apiService } from '../../../services/ApiService';
import type { BrandCategory, BrandListItem, BrandCatalogResponse, BrandFeedResponse, BrandProductBookResponse } from '../types';

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

