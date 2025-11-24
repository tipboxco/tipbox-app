import { apiService } from '../../../services/ApiService';
import type { CatalogCategory, CatalogSubCategory, CatalogProductGroup, CatalogProduct } from '../types';

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
 * @returns CatalogProduct[] - Ürün listesi
 */
export const getCatalogProducts = async (
  productGroupId: string
): Promise<CatalogProduct[]> => {
  const response = await apiService.getClient().get<CatalogProduct[]>(
    `/catalog/product-groups/${productGroupId}/products`
  );
  return response.data;
};

