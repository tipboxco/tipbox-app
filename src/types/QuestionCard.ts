import type { ImageSourcePropType } from 'react-native';
import type { ProductInfoType } from './common';

/**
 * API'den dönen replies/question item tipi
 * /users/{id}/replies endpoint response'u
 */
export interface QuestionApiUser {
  id: string;
  name: string;
  title: string;
  avatar: string;
}

export interface QuestionApiStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

export interface QuestionApiContextData {
  id: string;
  name: string;
  subName: string;
  image: string;
  isOwned: boolean;
}

export interface QuestionApiItem {
  id: string;
  /**
   * Kart tipi - backend bir sonraki güncellemede `question` olarak gönderecek.
   * UI tarafında CardType.QUESTION ile kontrol edileceği için burada string bırakıyoruz.
   */
  type: string;
  user: QuestionApiUser;
  stats: QuestionApiStats;
  createdAt: string;
  contextType: ProductInfoType;
  contextData: QuestionApiContextData;
  content: string;
  isBoosted: boolean;
  boostPrice?: number; // Dinamik boost fiyatı (backend'den gelir)
  images: string[];
  // Interaction states
  isLiked?: boolean;
  isBookmarked?: boolean;
  isShared?: boolean;
}

/**
 * Question kartı için UI'da kullanılan tipler
 * (QuestionPostCard bileşeni tarafından tüketilir)
 */

export interface QuestionCardUser {
  id: string;
  name: string;
  title: string;
  avatar: ImageSourcePropType;
}

export interface QuestionCardProduct {
  id: string;
  name: string;
  subName: string;
  image: ImageSourcePropType;
}

export interface QuestionCardStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

export interface QuestionCardCategory {
  id: string;
  name: string;
  subCategory: string;
  image: ImageSourcePropType;
  product?: QuestionCardProduct;
}

export interface QuestionCardData {
  id: string;
  user: QuestionCardUser;
  category?: QuestionCardCategory; // Optional: contextData yoksa undefined olabilir
  content: string;
  isBoosted?: boolean;
  boostPrice?: number; // Dinamik boost fiyatı (backend'den gelir)
  images?: ImageSourcePropType[];
  stats: QuestionCardStats;
  createdAt: string;
}



