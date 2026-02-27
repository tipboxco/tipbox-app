/** Gradient for collection card hero */
export interface CollectionBackgroundGradient {
  colors: string[];
  start: { x: number; y: number };
  end: { x: number; y: number };
}

/** Collection (list + detail) - backend ile uyumlu */
export interface Collection {
  id: string;
  title: string;
  description: string;
  currentProgress: number;
  totalProgress: number;
  backgroundGradient: CollectionBackgroundGradient;
  category?: string;
}

/** Badge durumu - backend'den status alanı ile eşleşmeli */
export type CollectionBadgeStatus = 'not_started' | 'in_progress' | 'completed';

/**
 * Collection içindeki tek bir badge/achievement.
 * Backend: iconUrl mutlaka public erişilebilir URL (download için).
 * Frontend: icon = iconUrl (string) veya local require() ile map edilir.
 */
export interface CollectionBadge {
  id: string;
  title: string;
  description: string;
  /** Backend'den: mutlaka public image URL (örn. CDN). Download için gerekli. */
  icon: string; // API'den iconUrl gelirse map: icon = response.iconUrl
  currentProgress: number;
  totalProgress: number;
  status: CollectionBadgeStatus;
}

// ─── EP-01: Collections List ───────────────────────────────────────
export interface CollectionsListParams {
  search?: string;
  /** Chip filter handle değeri (ör: 'electronics'). 'all' veya undefined = tümü. */
  category?: string;
  mainCategoryId?: string;
  subCategoryId?: string;
  productGroupId?: string;
  cursor?: string;
  limit?: number;
}

export interface CollectionsListResponse {
  collections: Collection[];
  pagination: {
    cursor: string | null;
    hasMore: boolean;
    limit: number;
    total: number;
  };
}

/** @deprecated EP-01 ile değiştirildi. CollectionsListResponse kullanın. */
export interface CollectionsResponse {
  collections: Collection[];
  total: number;
}

// ─── EP-02: Chip Filtre Kategorileri ─────────────────────────────
export interface CollectionCategory {
  id: string;
  name: string;
  /** EP-01'e "category" query param olarak gönderilir */
  handle: string;
}

export interface CollectionCategoriesResponse {
  categories: CollectionCategory[];
}

// ─── EP-03: Collection Detail ─────────────────────────────────────
/** GET /events/collections/:id response - collection detay + badge listesi */
export interface CollectionDetailResponse {
  collection: Collection;
  badges: CollectionBadge[];
}
