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

