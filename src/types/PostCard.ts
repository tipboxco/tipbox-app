import type { ImageSourcePropType } from 'react-native';
import { ProductInfoType } from './common';

export type LegacyPostUser = {
  id: string;
  name: string;
  title: string;
  avatar: ImageSourcePropType;
};

export type LegacyPostProduct = {
  id: string;
  name: string;
  subName: string;
  image: ImageSourcePropType;
  hasDiscount?: boolean;
};

export type LegacyPostCategory = {
  id: string;
  name: string;
  subCategory: string;
  image: ImageSourcePropType;
  product?: LegacyPostProduct;
};

export type PostStats = {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
};

export type PostContextData = {
  id: string;
  name: string;
  subName: string;
  image: string | ImageSourcePropType;
  isOwned?: boolean;
};

export interface PostCardData {
  id: string;
  user: LegacyPostUser;
  content: string;
  images?: (string | ImageSourcePropType)[];
  stats: PostStats;
  tag?: string;
  createdAt: string;
  isPromoted?: boolean;
  // Eski mock yapısı için
  category?: LegacyPostCategory;
  // Yeni profil feed API yapısı için
  contextType?: ProductInfoType;
  contextData?: PostContextData;
  // Interaction states
  isLiked?: boolean;
  isBookmarked?: boolean;
  isShared?: boolean;
}

/**
 * Animated counter configuration for PostCard stats
 * Count artış/azalış animasyonu için yapılandırma
 */
export type AnimatedCounterConfig = {
  /**
   * Animasyon tipi: 'spring' | 'timing'
   * Default: 'spring'
   */
  animationType?: 'spring' | 'timing';
  /**
   * Spring animasyon ayarları (animationType === 'spring' için)
   */
  springConfig?: {
    damping?: number; // Default: 20
    stiffness?: number; // Default: 250
    mass?: number; // Default: 1
  };
  /**
   * Timing animasyon ayarları (animationType === 'timing' için)
   */
  timingConfig?: {
    duration?: number; // Default: 120ms
  };
  /**
   * Animasyon yönü: 'up' | 'down' | 'both'
   * Default: 'both' (artış ve azalış için)
   */
  direction?: 'up' | 'down' | 'both';
  /**
   * Scale animasyonu aktif mi?
   * Default: true
   */
  enableScale?: boolean;
  /**
   * Scale animasyon ayarları
   */
  scaleConfig?: {
    min?: number; // Default: 0.8
    max?: number; // Default: 1.2
    duration?: number; // Default: 150ms
  };
};

/**
 * PostCard animasyon state'leri
 * Count değişikliklerini takip etmek için
 */
export type PostCardAnimationState = {
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  bookmarksCount: number;
  /**
   * Animasyon aktif mi?
   */
  isAnimating: boolean;
  /**
   * Son animasyon zamanı (timestamp)
   */
  lastAnimationTime?: number;
};


