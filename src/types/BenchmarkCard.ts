import type { ImageSourcePropType } from 'react-native';
import type { ProductInfoType } from './common';

/**
 * API'den dönen benchmark item tipi
 */
export interface BenchmarkApiUser {
  id: string;
  name: string;
  title: string;
  avatar: string;
}

export interface BenchmarkApiStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  upvotes?: number;
}

export interface BenchmarkApiProduct {
  id: string;
  name: string;
  subName: string;
  image: string;
  isOwned: boolean;
  choice: boolean;
}

export interface BenchmarkApiItem {
  id: string;
  type: 'benchmark';
  user: BenchmarkApiUser;
  stats: BenchmarkApiStats;
  createdAt: string;
  contextType: ProductInfoType;
  products: BenchmarkApiProduct[];
  content: string;
  // Interaction states
  isLiked?: boolean;
  isBookmarked?: boolean;
  isShared?: boolean;
}

/**
 * Benchmark kartı için UI'da kullanılan tipler
 * (BenchmarkPostCard bileşeni tarafından tüketilir)
 */

export interface BenchmarkUser {
  id: string;
  name: string;
  title: string;
  avatar: ImageSourcePropType;
}

export interface BenchmarkProduct {
  id: string;
  name: string;
  subName: string;
  image: ImageSourcePropType;
  isOwned: boolean;
  choice: boolean;
}

export interface BenchmarkStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

export interface BenchmarkCardData {
  id: string;
  user: BenchmarkUser;
  products: BenchmarkProduct[];
  content: string;
  stats: BenchmarkStats;
  createdAt: string;
}


