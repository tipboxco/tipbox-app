/**
 * Catalog Category - API'den gelen kategori bilgisi
 */
export interface CatalogCategory {
  categoryId: string;
  name: string;
  image: string | null; // Dokümana göre null olabilir
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
  image: string | null; // Dokümana göre null olabilir
  categoryId: string;
}

/**
 * Catalog ProductGroup - API'den gelen ürün grubu bilgisi
 */
export interface CatalogProductGroup {
  productGroupId: string;
  name: string;
  image: string | null; // Dokümana göre null olabilir
  subCategoryId: string;
}

/**
 * Catalog Product - API'den gelen ürün bilgisi
 */
export interface CatalogProduct {
  productId: string;
  name: string;
  image: string | null; // Dokümana göre null olabilir
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
 * Brand Catalog Response - /brands/{brandId}/catalog endpoint'inden dönen response
 * OpenAPI dokümantasyonuna göre: brandId, name, description, bannerImage, followers, isJoined
 * Not: Posts için ayrı endpoint kullanılır: /brands/{brandId}/feed
 */
export interface BrandCatalogResponse {
  brandId: string;
  name: string;
  description: string | null;
  bannerImage: string | null;
  followers: number;
  isJoined: boolean;
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
 * Backend'den items array'i olarak geliyor
 */
export interface BrandFeedResponse {
  items: BrandFeedPost[];
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
  posts: number; // Ürün için post sayısı
  news: number; // Ürün için haber sayısı
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
 * Brand Product Detail - /brands/{brandId}/products/{productId} endpoint'inden dönen product detay bilgisi
 */
export interface BrandProductDetail {
  productId: string;
  name: string;
  subName?: string;
  description?: string;
  image: string | null;
  brand?: {
    id: string;
    name: string;
    image: string | null;
  };
  specs?: string[];
  price?: number;
  currency?: string;
  stats?: BrandProductStats;
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

/**
 * Product Detail - /products/{productId} endpoint'inden gelen product detay bilgisi
 */
export interface ProductDetail {
  productId: string;
  name: string;
  subName?: string;
  description?: string;
  image: string | null;
  brand?: {
    id: string;
    name: string;
    image: string | null;
  };
  specs?: string[];
  price?: number;
  currency?: string;
}

/**
 * Product Posts Response - /products/{productId}/posts endpoint'inden dönen response
 */
export interface ProductPostsResponse {
  items: BrandFeedPost[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * News Item - /products/{productId}/news endpoint'inden gelen news bilgisi
 */
export interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  date: string;
  image: string | null;
  stats?: {
    likes: number;
    comments: number;
    share: number;
    bookmarks: number;
  };
}

/**
 * Product News Response - /products/{productId}/news endpoint'inden dönen response
 */
export interface ProductNewsResponse {
  items: NewsItem[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * News Detail - /news/{newsId} veya /brands/{brandId}/products/{productId}/news/{newsId} endpoint'inden gelen news detay bilgisi
 */
export interface NewsDetail {
  id: string;
  title: string;
  content: string; // Haberin tam içeriği
  source: string;
  date: string; // ISO 8601 formatında
  banner: string | null; // Banner image URL
  image?: string | null; // Backward compatibility için (banner yerine kullanılabilir)
  author?: string | null;
  tags?: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  favoritesCount: number;
  viewsCount: number;
  isLiked: boolean; // Kullanıcının beğenip beğenmediği
  isFavorited: boolean; // Kullanıcının favorilere ekleyip eklemediği
  isShared: boolean; // Kullanıcının paylaşıp paylaşmadığı
}

/**
 * News Comment - /news/{newsId}/comments endpoint'inden gelen yorum bilgisi
 */
export interface NewsComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  comment: string;
  likesCount: number;
  createdAt: string;
  replies?: NewsComment[];
  parentId?: string;
}

/**
 * News Comments Response - /news/{newsId}/comments endpoint'inden dönen response
 */
export interface NewsCommentsResponse {
  success: boolean;
  data: NewsComment[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * News Comment Create Request - /news/{newsId}/comment endpoint'ine gönderilen request
 */
export interface NewsCommentCreateRequest {
  comment: string;
  parentId?: string;
}

/**
 * News Comment Create Response - /news/{newsId}/comment endpoint'inden dönen response
 */
export interface NewsCommentCreateResponse {
  success: boolean;
  data: NewsComment;
}

/**
 * News Share Request - /news/{newsId}/share endpoint'ine gönderilen request
 */
export interface NewsShareRequest {
  shareType: 'INTERNAL_REPOST' | 'EXTERNAL_SHARE';
  platform?: string;
}

/**
 * News Share Response - /news/{newsId}/share endpoint'inden dönen response
 */
export interface NewsShareResponse {
  success: boolean;
  message: string;
}

/**
 * News API Response - Genel API response formatı
 */
export interface NewsApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Brand Product Group Products Response - /brands/groups/{productGroupId}/products endpoint'inden dönen response
 */
export interface BrandProductGroupProductsResponse {
  items: BrandProduct[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Brand History - /brands/{brandId}/history endpoint'inden gelen brand history bilgisi
 */
export interface BrandHistory {
  brandId: string;
  name: string;
  totalPoints: number;
  stats: {
    surveys: number;
    shares: number;
    events: number;
  };
  badges: Array<{
    id: string;
    title: string;
    image: string;
  }>;
  pointsHistory: Array<{
    id: string;
    title: string;
    points: number;
    date: string;
  }>;
}

/**
 * Brand Stats - /brands/{brandId}/stats endpoint'inden gelen brand stats bilgisi
 */
export interface BrandStats {
  surveys: number;
  shares: number;
  events: number;
  totalPoints: number;
}