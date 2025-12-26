/**
 * Catalog Category - API'den gelen kategori bilgisi
 */
export interface CatalogCategory {
  categoryId: string;
  name: string;
  image: string;
}

/**
 * Brand Category - /brands/categories endpoint'inden gelen kategori bilgisi
 */
export interface BrandCategory {
  categoryId: string;
  name: string;
  image: string | null;
}

/**
 * Brand List Item - /brands/categories/{category_id}/brands endpoint'inden gelen brand bilgisi
 */
export interface BrandListItem {
  brandId?: string; // API'den gelebilir veya gelmeyebilir
  id?: string; // Alternatif olarak id gelebilir
  categoryId: string;
  name: string;
  image: string | null;
}

/**
 * Catalog SubCategory - API'den gelen alt kategori bilgisi
 */
export interface CatalogSubCategory {
  subCategoryId: string;
  name: string;
  image: string;
  categoryId: string;
}

/**
 * Catalog ProductGroup - API'den gelen ürün grubu bilgisi
 */
export interface CatalogProductGroup {
  productGroupId: string;
  name: string;
  image: string;
  subCategoryId: string;
}

/**
 * Catalog Product - API'den gelen ürün bilgisi
 */
export interface CatalogProduct {
  productId: string;
  name: string;
  image: string;
  productGroupId: string;
  subCategoryId: string;
}

/**
 * Brand Catalog Post User - /brands/{brandId}/catalog response'undaki post user bilgisi
 */
export interface BrandCatalogPostUser {
  id: string;
  name: string;
  title: string;
  avatar: string;
}

/**
 * Brand Catalog Post Stats - /brands/{brandId}/catalog response'undaki post stats bilgisi
 */
export interface BrandCatalogPostStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

/**
 * Brand Catalog Post Context Data - /brands/{brandId}/catalog response'undaki post context data bilgisi
 */
export interface BrandCatalogPostContextData {
  id: string;
  name: string;
  subName: string;
  image: string;
}

/**
 * Brand Catalog Post Data - /brands/{brandId}/catalog response'undaki post data bilgisi
 */
export interface BrandCatalogPostData {
  id: string;
  type: string;
  user: BrandCatalogPostUser;
  stats: BrandCatalogPostStats;
  createdAt: string;
  contextType: string;
  contextData: BrandCatalogPostContextData;
  content: string;
  images: string[];
}

/**
 * Brand Catalog Post - /brands/{brandId}/catalog response'undaki post item
 */
export interface BrandCatalogPost {
  type: string;
  data: BrandCatalogPostData;
}

/**
 * Brand Catalog Response - /brands/{brandId}/catalog endpoint'inden dönen response
 */
export interface BrandCatalogResponse {
  brandId: string;
  name: string;
  description: string;
  bannerImage: string;
  followers: number;
  isJoined: boolean;
  posts: BrandCatalogPost[];
}

/**
 * Brand Update API Item - /brands/{brandId}/trends endpoint'inden gelen update type için
 * Update type'ında content array olarak gelebilir
 */
export interface BrandUpdateApiItem {
  id: string;
  type: 'update';
  user: BrandCatalogPostUser;
  stats: BrandCatalogPostStats;
  createdAt: string;
  contextType: string;
  contextData?: BrandCatalogPostContextData;
  product?: {
    id: string;
    name: string;
    subName: string;
    image: string;
  };
  content: string | Array<{
    title: string;
    content: string;
    rating?: number;
  }>;
  tags?: string[];
  images: string[];
}

/**
 * Brand Feed Post - /brands/{brandId}/trends ve /brands/{brandId}/feed response'undaki post item
 * Union type kullanarak her card type için doğru data type'ını sağlar
 * FeedApiItem ile aynı mantıkta çalışır
 */
export interface BrandFeedPost {
  type: string;
  data: 
    | (import('@/src/features/profile/types').ProfilePost & { type: 'post' })
    | (import('@/src/types/ReviewsCard').ReviewApiItem & { type: 'experience' })
    | (import('@/src/types/BenchmarkCard').BenchmarkApiItem & { type: 'benchmark' })
    | (import('@/src/types/TipsAndTricksCard').TipsApiItem & { type: 'tipsAndTricks' })
    | (import('@/src/types/QuestionCard').QuestionApiItem & { type: 'question' })
    | (BrandUpdateApiItem & { type: 'update' });
}

/**
 * Brand Feed Response - /brands/{brandId}/feed endpoint'inden dönen response
 */
export interface BrandFeedResponse {
  brandId: string;
  name: string;
  posts: BrandFeedPost[];
  pagination?: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Brand Product Stats - /brands/{brandId}/products response'undaki product stats bilgisi
 */
export interface BrandProductStats {
  reviews: number;
  likes: number;
  share: number; // API'de "share" (tekil) olarak geliyor
}

/**
 * Brand Product - /brands/{brandId}/products response'undaki product bilgisi
 */
export interface BrandProduct {
  productId: string;
  name: string;
  image: string;
  stats: BrandProductStats;
}

/**
 * Brand Product Group - /brands/{brandId}/products response'undaki product group bilgisi
 */
export interface BrandProductGroup {
  productGroupId: string;
  productGroupName: string; // Title olarak kullanılacak
  products: BrandProduct[];
}

/**
 * Brand Product Book Response - /brands/{brandId}/groups endpoint'inden dönen response
 * Pagination ile birlikte product group listesi
 */
export interface BrandProductBookResponse {
  items: BrandProductGroup[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Survey - /brands/{brandId}/surveys endpoint'inden gelen survey bilgisi
 * API'den gelen status değerleri: "start", "continue", "viewresults" (normalize edilerek "view_results" olarak dönüştürülür)
 */
export interface Survey {
  id: string;
  title: string;
  description: string;
  type: string;
  duration: string;
  points: number;
  status: 'start' | 'continue' | 'view_results'; // API'den "viewresults" geliyor, normalize edilerek "view_results" yapılıyor
  progress?: number;
}

/**
 * Brand Surveys Response - /brands/{brandId}/surveys endpoint'inden dönen response
 */
export interface BrandSurveysResponse {
  items: Survey[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Brand Trends Response - /brands/{brandId}/trends endpoint'inden dönen response
 * Feed formatında trend içerikleri (pagination ile)
 */
export interface BrandTrendsResponse {
  items: BrandFeedPost[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Event Status Enum - /brands/{brandId}/events endpoint'inden gelen event status değerleri
 */
export enum EventStatus {
  JOIN = 'join',
  JOINED = 'joined',
}

/**
 * Event - /brands/{brandId}/events endpoint'inden gelen event bilgisi
 */
export interface Event {
  id: string;
  title: string;
  description: string;
  type: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  status: EventStatus;
  image: string;
}

/**
 * Brand Events Response - /brands/{brandId}/events endpoint'inden dönen response
 */
export interface BrandEventsResponse {
  items: Event[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}