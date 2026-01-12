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
  banner?: string | null; // API'den gelen banner field'ı (detail sayfası banner'ı)
  image?: string | null; // Event card image (EventsScreen'de görünen)
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

// Achievement Status
export type AchievementStatus = 'not-started' | 'in_progress' | 'completed';

// Achievement Item - /events/achievements endpoint'inden gelen achievement bilgisi
export interface AchievementApiItem {
  id: string;
  title: string;
  image: string;
  description: string;
  current: number;
  total: number;
  status: AchievementStatus;
}

// Achievements API Response - /events/achievements endpoint'inden dönen response
export interface AchievementsApiResponse {
  items: AchievementApiItem[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

// Event Badge Item - /events/:eventId/badges endpoint'inden gelen badge bilgisi
export interface EventBadgeApiItem {
  id: string;
  title: string;
  image: string;
}

// Event Badges API Response - /events/:eventId/badges endpoint'inden dönen response
export interface EventBadgesApiResponse {
  items: EventBadgeApiItem[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

