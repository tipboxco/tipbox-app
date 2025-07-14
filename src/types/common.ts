// Ortak kullanılan global tipler

export type Theme = 'light' | 'dark';
export type Language = 'tr' | 'en';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
