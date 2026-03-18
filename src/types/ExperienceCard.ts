import type { ImageSourcePropType } from 'react-native';
import type { ProductInfoType } from './common';

/**
 * API'den dönen experience post item tipi
 */
export interface ExperiencePostApiUser {
  id: string;
  name: string;
  title: string;
  avatar: string;
}

export interface ExperiencePostApiStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  upvotes?: number;
}

export interface ExperiencePostApiContextData {
  id: string;
  name: string;
  subName: string;
  image: string | null;
  isOwned?: boolean;
}

export interface ExperiencePostApiContentBlock {
  title: string;
  content: string;
  rating: number;
}

/** API'den gelen experience post: split bloklar experienceContent, metin content (string) */
export interface ExperiencePostApiItem {
  id: string; // UUID (bookmark/favorite ID) veya ULID (post ID) olabilir
  postId?: string; // Gerçek post ID (ULID, 26 karakter) - bazı endpoint'ler döner
  contentPostId?: string; // Alternatif post ID field adı
  type: string;
  user: ExperiencePostApiUser;
  stats: ExperiencePostApiStats;
  createdAt: string;
  /** Ürün bilgisi - API bazen product bazen contextData döner */
  contextData?: ExperiencePostApiContextData;
  product?: ExperiencePostApiContextData & { subName?: string };
  contextType: string;
  /** Birleşik metin (API bazen sadece bunu döner) */
  content?: string | ExperiencePostApiContentBlock[];
  /** Split deneyim blokları: Price and Shopping / Product and Usage (API bu alanı kullanır) */
  experienceContent?: ExperiencePostApiContentBlock[];
  tags: string[];
  durationName?: string;
  locationName?: string;
  purposeName?: string;
  images: string[];
  status?: 'own' | 'tested';
  isLiked?: boolean;
  isBookmarked?: boolean;
  isShared?: boolean;
}

/**
 * Experience Post kartı için UI tipleri
 * (ExperiencePostCard bileşeni tarafından tüketilir)
 */
export interface ExperiencePostCardUser {
  id: string;
  name: string;
  title: string;
  avatar: ImageSourcePropType;
  action?: string;
}

export interface ExperiencePostCardProduct {
  id: string;
  name: string;
  subName: string;
  image: ImageSourcePropType | null | undefined;
  isOwned?: boolean;
}

export interface ExperiencePostCardTag {
  icon: 'tag' | 'package';
  title: string;
}

export interface ExperiencePostCardContentItem {
  tag: ExperiencePostCardTag;
  text: string;
  /**
   * Rating'i yıldızlara çevrilmiş boolean array
   * Örn: 3 => [true, true, true, false, false]
   */
  rating: boolean[];
}

export interface ExperiencePostCardStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

export interface ExperiencePostCardData {
  id: string;
  user: ExperiencePostCardUser;
  contextData: ExperiencePostCardProduct;
  contextType?: ProductInfoType;
  content: ExperiencePostCardContentItem[];
  tags: string[];
  images?: ImageSourcePropType[];
  stats: ExperiencePostCardStats;
  createdAt: string;
}
