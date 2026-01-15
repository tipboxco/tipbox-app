import { apiService } from '../../../services/ApiService';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import type { ReviewApiItem } from '@/src/types/ReviewsCard';
import type { ProfilePost } from '@/src/features/profile/types';
import type { UpdateApiItem } from '@/src/types/UpdateCard';
import { CardType } from '@/src/types/common';

/**
 * Feed API Response Item - Her feed item'ı type ve data içerir
 */
export interface FeedApiItem {
  type: string;
  data: 
    | (ProfilePost & { type: 'post' })
    | (ReviewApiItem & { type: 'experience' })
    | (BenchmarkApiItem & { type: 'benchmark' })
    | (TipsApiItem & { type: 'tipsAndTricks' })
    | (QuestionApiItem & { type: 'question' })
    | (UpdateApiItem & { type: 'update' });
}

/**
 * Feed API Response - Pagination ile birlikte
 */
export interface FeedApiResponse {
  items: FeedApiItem[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Feed Filter Parameters
 * /feed/filtered endpoint'i için filtre parametreleri
 * 
 * @see docs/FEED_FILTERS_STATUS.md - Detaylı filtre dokümantasyonu
 * 
 * Backend Filtreleme Mantığı:
 * - Interests ve Category: Backend'de birleştirilir (OR mantığı)
 *   - mainCategoryId ve subCategoryId alanlarında arama yapılır
 * - Tags: contentPostTags ve tags tablolarında arama yapılır
 * - Sort:
 *   - recent: Boost → Tarih (isBoosted desc, createdAt desc)
 *   - top: Beğeni → Görüntülenme → Tarih (likesCount desc, viewsCount desc, createdAt desc)
 */
export interface FeedFilterParams {
  /** 
   * İlgi Alanı - Kategori ID'leri array'i
   * Backend'de category ile birleştirilir (OR mantığı)
   * mainCategoryId ve subCategoryId alanlarında filtreleme yapılır
   * Query: interests[]=category-id-1&interests[]=category-id-2
   */
  interests?: string[];
  
  /** 
   * Etiket - Post türleri array'i
   * Desteklenen değerler: Review, Benchmark, Tips, Question, Experience, Update
   * contentPostTags ve tags tablolarında arama yapılır
   * Query: tags[]=Review&tags[]=Benchmark
   */
  tags?: string[];
  
  /** 
   * Kategori - Kategori ID'leri array'i
   * Backend'de interests ile birleştirilir (OR mantığı)
   * mainCategoryId ve subCategoryId alanlarında filtreleme yapılır
   * Query: category[]=category-id-1&category[]=category-id-2
   */
  category?: string[];
  
  /** 
   * Sıralama
   * - recent: Boost edilmiş postlar önce, sonra oluşturulma tarihine göre (yeni → eski)
   * - top: Beğeni sayısına göre (yüksek → düşük), sonra görüntülenme, son olarak tarih
   * Query: sort=recent veya sort=top
   */
  sort?: 'recent' | 'top';
}

/**
 * Get Feed endpoint function
 * Kullanıcının feed akışını getirir (pagination ile)
 *
 * @param cursor - Pagination cursor (son item'ın id'si, opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @param contextType - Context type (opsiyonel): 'sub_category' | 'product_group' | 'product'
 * @param contextId - Context ID (opsiyonel): UUID
 * @returns FeedApiResponse - Feed items ve pagination bilgisi
 */
export const getFeed = async (
  cursor?: string,
  limit: number = 20,
  contextType?: 'sub_category' | 'product_group' | 'product',
  contextId?: string
): Promise<FeedApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());
  if (contextType) {
    params.append('contextType', contextType);
  }
  if (contextId) {
    params.append('contextId', contextId);
  }

