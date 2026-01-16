import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';
import { NotificationService } from './notification-service';
import { NotificationPayload } from '../../../types/notification';
import { useNotificationStore } from '../../../store/notificationStore';
import type { Notification } from '../../../features/notifications/api/types';

/**
 * NotificationManager
 * 
 * Business logic layer for notification handling:
 * - Notification routing and navigation
 * - State management integration
 * - Analytics tracking
 * - Notification grouping
 * - Deep linking
 */
export class NotificationManager {
  private service: NotificationService;
  private processedNotificationIds: Set<string> = new Set();
  private appState: AppStateStatus = 'active';

  constructor(service: NotificationService) {
    this.service = service;
    this.setupAppStateListener();
  }

  /**
   * App state listener - foreground/background tracking
   */
  private setupAppStateListener(): void {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      this.appState = nextAppState;
    });

    // Cleanup için subscription'ı sakla (gerekirse)
    // Bu class instance'ı cleanup edildiğinde subscription remove edilebilir
  }

  /**
   * Notification'ı handle et
   * Foreground, background ve killed state için farklı davranışlar
   */
  async handleNotification(
    notification: Notifications.Notification,
    context: {
      isForeground: boolean;
      shouldNavigate?: boolean;
      source?: 'push' | 'local' | 'socket';
    }
  ): Promise<void> {
    const notificationId = notification.request.identifier;
    const payload = notification.request.content as NotificationPayload;

    // Idempotency kontrolü - duplicate notification'ları önle
    if (this.processedNotificationIds.has(notificationId)) {
      return;
    }

    this.processedNotificationIds.add(notificationId);

    // Notification'ı store'a ekle
    const store = useNotificationStore.getState();
    const notificationData: Notification = this.mapToNotificationType(notification, payload);

    // State update
    store.addRealtimeNotification(notificationData);
    store.incrementUnreadCount();

    // Navigation kararı
    if (context.shouldNavigate !== false) {
      const navigationAction = this.getNavigationAction(notificationData);
      if (navigationAction) {
        if (context.isForeground) {
          // Foreground'da immediate navigation
          this.handleForegroundNavigation(navigationAction);
        } else {
          // Background'da pending navigation olarak sakla
          store.setPendingNavigation(navigationAction);
        }
      }
    }

    // Analytics tracking
    this.trackNotificationEvent('notification_received', notificationData);

    // Badge count'u güncelle
    await this.updateBadgeCount();
  }

  /**
   * Notification response'u handle et (kullanıcı notification'a tıkladı)
   */
  async handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): Promise<void> {
    const notification = response.notification;
    const actionIdentifier = response.actionIdentifier;
    const userText = response.userText;

    const payload = notification.request.content as NotificationPayload;
    const notificationData: Notification = this.mapToNotificationType(notification, payload);

    // Interactive notification action handling
    if (actionIdentifier && actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
      await this.handleNotificationAction(notificationData, actionIdentifier, userText);
      return;
    }

    // Default action - navigation
    const navigationAction = this.getNavigationAction(notificationData);
    if (navigationAction) {
      this.handleForegroundNavigation(navigationAction);
    }

    // Notification'ı read olarak işaretle
    const store = useNotificationStore.getState();
    store.decrementUnreadCount();

    // Analytics tracking
    this.trackNotificationEvent('notification_opened', notificationData);
  }

  /**
   * Notification action'ı handle et (interactive notification button)
   */
  private async handleNotificationAction(
    notification: Notification,
    actionIdentifier: string,
    userText?: string
  ): Promise<void> {
    // Action identifier'a göre işlem yap
    switch (actionIdentifier) {
      case 'REPLY':
        // Mesaj yanıtla
        if (userText && notification.data?.threadId) {
          // MessageService'e yönlendir
          // await messageService.sendMessage(notification.data.threadId, userText);
        }
        break;

      case 'ACCEPT':
        // DM request kabul et
        if (notification.data?.requestId) {
          // await acceptDMRequest(notification.data.requestId);
        }
        break;

      case 'DECLINE':
        // DM request reddet
        if (notification.data?.requestId) {
          // await declineDMRequest(notification.data.requestId);
        }
        break;

      default:
        break;
    }

    // Analytics tracking
    this.trackNotificationEvent('notification_action', notification, {
      actionIdentifier,
      userText,
    });
  }

  /**
   * Notification'dan navigation action'ı çıkar
   */
  private getNavigationAction(notification: Notification): {
    route: string;
    params?: any;
  } | null {
    // Navigation data notification'dan geliyorsa kullan
    if (notification.navigation) {
      return {
        route: notification.navigation.screen,
        params: notification.navigation.params,
      };
    }

    // Type'a göre default navigation
    switch (notification.type) {
      case 'POST_LIKED':
      case 'POST_COMMENTED':
      case 'POST_SHARED':
      case 'POST_FAVORITED':
      case 'COMMENT_LIKED':
      case 'COMMENT_REPLIED':
        if (notification.data?.postId) {
          return {
            route: 'Post',
            params: { postId: notification.data.postId },
          };
        }
        break;

      case 'NEW_MESSAGE':
      case 'DM_REQUEST_RECEIVED':
      case 'DM_REQUEST_ACCEPTED':
        if (notification.data?.threadId) {
          return {
            route: 'MessageDetail',
            params: {
              threadId: notification.data.threadId,
              messageId: notification.data.messageId,
            },
          };
        }
        break;

      case 'NEW_TRUSTER':
      case 'NEW_TRUSTED_BY':
        if (notification.data?.userId) {
          return {
            route: 'Profile',
            params: { userId: notification.data.userId },
          };
        }
        break;

      case 'EXPERT_REQUEST_AVAILABLE':
      case 'EXPERT_REQUEST_ANSWERED':
        if (notification.data?.requestId) {
          return {
            route: 'SupportMessageDetail',
            params: { requestId: notification.data.requestId },
          };
        }
        break;

      case 'EVENT_STARTED':
      case 'EVENT_ENDING_SOON':
      case 'EVENT_REWARD_AVAILABLE':
        if (notification.data?.eventId) {
          return {
            route: 'Event',
            params: { eventId: notification.data.eventId },
          };
        }
        break;

      default:
        break;
    }

    return null;
  }

  /**
   * Foreground navigation'ı handle et
   */
  private handleForegroundNavigation(action: { route: string; params?: any }): void {
    // Navigation ref ile navigate et
    // Bu kısım NavigationService veya navigation ref ile yapılacak
    // Şimdilik store'a pending navigation olarak kaydediyoruz
    const store = useNotificationStore.getState();
    store.setPendingNavigation(action);
  }

  /**
   * Notification'ı Notification type'a map et
   */
  private mapToNotificationType(
    notification: Notifications.Notification,
    payload: NotificationPayload
  ): Notification {
    return {
      id: notification.request.identifier || `notification-${Date.now()}`,
      type: (payload.data?.type as any) || 'SYSTEM_ANNOUNCEMENT',
      title: payload.title || '',
      message: payload.body || '',
      avatar: payload.data?.avatar || payload.data?.avatarUrl || null, // CRITICAL FIX: avatarUrl → avatar (backend format), backward compatibility için avatarUrl de kontrol ediliyor
      imageUrl: payload.data?.imageUrl || null,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: payload.data,
      metadata: payload.data,
      navigation: payload.data?.navigation,
    };
  }

  /**
   * Badge count'u güncelle
   */
  private async updateBadgeCount(): Promise<void> {
    try {
      const store = useNotificationStore.getState();
      const unreadCount = store.unreadCountCache ?? 0;
      await this.service.setBadgeCount(unreadCount);
    } catch (error) {
      console.error('[NotificationManager] Update badge count error:', error);
    }
  }

  /**
   * Analytics event tracking
   */
  private trackNotificationEvent(
    event: 'notification_received' | 'notification_opened' | 'notification_action',
    notification: Notification,
    metadata?: Record<string, any>
  ): void {
    // Analytics service'e event gönder
    // Bu kısım analytics service ile entegre edilecek
    console.log('[NotificationManager] Analytics event:', {
      event,
      notificationId: notification.id,
      notificationType: notification.type,
      timestamp: Date.now(),
      metadata,
    });
  }

  /**
   * Processed notification ID'lerini temizle (memory management)
   */
  clearProcessedNotifications(): void {
    // Son 1000 notification ID'sini tut, eski olanları temizle
    if (this.processedNotificationIds.size > 1000) {
      const idsArray = Array.from(this.processedNotificationIds);
      this.processedNotificationIds = new Set(idsArray.slice(-500));
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.processedNotificationIds.clear();
  }
}
