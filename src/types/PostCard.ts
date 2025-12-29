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


