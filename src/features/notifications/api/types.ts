/**
 * Notification API Types
 */

export interface Notification {
  id: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  avatar?: string | null; // CRITICAL FIX: avatarUrl → avatar (backend format)
  imageUrl?: string | null;
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  data?: NotificationData;
  metadata?: NotificationMetadata; // Backward compatibility
  navigation?: NotificationNavigation;
}

export interface NotificationData {
  postId?: string;
  commentId?: string;
  threadId?: string;
  userId?: string;
  userName?: string;
  likerId?: string;
  likerName?: string;
  commenterId?: string;
  commenterName?: string;
  senderId?: string;
  senderName?: string;
  eventId?: string;
  eventName?: string;
  messagePreview?: string;
  amount?: number;
  rewardAmount?: number;
  [key: string]: any;
}

export type NotificationType =
  | 'POST_LIKED'
  | 'POST_COMMENTED'
  | 'POST_SHARED'
  | 'POST_FAVORITED'
  | 'COMMENT_LIKED'
  | 'COMMENT_REPLIED'
  | 'NEW_TRUSTER'
  | 'NEW_TRUSTED_BY'
  | 'NEW_MESSAGE'
  | 'DM_REQUEST_RECEIVED'
  | 'DM_REQUEST_ACCEPTED'
  | 'NEW_BADGE'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'REWARD_EARNED'
  | 'EXPERT_REQUEST_AVAILABLE'
  | 'EXPERT_REQUEST_ANSWERED'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'TIPS_RECEIVED'
  | 'TIPS_SENT'
  | 'EVENT_STARTED'
  | 'EVENT_ENDING_SOON'
  | 'EVENT_REWARD_AVAILABLE';

export interface NotificationMetadata {
  userId?: string;
  userName?: string;
  userAvatar?: string;
  postId?: string;
  commentId?: string;
  threadId?: string;
  badgeId?: string;
  amount?: number;
  eventId?: string;
  eventName?: string;
  rewardAmount?: number;
  [key: string]: any;
}

export interface NotificationNavigation {
  screen: string;
  params?: Record<string, any>;
}

export type NotificationCategory = 
  | 'POST'
  | 'TRUST'
  | 'MESSAGE'
  | 'SUPPORT'
  | 'COLLECTION'
  | 'GAMIFICATION'
  | 'EXPERT'
  | 'EVENT'
  | 'SYSTEM';

/**
 * Backend API Notification Type Filter
 * Backend'den gelen type parametresi formatı
 */
export type NotificationFilterType = 'all' | 'tips' | 'truster' | 'replies';

export interface GetNotificationsParams {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  type?: NotificationFilterType; // CRITICAL FIX: Backend API formatına göre type parametresi (all, tips, truster, replies)
  category?: NotificationCategory;
  search?: string;
}

export interface GetNotificationsResponse {
  success: boolean;
  data: Notification[];
  total?: number;
  unreadCount?: number;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export interface MarkAsReadResponse {
  success: boolean;
  message: string;
}

export interface MarkAllAsReadResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
  };
}

export interface DeleteNotificationResponse {
  success: boolean;
  message: string;
}

export interface NotificationSettings {
  trustNotifications: boolean;
  supportNotifications: boolean;
  messageNotifications: boolean;
  collectionNotifications: boolean;
  postNotifications: boolean;
  notificationEmailEnabled: boolean;
  notificationPushEnabled: boolean;
  notificationInAppEnabled: boolean;
}

export interface UpdateNotificationSettingsRequest {
  trustNotifications?: boolean;
  supportNotifications?: boolean;
  messageNotifications?: boolean;
  collectionNotifications?: boolean;
  postNotifications?: boolean;
  notificationEmailEnabled?: boolean;
  notificationPushEnabled?: boolean;
  notificationInAppEnabled?: boolean;
}

export interface GetNotificationSettingsResponse {
  success: boolean;
  data: NotificationSettings;
}

export interface UpdateNotificationSettingsResponse {
  success: boolean;
  message: string;
}

export interface RegisterPushTokenRequest {
  token: string;
  deviceType: 'ios' | 'android';
}

export interface RegisterPushTokenResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    userId: string;
    token: string;
    deviceType: 'ios' | 'android';
    isActive: boolean;
  };
}

export interface DeletePushTokenResponse {
  success: boolean;
  message: string;
}



