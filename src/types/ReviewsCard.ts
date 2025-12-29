import type { ImageSourcePropType } from 'react-native';

/**
 * API'den dönen review item tipi
 */
export interface ReviewApiUser {
  id: string;
  name: string;
  title: string;
  avatar: string;
}

export interface ReviewApiStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

export interface ReviewApiContextData {
  id: string;
  name: string;
  subName: string;
  image: string | null;
  isOwned?: boolean;
}

export interface ReviewApiContentBlock {
  title: string;
  content: string;
  rating: number;
}

export interface ReviewApiItem {
  id: string;
  type: string;
  user: ReviewApiUser;
  stats: ReviewApiStats;
  createdAt: string;
  contextData: ReviewApiContextData;
  contextType: string;
  content: ReviewApiContentBlock[];
  tags: string[];
  images: string[];
  // Interaction states
  isLiked?: boolean;
  isBookmarked?: boolean;
  isShared?: boolean;
}

/**
 * Review kartı için UI'da kullanılan tipler
 * (ExperiencePostCard bileşeni tarafından tüketilir)
 */

export interface ReviewCardUser {
  id: string;
  name: string;
  title: string;
  avatar: ImageSourcePropType;
  action?: string;
}

export interface ReviewCardProduct {
  id: string;
  name: string;
  subName: string;
  image: ImageSourcePropType | null | undefined;
  isOwned?: boolean;
}

export interface ReviewCardTag {
  icon: 'tag' | 'package';
  title: string;
}

export interface ReviewCardContentItem {
  tag: ReviewCardTag;
  text: string;
  /**
   * Rating'i yıldızlara çevrilmiş boolean array olarak tutar
   * Örn: 3 => [true, true, true, false, false]
   */
  rating: boolean[];
}

export interface ReviewCardStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

export interface ReviewCardData {
  id: string;
  user: ReviewCardUser;
  contextData: ReviewCardProduct;
  content: ReviewCardContentItem[];
  tags: string[];
  images?: ImageSourcePropType[];
  stats: ReviewCardStats;
  createdAt: string;
}


