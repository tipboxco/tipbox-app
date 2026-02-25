/**
 * Gamification API Contract (Backend Beklentisi)
 *
 * Akış:
 * 1. Kullanıcı anket(ler)i tamamlar → puan kazanır (survey completion → points credited).
 * 2. Kullanıcının toplam puan bakiyesi vardır (marka bazlı veya global).
 * 3. Badge'ler farklı puan bedellerinde "mağazada" listelenir; kullanıcı puan harcayarak claim eder.
 *
 * Backend endpoint önerileri aşağıda JSDoc ile belirtilmiştir.
 */

/** Puan bakiyesi - kullanıcının harcanabilir puanı */
export interface UserPointsBalance {
  /** Toplam kullanıcı puanı (anket + diğer aksiyonlardan) */
  totalPoints: number;
  /** Opsiyonel: Marka bazlı puan kullanılıyorsa brandId */
  brandId?: string;
  /** Son güncelleme (cache için) */
  updatedAt?: string;
}

/**
 * Badge mağaza item'ı – puanla satın alınabilir badge.
 * GET /events/badges/shop veya GET /brands/:brandId/badges/shop
 */
export interface BadgeShopItem {
  id: string;
  title: string;
  description: string;
  /** Badge görseli – public URL (CDN) */
  imageUrl: string;
  /** Bu badge'i claim etmek için gerekli puan miktarı */
  pointPrice: number;
  /** Nadirlik (UI'da gösterim için) */
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  /** Stok sınırı (opsiyonel, null ise sınırsız) */
  stockLimit?: number | null;
  /** Kullanıcı bu badge'i daha önce claim etti mi */
  isClaimedByUser?: boolean;
}

/** Badge mağazası listesi response */
export interface BadgeShopResponse {
  items: BadgeShopItem[];
  pagination?: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Badge claim isteği – kullanıcı puan harcayarak badge alır.
 * POST /events/badges/:badgeId/claim veya POST /users/me/badges/claim
 */
export interface ClaimBadgeRequest {
  badgeId: string;
  /** Marka bazlı puan kullanılıyorsa (opsiyonel) */
  brandId?: string;
}

/**
 * Badge claim response – backend puanı düşer, badge kullanıcıya eklenir.
 */
export interface ClaimBadgeResponse {
  /** Claim edilen badge bilgisi */
  badge: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    claimedAt: string; // ISO8601
  };
  /** İşlem sonrası güncel puan bakiyesi */
  newBalance: number;
}

/** Anket tamamlandığında backend'in döndürmesi önerilen ek alan (mevcut Survey + completion response) */
export interface SurveyCompletionResult {
  /** Bu anket tamamlandığında kazanılan puan */
  awardedPoints: number;
  /** Anket tamamlandı mı (tüm sorular cevaplandı mı) */
  isCompleted: boolean;
  /** İşlem sonrası güncel toplam puan (marka bazlı ise marka puanı) */
  newTotalPoints?: number;
}
