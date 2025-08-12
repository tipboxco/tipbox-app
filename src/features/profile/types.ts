// Profile feature'a özel tipler

import type { User, BaseEntity } from '@/src/types';

// ProfileCard Types
export interface Badge {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface UserData {
  username: string;
  handle: string;
  badge: Badge;
  stats: UserStats;
}

export interface ProfileCardProps {
  userData: UserData;
  onPress?: () => void;
}

// Profile Types
export interface UserProfile extends User {
  bio?: string;
  avatar?: string;
  location?: string;
  website?: string;
  joinedAt: string;
  stats: UserStats;
  preferences: UserPreferences;
}

export interface UserStats {
  trust: number;
  truster: number;
  supporter: number;
}

export interface UserPreferences {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  appearance: AppearanceSettings;
}

// Settings Types
export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  tipLikes: boolean;
  tipComments: boolean;
  newFollowers: boolean;
  weeklyDigest: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showStats: boolean;
  showLocation: boolean;
  allowDirectMessages: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'tr' | 'en';
  fontSize: 'small' | 'medium' | 'large';
}

// Profile Actions
export interface UpdateProfileData {
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
}

// Profile Activity
export interface ProfileActivity extends BaseEntity {
  type: 'tip_created' | 'tip_liked' | 'comment_added' | 'user_followed';
  description: string;
  metadata?: Record<string, any>;
}
