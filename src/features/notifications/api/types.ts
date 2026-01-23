/**
 * Notification API Types
 */

export interface Notification {
  id: string;
  userId?: string;
  type: NotificationType;
  username?: string; // Backend'den gelen username alanı
  avatar?: string | null; // CRITICAL FIX: avatarUrl → avatar (backend format)
  // CRITICAL FIX: imageUrl root seviyede olmamalı, sadece data içinde olmalı
  // imageUrl?: string | null; // KALDIRILDI - sadece data.imageUrl kullanılacak
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
  data?: NotificationData;
  metadata?: NotificationMetadata; // Backward compatibility
  navigation?: NotificationNavigation;
  // DEPRECATED: title ve message field'ları backend'den gelmiyor, kaldırıldı
  // Mesajlar getNotificationMessage fonksiyonu ile dinamik oluşturuluyor
  title?: string; // Backward compatibility - kullanılmıyor
  message?: string; // Backward compatibility - kullanılmıyor
  // CRITICAL FIX: primaryUser ve otherUsers sadece backend'den geliyorsa kullanılacak
  // Backend'den gelmiyorsa undefined (frontend'de gruplama yapılacaksa frontend'de oluşturulacak)
  isGrouped?: boolean; // Backend'de gruplandırılmış mı?
  count?: number; // Gruplandırılmış bildirimlerde toplam kullanıcı sayısı
  primaryUser?: {
    id?: string;
    username?: string;
    avatar?: string | null;
  }; // Gruplandırılmış bildirimlerde ana kullanıcı (backend'den geliyorsa)
  otherUsers?: Array<{
    id?: string;
    username?: string;
    avatar?: string | null;
  }>; // Gruplandırılmış bildirimlerde diğer kullanıcılar (backend'den geliyorsa)
}

export interface NotificationData {
  postId?: string;
  commentId?: string;
  threadId?: string;
  requestId?: string;
  userId?: string;
  userName?: string;
  likerId?: string;
  likerName?: string;
  commenterId?: string;
  commenterName?: string;
  senderId?: string;
  senderName?: string;
  expertName?: string;
  expertTitle?: string;
  expertAvatar?: string;
  eventId?: string;
  eventName?: string;
  badgeId?: string;
  collectionId?: string;
  postContent?: string; // Post içeriği
  postType?: string; // QUESTION, TIP, REVIEW, etc.
  categoryName?: string; // Kategori adı
  description?: string; // POST_COMMENTED için yorum metni
  message?: string; // DM_REQUEST_RECEIVED için mesaj önizlemesi
  messagePreview?: string;
  imageUrl?: string; // Post veya badge image URL
  shareType?: string; // POST_SHARED için share tipi
  amount?: number;
  rewardAmount?: number;
  // Support Request fields
  senderUserId?: string;
  recipientUserId?: string;
  requestType?: 'GENERAL' | 'TECHNICAL' | 'PRODUCT'; // Request type
  requestStatus?: 'pending' | 'accepted' | 'declined' | 'completed';
  timestamp?: string; // ISO 8601 formatında
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
  | 'DM_REQUEST_DECLINED'
  | 'SUPPORT_REQUEST_ACCEPTED'
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
  | 'EVENT_REWARD_AVAILABLE'
  | 'COLLECTION_POST_ADDED'
  | 'COLLECTION_SHARED';

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

/**
 * ✅ OPTIMIZE: Optimize Backend Response Format
 * Tarih grupları ve aktivite grupları ile organize edilmiş yapı (WhatsApp/Instagram benzeri)
 */

// Optimize bildirim yapısı (backend'den gelen)
export interface OptimizedNotification {
  id: string;
  type: NotificationType;
  createdAt: string; // ISO 8601
  read: boolean;
  readAt?: string; // ISO 8601 (opsiyonel)
  userId?: string; // Sadece userId gönderilir, user bilgileri participants'tan alınır
  content: {
    // Post-related
    postId?: string;
    postContent?: string;
    postType?: string;
    imageUrl?: string;
    // Comment-related
    commentId?: string;
    description?: string;
    // Message-related
    threadId?: string;
    username?: string;
    message?: string;
    messagePreview?: string;
    // Event-related
    eventId?: string;
    eventName?: string;
    // Tips-related
    amount?: number;
    reason?: string;
    recipientName?: string;
    recipientUserId?: string;
    transactionId?: string;
    // Support Request-related
    requestId?: string;
    requestType?: 'GENERAL' | 'TECHNICAL' | 'PRODUCT';
    requestStatus?: 'pending' | 'accepted' | 'rejected' | 'canceled' | 'awaiting_completion' | 'completed' | 'reported';
    // Other
    [key: string]: any;
  };
}

// Aktivite grubu (aynı post/comment'a yapılan beğeniler/yorumlar - gruplanmış)
export interface ActivityGroup {
  groupId: string;
  type: NotificationType;
  targetId: string; // postId, commentId, eventId, etc.
  createdAt: string; // ISO 8601 (en yeni bildirimin zamanı)
  read: boolean; // Tüm bildirimler okundu mu?
  // Gruplandırılmış kullanıcılar
  primaryUser: {
    id: string;
    username?: string;
    avatar?: string | null;
  };
  otherUsers: Array<{
    id: string;
    username?: string;
    avatar?: string | null;
  }>;
  count: number; // Toplam kullanıcı sayısı (primaryUser + otherUsers.length)
  // Gruplandırılmamış bildirimler (tek kullanıcılı)
  notifications: OptimizedNotification[];
}

// Tarih grubu
export interface NotificationDateGroup {
  date: {
    timestamp: string; // ISO 8601: "2024-01-15T00:00:00.000Z"
    displayText: string; // "Today", "Yesterday", "January 15, 2024"
    dayKey: string; // "2024-01-15"
  };
  activityGroups: ActivityGroup[];
  // Gruplandırılmamış bildirimler (tek kullanıcılı, gruplanamayan)
  ungroupedNotifications: OptimizedNotification[];
}

// Optimize response formatı
export interface OptimizedNotificationsResponse {
  participants: {
    [userId: string]: {
      id: string;
      username?: string;
      avatar?: string | null;
      title?: string;
    };
  };
  dateGroups: NotificationDateGroup[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
    totalCount?: number;
    limit: number;
    offset: number;
  };
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
  // ✅ YENİ: Optimize format (backend optimize format gönderirse)
  participants?: {
    [userId: string]: {
      id: string;
      username?: string;
      avatar?: string | null;
      title?: string;
    };
  };
  dateGroups?: NotificationDateGroup[]; // ✅ YENİ: Optimize format
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



