import { apiService } from '@/src/services/ApiService';
import type {
  MedusaCategoriesResponse,
  MedusaCategory,
} from '../types/medusa.types';

/**
 * Medusa'dan main kategorileri getir (parent_category_id === null)
 */
export const getMainCategories = async (): Promise<MedusaCategory[]> => {
  const client = apiService.getClient();
  
  const response = await client.get<MedusaCategoriesResponse>(
    '/store/product-categories',
    {
      params: {
        parent_category_id: 'null', // Main kategoriler (parent yok)
        limit: 100,
        offset: 0,
      },
    }
  );

  return response.data.product_categories;
};

/**
 * Medusa'dan belirli bir kategorinin alt kategorilerini getir
 */
export const getSubCategories = async (
  parentCategoryId: string
): Promise<MedusaCategory[]> => {
  const client = apiService.getClient();
  
  const response = await client.get<MedusaCategoriesResponse>(
    '/store/product-categories',
    {
      params: {
        parent_category_id: parentCategoryId,
        limit: 100,
        offset: 0,
      },
    }
  );

  return response.data.product_categories;
};

/**
 * Medusa'dan belirli bir kategoriyi ID ile getir
 */
export const getCategoryById = async (
  categoryId: string
): Promise<MedusaCategory> => {
  const client = apiService.getClient();
  
  const response = await client.get<{ product_category: MedusaCategory }>(
    `/store/product-categories/${categoryId}`
  );

  return response.data.product_category;
};
