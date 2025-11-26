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