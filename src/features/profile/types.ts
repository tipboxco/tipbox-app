import { ProductInfoType } from '@/src/types/common';
import type { ExperiencePostApiItem } from '@/src/types/ExperienceCard';
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
 * image: Katalogdaki ürüne ait görsel (productId'den); post görseli değil.
 */
export interface InventoryItem {
  id: string;
  productId: string; // ✅ Product tablosundaki gerçek product ID'si
  brand: InventoryBrand;
  image: string; // Ürün görseli (katalog product); post oluştururken yüklenen görseller değil
  reviews: InventoryReview[];
  tags: string[];
}

/**
 * Inventory API Response - Pagination ile birlikte
 * /inventory endpoint'inden dönen response
 */
export interface InventoryApiResponse {
  items: InventoryItem[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
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
 * Suggested User - API'den gelen önerilen kullanıcı tipi
 * /users/suggested endpoint response'u
 */
export interface SuggestedUser {
  id: string;
  name: string;
  title: string;
  avatar: string | null;
  /**
   * Önerilen kullanıcıyı trust eden diğer kullanıcıların avatar'ları
   * Overlapping avatars için kullanılır
   */
  mutualTrustAvatars?: Array<{
    id: string;
    avatar: string | null;
  }>;
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
  /** Badge türü: collection = koleksiyon badge'i (Figma 6477-32135 modal), event = event badge (Figma 6477-32298 modal) */
  type?: 'collection' | 'event';
  /** Kazanma tarihi (bottom sheet Details) - ISO veya formatlanmış */
  earnedAt?: string | null;
  /** Enderlik (rarity) - örn. Usual, Rare */
  rarity?: string | null;
  /** Sahip (owner) - kullanıcı id veya adı */
  owner?: string | null;
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
  isMuted?: boolean; // Kullanıcı sessize alınmış mı?
  isBlocked?: boolean; // Kullanıcı engellenmiş mi?
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
  // Interaction states
  isLiked?: boolean;
  isBookmarked?: boolean;
  isShared?: boolean;
  // Post source (e.g., "BOOSTED")
  source?: string;
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
export type ProfileReview = ExperiencePostApiItem;

/**
 * Profile Reviews API Response - Pagination ile birlikte
 * /users/{id}/reviews endpoint'inden dönen response
 */
export interface ProfileReviewsApiResponse {
  items: ProfileReview[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Profile Benchmarks - Kullanıcının benchmark postları
 * /users/{id}/benchmarks endpoint'inden dönen tip
 */
export type ProfileBenchmark = BenchmarkApiItem;

/**
 * Profile Benchmarks API Response - Pagination ile birlikte
 * /users/{id}/benchmarks endpoint'inden dönen response
 */
export interface ProfileBenchmarksApiResponse {
  items: ProfileBenchmark[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Profile Tips & Tricks - Kullanıcının tips & tricks postları
 * /users/{id}/tips endpoint'inden dönen tip
 */
export type ProfileTipsAndTricks = TipsApiItem;

/**
 * Profile Tips & Tricks API Response - Pagination ile birlikte
 * /users/{id}/tips endpoint'inden dönen response
 */
export interface ProfileTipsAndTricksApiResponse {
  items: ProfileTipsAndTricks[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Profile Replies / Questions - Kullanıcının replies/question postları
 * /users/{id}/replies endpoint'inden dönen tip
 */
export type ProfileReplies = QuestionApiItem;

/**
 * Profile Replies API Response - Pagination ile birlikte
 * /users/{id}/replies endpoint'inden dönen response
 */
export interface ProfileRepliesApiResponse {
  items: ProfileReplies[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

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
 * Profile Ladder Badges API Response - Pagination ile birlikte
 * /users/{id}/ladder/badges endpoint'inden dönen response
 */
export interface ProfileLadderBadgesApiResponse {
  items: ProfileLadderBadge[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
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
 * Collection Badge Task - /users/{id}/collections/bridges item tasks
 */
export interface CollectionBadgeTask {
  id: string;
  title: string;
  type: 'Comment' | 'Like' | 'Share';
}

/**
 * Collection Badge API Item - /users/{id}/collections/bridges endpoint'inden gelen badge bilgisi
 * Hem brand hem achievement tab'ında aynı item şeması kullanılır.
 */
export interface CollectionBadgeApiItem {
  id: string;
  title: string;
  image: string | null;
  rarity: 'Usual' | 'Rare' | 'Epic' | 'Legendary';
  isClaimed: boolean;
  nftAddress: string | null;
  totalEarned: number;
  earnedDate: string | null; // ISO8601
  tasks: CollectionBadgeTask[];
}

/** @deprecated Kullanım: CollectionBadgeApiItem - geriye uyumluluk için bırakıldı */
export type BridgeBadgeApiItem = CollectionBadgeApiItem;

/**
 * User Collection Bridges API Response - GET /users/:id/collections/bridges
 * Tab yapısı: brand (Bridge Badges), achievement (Achievement Badges). Sayfalama ortak.
 */
export interface UserCollectionBridgesApiResponse {
  brand: {
    items: CollectionBadgeApiItem[];
  };
  achievement: {
    items: CollectionBadgeApiItem[];
  };
  pagination: {
    cursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Suggested User - Önerilen kullanıcı tipi
 * /users/suggested endpoint'inden dönen kullanıcı bilgisi
 */
export interface SuggestedUser {
  id: string;
  userName: string;
  name: string;
  avatar: string | null;
  titles: string[];
  isTrusted: boolean;
  mutualTrustCount?: number;
  stats?: {
    posts: number;
    trust: number;
    truster: number;
  };
}

/**
 * Suggested Users API Response - Pagination ile birlikte
 * /users/suggested endpoint'inden dönen response
 */
export interface SuggestedUsersApiResponse {
  items: SuggestedUser[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}