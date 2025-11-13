// Ortak kullanılan global tipler

export type Theme = 'light' | 'dark';
export type Language = 'tr' | 'en';

export enum ProductInfoType {
  PRODUCT = 'PRODUCT',
  PRODUCT_GROUP = 'PRODUCT_GROUP',
  SUB_CATEGORY = 'SUB_CATEGORY',
}

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
