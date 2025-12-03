// Event Detail API Response Types

import type { EventStatus } from '@/src/types/common';

// Reward/Badge Tipi
export interface EventDetailReward {
  id: string;
  image: string; // URL string
  title: string;
}

// Product Tipi (sadece eventType === 'product' olan eventlerde)
export interface EventDetailProduct {
  id: string;
  name: string;
  // İleride daha fazla field eklenebilir
}

// Event Detail API Response Tipi
export interface EventDetailApiResponse {
  eventId: string;
  title: string;
  description: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  interaction: number; // Etkileşim sayısı
  eventType: string; // 'default' veya 'product'
  status: EventStatus; // 'active' veya 'upcoming'
  isJoined: boolean;
  bannerImage?: string | null; // Banner image (ileride gelecek, şimdilik optional)
  rewards: EventDetailReward[];
  participants?: Array<{
    userId: string;
    avatar: string | null;
    userName: string;
  }>; // Avatar'lar için (soldaki resimler)
  product?: EventDetailProduct; // Sadece eventType === 'product' olan eventlerde
}

// Limited Event Leaderboard User
export interface LimitedEventLeaderboardUser {
  id: string;
  avatar: string;
  rank: number;
}

// Limited Event User Score
export interface LimitedEventUserScore {
  id: string;
  avatar: string;
  rank: number;
  score: number;
}

// Limited Event API Response
export interface LimitedEventApiResponse {
  id: string;
  title: string;
  description: string;
  leaderboardUsers: LimitedEventLeaderboardUser[];
  userScore: LimitedEventUserScore;
  backgroundImage: string;
  eventImage: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
}

