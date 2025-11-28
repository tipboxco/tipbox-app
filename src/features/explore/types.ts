// Explore feature'a özel tipler

import type { BaseEntity, PaginationParams } from '@/src/types';

// Tip Types
export interface Tip extends BaseEntity {
  title: string;
  content: string;
  tags: string[];
  category: TipCategory;
  author: TipAuthor;
  stats: TipStats;
  media?: TipMedia[];
  isBookmarked: boolean;
  isLiked: boolean;
}

export interface TipAuthor {
  id: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
}

export interface TipStats {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  bookmarks: number;
}

export interface TipMedia {
  id: string;
  type: 'image' | 'video' | 'gif';
  url: string;
  thumbnail?: string;
  caption?: string;
}

// Category Types
export interface TipCategory extends BaseEntity {
  name: string;
  description: string;
  color: string;
  icon: string;
  tipsCount: number;
}

// Search & Filter Types
export interface SearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  author?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  sortBy?: 'newest' | 'oldest' | 'popular' | 'trending';
}

export interface SearchParams extends PaginationParams {
  filters: SearchFilters;
}

export interface SearchResults {
  tips: Tip[];
  categories: TipCategory[];
  authors: TipAuthor[];
  totalResults: number;
}

// Comment Types
export interface Comment extends BaseEntity {
  content: string;
  author: TipAuthor;
  tipId: string;
  parentId?: string; // For nested comments
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

// Marketplace Banner Types
export interface MarketplaceBanner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
}

// New Brands Types
export interface NewBrandApiItem {
  brandId: string;
  images: string;
  title: string;
  description: string;
}

export interface NewBrandsApiResponse {
  items: NewBrandApiItem[];
  pagination: {
    cursor: string;
    hasMore: boolean;
    limit: number;
  };
}

// New Products Types
export interface NewProductApiItem {
  productId: string;
  images: string | null;
  title: string;
  description?: string; // Optional, will be added in the future
}

export interface NewProductsApiResponse {
  items: NewProductApiItem[];
  pagination: {
    cursor?: string; // Optional, may not be present in response
    hasMore: boolean;
    limit: number;
  };
}
