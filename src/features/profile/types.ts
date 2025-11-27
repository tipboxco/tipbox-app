import { ProductInfoType } from '@/src/types/common';
import type { ReviewApiItem } from '@/src/types/ReviesCard';

/**
 * Inventory Review - API'den gelen review bilgisi
 */
export interface InventoryReview {
  title: string;
  description: string;
  rating: number;
}

/**
 * Inventory Brand - API'den gelen brand bilgisi
 */
export interface InventoryBrand {
  name: string;
  model: string;
  specs: string;
}

/**
 * Inventory Item - API'den gelen envanter ürün bilgisi
 */
export interface InventoryItem {
  id: string;
  brand: InventoryBrand;
  image: string;
  reviews: InventoryReview[];
  tags: string[];
}

/**
 * Trust User - API'den gelen trust listesi kullanıcı tipi
 */
export interface TrustUser {
  id: string;
  userName: string;
  name: string;
  titles: string[];
  avatar: string | null;
  /**
   * İlgili kullanıcıyı, oturum açmış kullanıcının trust edip etmediğini belirtir
   * Trust listesi endpoint'inde opsiyonel, truster listesinde zorunlu olabilir.
   */
  isTrusted?: boolean;
}

/**
 * Truster User - API'den gelen truster listesi kullanıcı tipi
 * /users/{id}/trusters endpoint response'u
 */
export interface TrusterUser {
  id: string;
  userName: string;
  titles: string[];
  avatar: string | null;
  name: string;
  isTrusted: boolean;
}

/**
 * Badge - Kullanıcı rozet bilgisi
 */
export interface Badge {
  id: string;
  title: string;
  image: string;
}

/**
 * Profile Stats - Kullanıcı istatistikleri
 */
export interface ProfileStats {
  posts: number;
  trust: number;
  truster: number;
}

/**
 * User Profile - API'den gelen kullanıcı profil bilgileri
 */
export interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string;
  bannerUrl: string;
  biography: string;
  titles: string[];
  stats: ProfileStats;
  badges: Badge[];
  isTrusted: boolean | null;
}

/**
 * Profile Feed - Kullanıcının profil sayfasındaki post feed tipleri
 */

export interface ProfilePostUser {
  id: string;
  name: string;
  title: string;
  /**
   * Profil resmi URL'i
   */
  avatarUrl: string;
}

export interface ProfilePostStats {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
}

export interface ProfilePostContextData {
  id: string;
  name: string;
  subName: string;
  image: string;
  /**
   * Kullanıcı ürüne sahip mi?
   */
  isOwned: boolean;
}

export interface ProfilePost {
  id: string;
  type: 'post';
  user: ProfilePostUser;
  stats: ProfilePostStats;
  createdAt: string;
  /**
   * Ürüne / ürün grubuna / alt kategoriye göre context bilgisi
   */
  contextType: ProductInfoType;
  contextData: ProfilePostContextData;
  content: string;
  images: string[];
}

/**
 * Profile Reviews - Kullanıcının review postları
 * /users/{id}/reviews endpoint'inden dönen tip
 */
export type ProfileReview = ReviewApiItem;