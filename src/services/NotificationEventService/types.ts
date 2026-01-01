/**
 * Notification Event Service Types
 * Event-driven notification mimarisi için type tanımları
 */

/**
 * Notification Event Types
 * Domain event'leri temsil eder
 */
export enum NotificationEventType {
  // Post Events
  POST_LIKED = 'POST_LIKED',
  POST_COMMENTED = 'POST_COMMENTED',
  POST_SHARED = 'POST_SHARED',
  POST_FAVORITED = 'POST_FAVORITED',
  COMMENT_LIKED = 'COMMENT_LIKED',
  COMMENT_REPLIED = 'COMMENT_REPLIED',
  
  // Trust & Follow Events
  NEW_TRUSTER = 'NEW_TRUSTER',
  NEW_TRUSTED_BY = 'NEW_TRUSTED_BY',
  
  // Messaging Events
  NEW_MESSAGE = 'NEW_MESSAGE',
  DM_REQUEST_RECEIVED = 'DM_REQUEST_RECEIVED',
  DM_REQUEST_ACCEPTED = 'DM_REQUEST_ACCEPTED',
  
  // Gamification Events
  NEW_BADGE = 'NEW_BADGE',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  REWARD_EARNED = 'REWARD_EARNED',
  
  // Expert Events
  EXPERT_REQUEST_AVAILABLE = 'EXPERT_REQUEST_AVAILABLE',
  EXPERT_REQUEST_ANSWERED = 'EXPERT_REQUEST_ANSWERED',
  
  // System Events
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  TIPS_RECEIVED = 'TIPS_RECEIVED',
  TIPS_SENT = 'TIPS_SENT',
}

/**
 * Notification Priority Levels
 */
export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * Notification Channel
 */
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

/**
 * Base Notification Event
 */
export interface BaseNotificationEvent {
  type: NotificationEventType;
  userId: string; // Alıcı kullanıcı ID
  priority: NotificationPriority;
  channels: NotificationChannel[];
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Post Liked Event
 */
export interface PostLikedEvent extends BaseNotificationEvent {
  type: NotificationEventType.POST_LIKED;
  postId: string;
  postAuthorId: string;
  likerId: string;
  likerName: string;
  likerAvatar?: string;
}

/**
 * Post Commented Event
 */
export interface PostCommentedEvent extends BaseNotificationEvent {
  type: NotificationEventType.POST_COMMENTED;
  postId: string;
  postAuthorId: string;
  commentId: string;
  commenterId: string;
  commenterName: string;
  commenterAvatar?: string;
  commentPreview?: string;
}

/**
 * New Message Event
 */
export interface NewMessageEvent extends BaseNotificationEvent {
  type: NotificationEventType.NEW_MESSAGE;
  threadId: string;
  messageId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  messagePreview?: string;
}

/**
 * New Badge Event
 */
export interface NewBadgeEvent extends BaseNotificationEvent {
  type: NotificationEventType.NEW_BADGE;
  badgeId: string;
  badgeName: string;
  badgeIcon?: string;
}

/**
 * Notification Event Union Type
 */
export type NotificationEvent =
  | PostLikedEvent
  | PostCommentedEvent
  | NewMessageEvent
  | NewBadgeEvent
  | BaseNotificationEvent;

/**
 * Event Handler Function Type
 */
export type NotificationEventHandler = (event: NotificationEvent) => Promise<void> | void;

/**
 * Event Subscription
 */
export interface EventSubscription {
  eventType: NotificationEventType | 'ALL';
  handler: NotificationEventHandler;
  id: string;
}

