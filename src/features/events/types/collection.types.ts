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

export interface CollectionsResponse {
  collections: Collection[];
  total: number;
}

/** GET /collections/:id response - collection detay + badge listesi */
export interface CollectionDetailResponse {
  collection: Collection;
  badges: CollectionBadge[];
}
