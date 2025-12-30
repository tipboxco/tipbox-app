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
   * Kategori - Tek bir kategori ID'si
   * Backend'de interests ile birleştirilir (OR mantığı)
   * mainCategoryId ve subCategoryId alanlarında filtreleme yapılır
   * Query: category=category-id
   */
  category?: string;
  
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
    return response.data;
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
 *
 * @param cursor - Pagination cursor (son item'ın id'si, opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @param filters - Filtre parametreleri (interests, tags, category, sort)
 * @returns FeedApiResponse - Feed items ve pagination bilgisi
 * 
 * Örnek Kullanım:
 * - Tüm filtreler: getFilteredFeed(undefined, 20, { interests: ['cat1'], tags: ['Review'], category: 'cat2', sort: 'top' })
 * - Sadece interests: getFilteredFeed(undefined, 20, { interests: ['cat1', 'cat2'] })
 * - Sadece tags: getFilteredFeed(undefined, 20, { tags: ['Review', 'Benchmark'] })
 * - Sadece category: getFilteredFeed(undefined, 20, { category: 'cat1' })
 * - Sadece sort: getFilteredFeed(undefined, 20, { sort: 'recent' })
 */
export const getFilteredFeed = async (
  cursor?: string,
  limit: number = 20,
  filters?: FeedFilterParams
): Promise<FeedApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());
  
  // İlgi Alanı (Interests) - Array olarak gönderilir
  // Backend'de category ile birleştirilir (OR mantığı)
  // Query: interests[]=category-id-1&interests[]=category-id-2
  if (filters?.interests && filters.interests.length > 0) {
    filters.interests.forEach((interest) => {
      params.append('interests[]', interest);
    });
  }
  
  // Etiket (Tags) - Array olarak gönderilir
  // Desteklenen: Review, Benchmark, Tips, Question, Experience, Update
  // Query: tags[]=Review&tags[]=Benchmark
  if (filters?.tags && filters.tags.length > 0) {
    filters.tags.forEach((tag) => {
      params.append('tags[]', tag);
    });
  }
  
  // Kategori (Category) - Tek değer olarak gönderilir
  // Backend'de interests ile birleştirilir (OR mantığı)
  // Query: category=category-id
  if (filters?.category) {
    params.append('category', filters.category);
  }
  
  // Sıralama (Sort) - 'recent' veya 'top'
  // recent: Boost → Tarih
  // top: Beğeni → Görüntülenme → Tarih
  // Query: sort=recent veya sort=top
  if (filters?.sort) {
    params.append('sort', filters.sort);
  }

  const fullUrl = `/feed/filtered?${params.toString()}`;
  
  // Log request details
  console.log('[getFilteredFeed] 📤 Request:', {
    url: fullUrl,
    filters: filters,
    interests: filters?.interests,
    tags: filters?.tags,
    category: filters?.category,
    sort: filters?.sort,
    cursor: cursor,
    limit: limit,
    params: params.toString(),
  });

  try {
    const response = await apiService.getClient().get<FeedApiResponse>(fullUrl);
    
    // Log response details
    console.log('[getFilteredFeed] ✅ Response:', {
      url: fullUrl,
      status: response.status,
      statusText: response.statusText,
      data: {
        itemsCount: response.data.items?.length || 0,
        pagination: response.data.pagination,
        items: response.data.items?.map((item) => ({
          type: item.type,
          id: item.data?.id,
          title: item.data?.title || item.data?.content?.substring(0, 50) || 'N/A',
        })) || [],
      },
      fullResponse: response.data,
    });
    
    return response.data;
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

