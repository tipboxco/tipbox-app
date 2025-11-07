export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
  subCategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
  image: string;
  productGroups: ProductGroup[];
}

export interface ProductGroup {
  id: string;
  name: string;
  subCategoryId: string;
  image: string;
  products: Product[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  productGroupId: string;
}

// Re-export BreadcrumbItem from global types for backward compatibility
export type { BreadcrumbItem } from '@/src/types/breadcrumb';

// Catalog-specific breadcrumb item type with strict type values
export interface CatalogBreadcrumbItem {
  id: string;
  name: string;
  type: 'category' | 'subCategory' | 'productGroup' | 'product';
}
