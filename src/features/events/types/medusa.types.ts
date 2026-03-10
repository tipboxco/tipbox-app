// Tipbox API Category Response (gerçek API formatı)
export interface TipboxCategory {
  categoryId: string;
  name: string;
  image?: string;
}

// Tipbox API Sub-Category Item
export interface TipboxSubCategory {
  subCategoryId: string;
  name: string;
  image?: string;
  categoryId: string; // parent category ID
}

// Tipbox API Sub-Categories Response
export interface TipboxSubCategoriesResponse {
  items: TipboxSubCategory[];
}

// Medusa Category Types (legacy - backward compatibility için)
export interface MedusaCategory {
  id: string;
  name: string;
  handle?: string;
  parent_category_id?: string | null;
  parent_category?: MedusaCategory;
  category_children?: MedusaCategory[];
  rank?: number;
  description?: string;
  is_active?: boolean;
  is_internal?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MedusaCategoriesResponse {
  product_categories: MedusaCategory[];
  count: number;
  offset: number;
  limit: number;
}

export interface CollectionFilters {
  mainCategoryId?: string;
  subCategoryId?: string;
  productGroupId?: string; // Coming soon
}
