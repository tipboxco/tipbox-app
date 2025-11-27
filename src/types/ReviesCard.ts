import type { ImageSourcePropType } from 'react-native';

/**
 * API'den dönen review item tipi
 */
export interface ReviewApiUser {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
}

export interface ReviewApiStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

export interface ReviewApiProduct {
  id: string;
  name: string;
  subName: string;
  image: string | null;
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
  product: ReviewApiProduct;
  content: ReviewApiContentBlock[];
  tags: string[];
  images: string[];
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
  image: ImageSourcePropType | null;
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
  product: ReviewCardProduct;
  content: ReviewCardContentItem[];
  tags: string[];
  images?: ImageSourcePropType[];
  stats: ReviewCardStats;
  createdAt: string;
}


