import { ProductInfoType } from '@/src/types/common';
import type { ReviewApiItem } from '@/src/types/ReviewsCard';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import type { AchievementApiItem } from '@/src/features/events/types';

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
 * API response:
 * {
 *   id: string;
 *   name: string;
 *   image?: string; // ileride eklenecek
 * }
 */
export interface Badge {
  id: string;
  title: string;
  image?: string;
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
  avatar: string;
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
  avatar: string;
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

export interface ProfilePostContentBlock {
  type: string;
  title: string;
  content: string;
  rating: number;
}

export interface ProfilePost {
  id: string;
  type: string;
  user: ProfilePostUser;
  stats: ProfilePostStats;
  createdAt: string;
  /**
   * Ürüne / ürün grubuna / alt kategoriye göre context bilgisi
   */
  contextType?: ProductInfoType;
  contextData?: ProfilePostContextData;
  content: string | ProfilePostContentBlock[];
  images?: string[];
}

/**
 * Profile Feed Item - Tüm post tiplerini içeren union type
 * /users/{id}/feed endpoint'inden dönen tip
 */
export type ProfileFeedItem = ProfilePost | ProfileReview | ProfileBenchmark | ProfileTipsAndTricks | ProfileReplies;

/**
 * Profile Reviews - Kullanıcının review postları
 * /users/{id}/reviews endpoint'inden dönen tip
 */
export type ProfileReview = ReviewApiItem;

/**
 * Profile Benchmarks - Kullanıcının benchmark postları
 * /users/{id}/benchmarks endpoint'inden dönen tip
 */
export type ProfileBenchmark = BenchmarkApiItem;

/**
 * Profile Tips & Tricks - Kullanıcının tips & tricks postları
 * /users/{id}/tips endpoint'inden dönen tip
 */
export type ProfileTipsAndTricks = TipsApiItem;

/**
 * Profile Replies / Questions - Kullanıcının replies/question postları
 * /users/{id}/replies endpoint'inden dönen tip
 */
export type ProfileReplies = QuestionApiItem;

/**
 * Profile Ladder Badge Task - Ladder badge task bilgisi
 */
export interface ProfileLadderBadgeTask {
  id: string;
  title: string;
  current: number;
  total: number;
  isCompleted: boolean;
}

/**
 * Profile Ladder Badge - Kullanıcının ladder badge bilgisi
 * /users/{id}/ladder/badges endpoint'inden dönen tip
 */
export interface ProfileLadderBadge {
  id: string;
  image: string | null;
  title: string;
  description: string;
  rarity: 'Usual' | 'Rare' | 'Epic' | 'Legendary';
  isClaimed: boolean;
  nftAddress: string | null;
  totalEarned: number;
  totalPercentage: number;
  current: number;
  total: number;
  tasks: ProfileLadderBadgeTask[];
}

/**
 * User Collection Achievements API Response - Pagination ile birlikte
 * /users/{id}/collections/achievements endpoint'inden dönen response
 */
export interface UserCollectionAchievementsApiResponse {
  items: AchievementApiItem[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Bridge Badge API Item - /users/{id}/collections/bridges endpoint'inden gelen bridge badge bilgisi
 */
export interface BridgeBadgeApiItem {
  id: string;
  title: string;
  rarity: 'Usual' | 'Rare' | 'Epic' | 'Legendary';
  image: string;
  isClaimed: boolean;
  nftAddress: string | null;
  earnedDate: string; // ISO string
  totalEarned: number;
  tasks: unknown[]; // Boş array olarak geliyor, ileride detaylandırılabilir
}

/**
 * User Collection Bridges API Response - Pagination ile birlikte
 * /users/{id}/collections/bridges endpoint'inden dönen response
 * Backend direkt array döndürüyor, pagination objesi oluşturulacak
 */
export interface UserCollectionBridgesApiResponse {
  items: BridgeBadgeApiItem[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}