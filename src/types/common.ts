// Ortak kullanılan global tipler

export type Theme = 'light' | 'dark';
export type Language = 'tr' | 'en';

export enum ProductInfoType {
  PRODUCT = 'product',
  PRODUCT_GROUP = 'product_group',
  SUB_CATEGORY = 'sub_category',
}

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
