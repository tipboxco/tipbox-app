import { apiService } from '../../../services/ApiService';

/**
 * Search Result Types
 */
export interface SearchUser {
  id: string;
  name: string;
  avatar: string | null;
  cosmetic: string | null;
}

export interface SearchBrand {
  id: string;
  name: string;
  category: string | null;
  logo: string | null;
}

export interface SearchProduct {
  id: string;
  name: string;
  model: string | null;
  specs: string | null;
  image: string | null;
}

/**
 * Search API Response
 */
export interface SearchResponse {
  userData: SearchUser[];
  brandData: SearchBrand[];
  productData: SearchProduct[];
}

/**
 * Search Parameters
 */
export interface SearchParams {
  keyword: string;
  types?: string[]; // 'user', 'brand', 'product'
  limit?: number; // Default: 10, Max: 50
}

/**
 * Search endpoint function
 * Genel arama endpoint'i - kullanıcı, marka ve ürün araması yapar
 *
 * @param params - Search parameters (keyword, types, limit)
 * @returns SearchResponse - Arama sonuçları (userData, brandData, productData)
 *
 * @example
 * const results = await search({ keyword: 'iPhone', types: ['product', 'brand'], limit: 20 });
 */
export const search = async (params: SearchParams): Promise<SearchResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append('keyword', params.keyword);
  
  if (params.types && params.types.length > 0) {
    queryParams.append('types', params.types.join(','));
  }
  
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }

  try {
    const response = await apiService.getClient().get<SearchResponse>(
      `/search?${queryParams.toString()}`
    );
    
    return response.data;
  } catch (error: any) {
    // CRITICAL FIX: 404 hatası için log gösterme (endpoint henüz implement edilmemiş)
    if (error.response?.status !== 404) {
      console.error('[search] API Error:', {
        url: `/search?${queryParams.toString()}`,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        params,
      });
    }
    throw error;
  }
};

