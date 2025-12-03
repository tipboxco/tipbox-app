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
 * Brand Feed Post - /brands/{brandId}/feed response'undaki post item (BrandCatalogPost ile aynı yapı)
 */
export interface BrandFeedPost {
  type: string;
  data: BrandCatalogPostData;
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