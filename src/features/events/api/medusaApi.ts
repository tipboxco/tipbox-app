import { apiService } from '@/src/services/ApiService';
import type {
  MedusaCategoriesResponse,
  MedusaCategory,
  TipboxCategory,
  TipboxSubCategoriesResponse,
} from '../types/medusa.types';

/**
 * Tipbox API'den main kategorileri getir
 * GET /catalog/categories (BASE_URL zaten /api içeriyor)
 */
export const getMainCategories = async (): Promise<MedusaCategory[]> => {
  const client = apiService.getClient();

  const response = await client.get<TipboxCategory[]>('/catalog/categories');

  // Tipbox API formatını MedusaCategory formatına map et
  return response.data.map((cat) => ({
    id: cat.categoryId,
    name: cat.name,
  }));
};

/**
 * Tipbox API'den belirli bir kategorinin alt kategorilerini getir
 * GET /catalog/categories/:categoryId/sub-categories (BASE_URL zaten /api içeriyor)
 */
export const getSubCategories = async (
  parentCategoryId: string
): Promise<MedusaCategory[]> => {
  const client = apiService.getClient();

  try {
    console.log('[getSubCategories] 🔍 Fetching sub-categories for categoryId:', parentCategoryId);

    const response = await client.get<TipboxSubCategoriesResponse>(
      `/catalog/categories/${parentCategoryId}/sub-categories`,
      {
        params: {
          limit: 100, // Tüm sub-categories'i al
        },
      }
    );

    console.log('[getSubCategories] ✅ Response received:', response.data);

    // Tipbox API formatını MedusaCategory formatına map et
    // subCategoryId → id
    const mapped = response.data.items.map((cat) => ({
      id: cat.subCategoryId,
      name: cat.name,
    }));

    console.log('[getSubCategories] ✅ Mapped sub-categories:', mapped);
    return mapped;
  } catch (error: any) {
    // Sub categories endpoint hatası - detaylı log
    console.error('[getSubCategories] ❌ Error details:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      categoryId: parentCategoryId,
    });
    return [];
  }
};

/**
 * Tipbox API'den belirli bir kategoriyi ID ile getir
 * GET /catalog/categories/:categoryId (BASE_URL zaten /api içeriyor)
 */
export const getCategoryById = async (
  categoryId: string
): Promise<MedusaCategory> => {
  const client = apiService.getClient();

  try {
    const response = await client.get<TipboxCategory>(
      `/catalog/categories/${categoryId}`
    );

    // Tipbox API formatını MedusaCategory formatına map et
    return {
      id: response.data.categoryId,
      name: response.data.name,
    };
  } catch (error) {
    console.warn('[getCategoryById] Endpoint not available:', error);
    throw error;
  }
};
