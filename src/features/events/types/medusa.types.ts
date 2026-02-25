// Medusa Category Types
export interface MedusaCategory {
  id: string;
  name: string;
  handle: string;
  parent_category_id: string | null;
  parent_category?: MedusaCategory;
  category_children?: MedusaCategory[];
  rank?: number;
  description?: string;
  is_active: boolean;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
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
