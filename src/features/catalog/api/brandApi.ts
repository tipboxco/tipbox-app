import { apiService } from '../../../services/ApiService';
import type { BrandCategory, BrandListItem } from '../types';

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
  const response = await apiService.getClient().get<BrandListItem[]>(
    `/brands/categories/${categoryId}/brands`
  );
  return response.data;
};


