// Ortak kullanılan global tipler

export type Theme = 'light' | 'dark';
export type Language = 'tr' | 'en';

export enum ProductInfoType {
  PRODUCT = 'product',
  PRODUCT_GROUP = 'product_group',
  SUB_CATEGORY = 'sub_category',
}

// Uygulama genelinde kullanılan kart tipleri
export enum CardType {
  FEED = 'feed',
  BENCHMARK = 'benchmark',
  POST = 'post',
  QUESTION = 'question',
  TIPS_AND_TRICKS = 'tipsAndTricks',
  UPDATE = 'update',
  EXPERIENCE = 'experience',
}

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Event Type Enum - Component gösterimi için
export enum EventDisplayType {
  DEFAULT = 'default',
  PRODUCT = 'product',
}

// Event Status Enum - Event durumu için
export enum EventStatus {
  ACTIVE = 'active',
  UPCOMING = 'upcoming',
}