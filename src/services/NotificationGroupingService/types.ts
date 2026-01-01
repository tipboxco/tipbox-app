/**
 * Notification Grouping Service Types
 * Bildirim gruplama ve debouncing için type tanımları
 */

import { NotificationEvent, NotificationEventType } from '../NotificationEventService/types';

/**
 * Grouping Strategy
 */
export enum GroupingStrategy {
  NONE = 'NONE', // Gruplama yok
  TIME_BASED = 'TIME_BASED', // Zaman bazlı (örn: 1 dakika içinde gelenler)
  COUNT_BASED = 'COUNT_BASED', // Sayı bazlı (örn: 5'ten fazla)
  SMART = 'SMART', // Akıllı gruplama (zaman + sayı)
}

/**
 * Grouped Notification
 * Gruplanmış bildirim
 */
export interface GroupedNotification {
  type: NotificationEventType;
  userId: string;
  count: number;
  events: NotificationEvent[];
  firstEventTime: Date;
  lastEventTime: Date;
  groupedTitle: string;
  groupedBody: string;
  metadata: Record<string, any>;
}

/**
 * Grouping Configuration
 */
export interface GroupingConfig {
  strategy: GroupingStrategy;
  timeWindow: number; // milliseconds (örn: 60000 = 1 dakika)
  maxCount: number; // Maksimum sayı (örn: 10)
  enabled: boolean;
}

/**
 * Default Grouping Configs per Event Type
 */
export const DEFAULT_GROUPING_CONFIGS: Record<NotificationEventType, GroupingConfig> = {
  [NotificationEventType.POST_LIKED]: {
    strategy: GroupingStrategy.SMART,
    timeWindow: 60000, // 1 dakika
    maxCount: 5,
    enabled: true,
  },
  [NotificationEventType.POST_COMMENTED]: {
    strategy: GroupingStrategy.TIME_BASED,
    timeWindow: 30000, // 30 saniye
    maxCount: 3,
    enabled: true,
  },
  [NotificationEventType.COMMENT_LIKED]: {
    strategy: GroupingStrategy.SMART,
    timeWindow: 60000,
    maxCount: 5,
    enabled: true,
  },
  [NotificationEventType.NEW_MESSAGE]: {
    strategy: GroupingStrategy.NONE, // Mesajlar gruplanmaz
    timeWindow: 0,
    maxCount: 0,
    enabled: false,
  },
  [NotificationEventType.NEW_TRUSTER]: {
    strategy: GroupingStrategy.TIME_BASED,
    timeWindow: 120000, // 2 dakika
    maxCount: 10,
    enabled: true,
  },
  [NotificationEventType.NEW_BADGE]: {
    strategy: GroupingStrategy.NONE,
    timeWindow: 0,
    maxCount: 0,
    enabled: false,
  },
  [NotificationEventType.ACHIEVEMENT_UNLOCKED]: {
    strategy: GroupingStrategy.NONE,
    timeWindow: 0,
    maxCount: 0,
    enabled: false,
  },
  [NotificationEventType.REWARD_EARNED]: {
    strategy: GroupingStrategy.NONE,
    timeWindow: 0,
    maxCount: 0,
    enabled: false,
  },
  [NotificationEventType.POST_SHARED]: {
    strategy: GroupingStrategy.SMART,
    timeWindow: 60000,
    maxCount: 5,
    enabled: true,
  },
  [NotificationEventType.POST_FAVORITED]: {
    strategy: GroupingStrategy.SMART,
    timeWindow: 60000,
    maxCount: 5,
    enabled: true,
  },
  [NotificationEventType.COMMENT_REPLIED]: {
    strategy: GroupingStrategy.TIME_BASED,
    timeWindow: 30000,
    maxCount: 3,
    enabled: true,
  },
  [NotificationEventType.NEW_TRUSTED_BY]: {
    strategy: GroupingStrategy.TIME_BASED,
    timeWindow: 120000,
    maxCount: 10,
    enabled: true,
  },
  [NotificationEventType.DM_REQUEST_RECEIVED]: {
    strategy: GroupingStrategy.NONE,
    timeWindow: 0,
    maxCount: 0,
    enabled: false,
  },
  [NotificationEventType.DM_REQUEST_ACCEPTED]: {
    strategy: GroupingStrategy.NONE,
    timeWindow: 0,
    maxCount: 0,
    enabled: false,
  },
  [NotificationEventType.EXPERT_REQUEST_AVAILABLE]: {
    strategy: GroupingStrategy.NONE,
    timeWindow: 0,
    maxCount: 0,
    enabled: false,
  },
  [NotificationEventType.EXPERT_REQUEST_ANSWERED]: {
    strategy: GroupingStrategy.NONE,
    timeWindow: 0,
    maxCount: 0,
    enabled: false,
  },
  [NotificationEventType.SYSTEM_ANNOUNCEMENT]: {
    strategy: GroupingStrategy.NONE,
    timeWindow: 0,
    maxCount: 0,
    enabled: false,
  },
  [NotificationEventType.TIPS_RECEIVED]: {
    strategy: GroupingStrategy.NONE,
    timeWindow: 0,
    maxCount: 0,
    enabled: false,
  },
  [NotificationEventType.TIPS_SENT]: {
    strategy: GroupingStrategy.NONE,
    timeWindow: 0,
    maxCount: 0,
    enabled: false,
  },
};

