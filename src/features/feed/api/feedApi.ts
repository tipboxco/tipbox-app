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
 * - Interests: Feed source filtreleri (TRUSTER, CATEGORY_MATCH, TRENDING, NEW_USER, BOOSTED, INVENTORY_MATCH, PRODUCT_GROUP_MATCH)
 *   - Case-insensitive: new_user, boosted, truster gibi de çalışır
 *   - Query: ?interests=TRUSTER&interests=BOOSTED veya ?interests[]=TRUSTER&interests[]=BOOSTED
 * - Tags: İçerik etiketleri (Review, Benchmark, Tips, Question, Experience, Update)
 *   - Case-insensitive: review, REVIEW gibi de çalışır
 *   - Query: ?tags=Review&tags=Experience
 * - Category: Tek bir kategori ID (UUID, ULID, prefix'li ID veya kategori adı)
 *   - Sadece main category'de filtreler
 *   - Query: ?category=550e8400-e29b-41d4-a716-446655440000 veya ?category=Beauty
 * - Sort: Sıralama (recent: default, top)
 *   - recent: En yeni postlar
 *   - top: Relevance score'a göre popüler olanlar
 *   - Query: ?sort=top
 */
export interface FeedFilterParams {
  /** 
   * Feed Source Filtreleri - Array (dropdown, default yok)
   * Desteklenen değerler: TRUSTER, CATEGORY_MATCH, TRENDING, NEW_USER, BOOSTED, INVENTORY_MATCH, PRODUCT_GROUP_MATCH
   * Case-insensitive: new_user, boosted, truster gibi de çalışır
   * Query: ?interests=TRUSTER&interests=BOOSTED veya ?interests[]=TRUSTER&interests[]=BOOSTED
   */
  interests?: string[];
  
  /** 
   * Etiket - Post türleri array'i (dropdown)
   * Desteklenen değerler: Free, Benchmark, Experience, Update, Question, Tips and Tricks
   * Backend mapping: Free→FREE, Benchmark→COMPARE, Experience→EXPERIENCE, Update→UPDATE, Question→QUESTION, Tips and Tricks→TIPS
   * Query: ?tags=Free&tags=Experience
   */
  tags?: string[];
  
  /** 
   * Kategori - Tek bir kategori ID (dropdown, default yok)
   * Format: UUID, ULID, prefix'li ID (pcat_, mcat_, scat_) veya kategori adı
   * Sadece main category'de filtreler
   * Query: ?category=550e8400-e29b-41d4-a716-446655440000 veya ?category=Beauty
   */
  category?: string;
  
  /** 
   * Sıralama (dropdown, default yok)
   * - recent: En yeni postlar
   * - top: Relevance score'a göre popüler olanlar
   * Query: ?sort=recent veya ?sort=top
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
  
  // Feed Source Filtreleri (Interests) - Array formatında query string
  // Backend format: ?interests=TRUSTER&interests=BOOSTED veya ?interests[]=TRUSTER&interests[]=BOOSTED
  // Case-insensitive: new_user, boosted, truster gibi de çalışır
  // Desteklenen: TRUSTER, CATEGORY_MATCH, TRENDING, NEW_USER, BOOSTED, INVENTORY_MATCH, PRODUCT_GROUP_MATCH
  if (filters?.interests && Array.isArray(filters.interests) && filters.interests.length > 0) {
    // ENGAGEMENT_HIGH -> TRENDING mapping (backend TRENDING bekliyor)
    const mappedInterests = filters.interests.map((interest) => {
      // Case-insensitive mapping: new_user -> NEW_USER, boosted -> BOOSTED, etc.
      const upperInterest = interest.toUpperCase();
      if (upperInterest === 'ENGAGEMENT_HIGH') {
        return 'TRENDING';
      }
      // Diğer case-insensitive mapping'ler
      if (upperInterest === 'NEW_USER' || upperInterest === 'NEWUSER') {
        return 'NEW_USER';
      }
      if (upperInterest === 'CATEGORY_MATCH' || upperInterest === 'CATEGORYMATCH') {
        return 'CATEGORY_MATCH';
      }
      if (upperInterest === 'INVENTORY_MATCH' || upperInterest === 'INVENTORYMATCH') {
        return 'INVENTORY_MATCH';
      }
      if (upperInterest === 'PRODUCT_GROUP_MATCH' || upperInterest === 'PRODUCTGROUPMATCH') {
        return 'PRODUCT_GROUP_MATCH';
      }
      // TRUSTER, BOOSTED, TRENDING zaten doğru formatta
      return upperInterest;
    });
    // Array formatında query string: ?interests=TRUSTER&interests=BOOSTED
    mappedInterests.forEach((interest) => {
      params.append('interests', interest);
    });
  }
  
  // Etiket (Tags) - Array formatında query string
  // Backend format: ?tags=Free&tags=Experience
  // Mapping: Free→FREE, Benchmark→COMPARE, Experience→EXPERIENCE, Update→UPDATE, Question→QUESTION, Tips and Tricks→TIPS
  // Desteklenen: Free, Benchmark, Experience, Update, Question, Tips and Tricks
  if (filters?.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
    // Tags mapping: UI değerlerini backend değerlerine map et
    const tagMapping: Record<string, string> = {
      'Free': 'Free', // Backend'de Free olarak gönderilir, backend FREE'ye map eder
      'Benchmark': 'Benchmark', // Backend'de Benchmark olarak gönderilir, backend COMPARE'ye map eder
      'Experience': 'Experience', // Backend'de Experience olarak gönderilir, backend EXPERIENCE'ye map eder
      'Update': 'Update', // Backend'de Update olarak gönderilir, backend UPDATE'ye map eder
      'Question': 'Question', // Backend'de Question olarak gönderilir, backend QUESTION'a map eder
      'Tips and Tricks': 'Tips and Tricks', // Backend'de Tips and Tricks olarak gönderilir, backend TIPS'e map eder
      // Case-insensitive fallback
      'free': 'Free',
      'benchmark': 'Benchmark',
      'experience': 'Experience',
      'update': 'Update',
      'question': 'Question',
      'tips and tricks': 'Tips and Tricks',
      'tips': 'Tips and Tricks',
      'tipsandtricks': 'Tips and Tricks',
    };
    
    const mappedTags = filters.tags.map((tag) => {
      // Mapping varsa kullan, yoksa orijinal değeri kullan
      return tagMapping[tag] || tag;
    });
    
    // Array formatında query string: ?tags=Free&tags=Experience
    mappedTags.forEach((tag) => {
      params.append('tags', tag);
    });
  }
  
  // Kategori (Category) - Tek bir string (UUID, ULID, prefix'li ID veya kategori adı)
  // Sadece main category'de filtreler
  // Query: ?category=550e8400-e29b-41d4-a716-446655440000 veya ?category=Beauty
  if (filters?.category && typeof filters.category === 'string' && filters.category.trim().length > 0) {
    params.append('category', filters.category.trim());
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
    
    return safeResponse;
  } catch (error: any) {
    throw error;
  }
};

