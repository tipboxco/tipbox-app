// Event Detail API Response Types

import type { EventStatus } from '@/src/types/common';
import type { EventSurveyItem } from './types/survey.types';

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
  image?: string | null;
  description?: string | null;
  shortDescription?: string | null;
}

// Event Detail API Response Tipi
export interface EventDetailApiResponse {
  eventId: string;
  title: string;
  description: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  interaction: number; // Etkileşim sayısı
  eventType: string; // backend string (örn: 'default', 'product', 'Roasts', ...)
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
  product?: EventDetailProduct; // eventType'a göre opsiyonel
  /** Event'e bağlı anketler (GET /events/{eventId} response'unda) */
  surveys?: EventSurveyItem[];
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

// Event Badge Detail Response - /events/:eventId/badges/:badgeId endpoint'inden gelen detay ve progress
export interface EventBadgeDetailResponse {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  userProgress: {
    current: number;
    target: number;
    progressPercentage: number;
    isCompleted: boolean;
    completedAt?: string | null;
  };
}

