import type { ImageSourcePropType } from 'react-native';
import type { ProductInfoType } from './common';

/**
 * API'den dönen tips & tricks item tipi
 */
export interface TipsApiUser {
  id: string;
  name: string;
  title: string;
  avatar: string;
}

export interface TipsApiStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

export interface TipsApiContextData {
  id: string;
  name: string;
  subName: string;
  image: string;
  isOwned: boolean;
}

export interface TipsApiItem {
  id: string;
  type: 'tipsAndTricks';
  user: TipsApiUser;
  stats: TipsApiStats;
  createdAt: string;
  contextType: ProductInfoType;
  contextData: TipsApiContextData;
  content: string;
  tag: string;
  images: string[];
  // Interaction states
  isLiked?: boolean;
  isBookmarked?: boolean;
  isShared?: boolean;
}

/**
 * Tips & Tricks kartı için UI'da kullanılan tipler
 * (TipsAndTricksPostCard bileşeni tarafından tüketilir)
 */

export interface TipsUser {
  id: string;
  name: string;
  title: string;
  avatar: ImageSourcePropType;
}

export interface TipsProduct {
  id: string;
  name: string;
  subName: string;
  image: ImageSourcePropType;
}

export interface TipsStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

export interface TipsCategory {
  id: string;
  name: string;
  subCategory: string;
  image: ImageSourcePropType;
  product?: TipsProduct;
}

export interface TipsCardData {
  id: string;
  user: TipsUser;
  category: TipsCategory;
  content: string;
  images?: ImageSourcePropType[];
  stats: TipsStats;
  tag: string;
  createdAt: string;
}


