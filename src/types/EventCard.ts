// EventCard için tip tanımlamaları
// Hem API response hem de component için kullanılır

// Event Type Enum - API'den gelecek type değerleri
export enum EventType {
  DEFAULT = 'default',
  PRODUCT = 'product',
}

// API Response Participant Tipi
export interface EventParticipant {
  userId: string;
  avatar: string | null;
  userName: string;
}

// API Response Event Item Tipi
export interface EventApiItem {
  eventId: string;
  image?: string | null; // İleride gelecek, şimdilik optional
  title: string;
  description: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  interaction: number;
  participants: EventParticipant[];
  eventType: string; // 'default' veya 'product'
}

// API Response Pagination Tipi
export interface EventPagination {
  cursor?: string; // Pagination cursor
  hasMore: boolean;
  limit: number;
}

// API Response Tipi
export interface EventsApiResponse {
  items: EventApiItem[];
  pagination: EventPagination;
}

// Component için EventCard Data Tipi
export interface EventCardData {
  id: string;
  title: string;
  description: string;
  image: string | null;
  dateRange: string; // Formatlanmış tarih string'i
  interaction: number; // Etkileşim sayısı (sağdaki sayı için)
  avatars: (string | null)[]; // participants array'den avatar'lar (soldaki resimler için)
  eventType: string; // 'default' veya 'product' (gösterim için)
}