  try {
    const response = await apiService.getClient().get<FeedApiResponse>(
      `/feed?${params.toString()}`
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
    console.error('[getFeed] API Error:', {
      url: `/feed?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: {
        baseURL: error.config?.baseURL,
        headers: error.config?.headers,
      },
    });
    throw error;
  }
};

/**
 * Get Filtered Feed endpoint function
 * Filtrelenmiş feed akışını getirir (pagination ile)
 * 
 * @see docs/FEED_FILTERS_STATUS.md - Detaylı filtre dokümantasyonu ve test senaryoları
 * @see docs/MOBILE_API_COMPATIBILITY.md - Context-based feed dokümantasyonu
 *
 * @param cursor - Pagination cursor (son item'ın id'si, opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @param filters - Filtre parametreleri (interests, tags, category, sort)
 * @param contextType - Context type (opsiyonel): 'sub_category' | 'product_group' | 'product'
 * @param contextId - Context ID (opsiyonel): UUID (required if contextType is provided)
 * @returns FeedApiResponse - Feed items ve pagination bilgisi
 * 
 * Context-Based Filtreleme:
 * - contextType ve contextId belirtilirse, backend context'e göre filtreleme yapar
 * - tags yoksa, backend context seviyesine göre otomatik post type filtreleme yapar
 * - tags varsa, kullanıcının seçtiği tag filtreleri uygulanır
 * 
 * Örnek Kullanım:
 * - Context-based: getFilteredFeed(undefined, 20, undefined, 'product_group', 'product-group-id')
 * - Context + filters: getFilteredFeed(undefined, 20, { tags: ['Tips'], sort: 'recent' }, 'product_group', 'product-group-id')
 * - Tüm filtreler: getFilteredFeed(undefined, 20, { interests: ['cat1'], tags: ['Review'], category: 'cat2', sort: 'top' })
 */
export const getFilteredFeed = async (
  cursor?: string,
  limit: number = 20,
  filters?: FeedFilterParams,
  contextType?: 'sub_category' | 'product_group' | 'product',
  contextId?: string
): Promise<FeedApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());
  
  // İlgi Alanı (Interests) - Array olarak gönderilir
  // Backend'de category ile birleştirilir (OR mantığı)
  // Query: interests[]=category-id-1&interests[]=category-id-2
  if (filters?.interests && Array.isArray(filters.interests) && filters.interests.length > 0) {
    filters.interests.forEach((interest) => {
      if (interest) {
        params.append('interests[]', interest);
      }
    });
  }
  
  // Etiket (Tags) - Array olarak gönderilir
  // Desteklenen: Review, Benchmark, Tips, Question, Experience, Update
  // Query: tags[]=Review&tags[]=Benchmark
  if (filters?.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
    filters.tags.forEach((tag) => {
      if (tag) {
        params.append('tags[]', tag);
      }
    });
  }
  
  // Kategori (Category) - Backend tek bir kategori ID bekliyor
  // Backend'de interests ile birleştirilir (OR mantığı)
  // Query: category=category-id (tek değer)
  // NOT: Backend'de Prisma sorgusu array'i desteklemiyor, bu yüzden sadece ilk kategori gönderiliyor
  // TODO: Backend'de Prisma sorgusu düzeltilmeli: mainCategoryId: { in: categoryArray }
  if (filters?.category && Array.isArray(filters.category) && filters.category.length > 0) {
    // Backend tek bir değer bekliyor, ilk kategoriyi gönder
    // Backend düzeltildiğinde array olarak gönderilebilir
    const firstCategory = filters.category[0];
    if (firstCategory) {
      params.append('category', firstCategory);
    }
  }
  
  // Sıralama (Sort) - 'recent' veya 'top'
  // recent: Boost → Tarih
  // top: Beğeni → Görüntülenme → Tarih
  // Query: sort=recent veya sort=top
  if (filters?.sort) {
    params.append('sort', filters.sort);
  }
  
  // Context parametreleri (Backend'de zaten destekleniyor)
  // Backend otomatik olarak context seviyesine göre filtreleme yapar
  // Eğer tags belirtilmemişse, backend otomatik filtreleme yapar
  // Eğer tags belirtilmişse, kullanıcının seçtiği filtreler uygulanır
  if (contextType) {
    params.append('contextType', contextType);
  }
  if (contextId) {
    params.append('contextId', contextId);
  }

  const fullUrl = `/feed/filtered?${params.toString()}`;

  try {
    const response = await apiService.getClient().get<FeedApiResponse>(fullUrl);
    
    // Ensure items is always an array (defensive programming)
    const safeResponse: FeedApiResponse = {
      items: Array.isArray(response.data?.items) ? response.data.items : [],
      pagination: response.data?.pagination || {
        hasMore: false,
        limit: limit,
      },
    };
        itemsCount: safeResponse.items.length,
        pagination: safeResponse.pagination,
        items: Array.isArray(safeResponse.items) 
          ? safeResponse.items.map((item) => {
              const content = 'content' in (item?.data || {}) 
                ? (typeof item.data.content === 'string' 
                    ? item.data.content.substring(0, 50) 
                    : 'N/A')
                : 'N/A';
              return {
                type: item?.type || 'unknown',
                id: item?.data?.id || 'unknown',
                contentPreview: content,
              };
            })
          : [],
      },
      fullResponse: safeResponse,
    });
    
    return safeResponse;
  } catch (error: any) {
    console.error('[getFilteredFeed] ❌ API Error:', {
      url: fullUrl,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: {
        baseURL: error.config?.baseURL,
        headers: error.config?.headers,
      },
    });
    throw error;
  }
};

