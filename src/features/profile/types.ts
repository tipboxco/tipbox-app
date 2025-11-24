export interface InventoryItem {
  id: string;
  brand: string;
  model: string;
  specs: string;
  image: any;
  isNew?: boolean;
  price?: string;
  rating?: {
    price: number;
    product: number;
  };
  reviews?: {
    price: {
      text: string;
      rating: number;
    };
    product: {
      text: string;
      rating: number;
    };
  };
  features?: {
    warranty: string;
    delivery: string;
    quality: string;
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
  avatar: string;
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