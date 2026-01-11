import { ProductInfoType } from './common';

/**
 * Update Card API Response Type
 * Feed API'den gelen update type item'lar için
 */
export interface UpdateApiItem {
  id: string;
  user: {
    id: string;
    name: string;
    title: string;
    avatar: string;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
    bookmarks: number;
  };
  createdAt: string;
  contextType: 'product' | 'product_group' | 'sub_category';
  relatedPost?: {
    id: string;
    product: {
      id: string;
      name: string;
      subName: string;
      image: string;
      isOwned: boolean;
    };
    content?: Array<{
      title: string;
      content: string;
      rating: number;
    }>;
    tags: string[];
    images: string[];
  };
  content: string;
  images: string[];
  // Interaction states
  isLiked?: boolean;
  isBookmarked?: boolean;
  isShared?: boolean;
}

/**
 * Update Card Data Type
 * UpdatePostCard component'inin beklediği format
 */
export interface UpdateCardData {
  id: string;
  user: {
    id: string;
    name: string;
    title: string;
    avatar: any;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
    bookmarks: number;
  };
  createdAt: string;
  contextType: ProductInfoType;
  product: {
    id: string;
    name: string;
    subName: string;
    image: any;
    isOwned: boolean;
  };
  content: string;
  images?: any[];
  relatedPost?: {
    id: string;
    product: {
      id: string;
      name: string;
      subName: string;
      image: any;
      isOwned: boolean;
    };
    content?: Array<{
      tag: {
        icon: string;
        title: string;
      };
      text: string;
      rating: number[];
    }>;
    tags: string[];
    images?: any[];
  };
}

