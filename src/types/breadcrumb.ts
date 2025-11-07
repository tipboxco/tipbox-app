/**
 * Generic breadcrumb item type
 * Can be extended for different use cases across features
 */
export interface BreadcrumbItem {
  id: string;
  name: string;
  type?: string; // Optional type field for categorization (e.g., 'category', 'subcategory', etc.)
  data?: any; // Optional data field for storing additional information
}

