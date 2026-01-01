import { navigationService } from '../NavigationService';
import { useNotificationStore } from '@/src/store/notificationStore';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';
import type { Notification } from '@/src/features/notifications/api/types';

/**
 * NotificationService - Domain-Level Service
 * 
 * Notification domain logic'i yönetir:
 * - Notification type'a göre navigation kararı
 * - State update kararı
 * - UI context kontrolü
 * - Idempotency kontrolü (aynı bildirimin tekrar işlenmesini önler)
 * 
 * Bu servis:
 * - UI'dan bağımsızdır
 * - NavigationService'e konuşur
 * - Zustand store'a konuşur
 * - Screen/Component bilmez
 */
class NotificationService {
  /**
   * Idempotency kontrolü için cache
   * Aynı bildirimin tekrar işlenmesini önler (Network gecikmesi nedeniyle)
   */
  private lastProcessedEventIds: Set<string> = new Set();
  private readonly MAX_CACHE_SIZE = 100; // Son 100 bildirimi tut

  /**
   * Event ID'nin daha önce işlenip işlenmediğini kontrol et
   */
  private isEventProcessed(eventId: string): boolean {
    return this.lastProcessedEventIds.has(eventId);
  }

  /**
   * Event ID'yi processed olarak işaretle
   */
  private markEventAsProcessed(eventId: string): void {
    // Cache size kontrolü - FIFO mantığı
    if (this.lastProcessedEventIds.size >= this.MAX_CACHE_SIZE) {
      // İlk eklenen ID'yi kaldır (Set'te order garantisi yok, bu yüzden basit bir yaklaşım)
      const firstId = Array.from(this.lastProcessedEventIds)[0];
      this.lastProcessedEventIds.delete(firstId);
    }
    
    this.lastProcessedEventIds.add(eventId);
  }
  /**
   * Notification'dan navigation action oluştur
   * 
   * @param notification - Notification object
   * @returns Navigation action veya null
   */
  getNavigationAction(notification: Notification): {
    route: string;
    params?: any;
  } | null {
    const { type, metadata, navigation: navData } = notification;

    // Backend'den gelen navigation data varsa öncelik ver
    if (navData?.screen) {
      return {
        route: navData.screen,
        params: navData.params,
      };
    }

    // Notification type'a göre otomatik mapping
    switch (type) {
      // Post ile ilgili bildirimler → Post (GlobalStackGroup)
      case 'POST_LIKED':
      case 'POST_COMMENTED':
      case 'POST_SHARED':
      case 'POST_FAVORITED':
      case 'COMMENT_LIKED':
      case 'COMMENT_REPLIED':
        return {
          route: ROOT_ROUTES.POST,
          params: {
            screen: 'PostDetailScreen',
            params: {
              postData: metadata?.postId ? { id: metadata.postId } : undefined,
              type: 'post',
              commentId: metadata?.commentId,
            },
          },
        };

      // Mesaj bildirimleri → MessageDetail (GlobalStackGroup)
      case 'NEW_MESSAGE':
      case 'DM_REQUEST_RECEIVED':
      case 'DM_REQUEST_ACCEPTED':
        return {
          route: ROOT_ROUTES.MESSAGE_DETAIL,
          params: {
            messageId: metadata?.threadId || metadata?.requestId || metadata?.messageId || '',
            threadId: metadata?.threadId || metadata?.requestId || metadata?.messageId,
            recipientUserId: metadata?.userId,
            senderName: metadata?.userName || 'Kullanıcı',
            senderTitle: metadata?.userTitle || '',
            senderAvatar: metadata?.userAvatar,
          },
        };

      // Trust bildirimleri → Profile (GlobalStackGroup)
      case 'NEW_TRUSTER':
      case 'NEW_TRUSTED_BY':
      case 'NEW_BADGE':
      case 'ACHIEVEMENT_UNLOCKED':
        return {
          route: ROOT_ROUTES.PROFILE,
          params: {
            screen: 'ProfileMain',
            params: {
              userId: metadata?.userId,
            },
          },
        };

      // TIPS bildirimleri → Wallet (GlobalStackGroup)
      case 'TIPS_RECEIVED':
      case 'TIPS_SENT':
      case 'REWARD_EARNED':
        return {
          route: ROOT_ROUTES.WALLET,
          params: {
            screen: 'WalletScreen',
          },
        };

      // Expert Request bildirimleri → SupportMessageDetail (GlobalStackGroup)
      case 'EXPERT_REQUEST_AVAILABLE':
      case 'EXPERT_REQUEST_ANSWERED':
        return {
          route: ROOT_ROUTES.SUPPORT_MESSAGE_DETAIL,
          params: {
            requestId: metadata?.requestId,
            expertName: metadata?.expertName || metadata?.userName || 'Uzman',
            expertTitle: metadata?.expertTitle || metadata?.userTitle || '',
            expertAvatar: metadata?.expertAvatar || metadata?.userAvatar,
            recipientUserId: metadata?.userId,
          },
        };

      // System Announcement → Feed (Tab)
      case 'SYSTEM_ANNOUNCEMENT':
        return {
          route: TAB_ROUTES.FEED,
          params: {
            screen: 'FeedScreen',
          },
        };

      default:
        return null;
    }
  }

  /**
   * Notification'ı handle et (State + Navigation kararı)
   * 
   * @param notification - Notification object
   * @param context - UI context (foreground, active screen, vb.)
   */
  handleNotification(
    notification: Notification,
    context: {
      isForeground: boolean;
      shouldNavigate?: boolean;
    }
  ): void {
    // Idempotency kontrolü - Aynı bildirimin tekrar işlenmesini önle
    const eventId = notification.id;
    if (this.isEventProcessed(eventId)) {
      console.log('[NotificationService] ⏭️ Duplicate notification ignored:', eventId);
      return;
    }

    // Event'i processed olarak işaretle
    this.markEventAsProcessed(eventId);

    const store = useNotificationStore.getState();

    // 1. State update (her zaman)
    store.addRealtimeNotification(notification);
    store.incrementUnreadCount();

    // 2. Navigation kararı
    const navigationAction = this.getNavigationAction(notification);
    
    if (!navigationAction) {
      console.log('[NotificationService] ℹ️ No navigation action for notification:', notification.type);
      return;
    }

    // 3. Navigation karar matrisi
    if (context.isForeground) {
      // Foreground'da: Context uygun mu kontrol et
      if (context.shouldNavigate) {
        // Navigate et
        this.navigateToAction(navigationAction);
      } else {
        // Sadece state update (badge göster)
        this.setPendingNavigation(navigationAction);
      }
    } else {
      // Background'da: Sadece state update
      this.setPendingNavigation(navigationAction);
    }
  }

  /**
   * Navigation action'ı execute et
   * Navigation ready değilse pendingNavigation'a yaz
   * 
   * Not: App State Awareness kontrolü NavigationService içinde yapılıyor
   */
  private navigateToAction(action: { route: string; params?: any }): void {
    // Navigation ready kontrolü
    if (!navigationService.isReady()) {
      // Deferred navigation
      this.setPendingNavigation(action);
      console.log('[NotificationService] ⏳ Navigation not ready, deferred:', action.route);
      return;
    }

    // App State Awareness kontrolü NavigationService içinde yapılıyor
    // Burada sadece navigation execute ediyoruz

    // Navigation execute
    const rootRouteValues = Object.values(ROOT_ROUTES) as string[];
    if (rootRouteValues.includes(action.route)) {
      navigationService.navigate(action.route as any, action.params);
      console.log('[NotificationService] ✅ Navigated to global screen:', action.route);
    } else {
      const tabRouteValues = Object.values(TAB_ROUTES) as string[];
      if (tabRouteValues.includes(action.route)) {
        const screenName = action.params?.screen || 'FeedScreen';
        const screenParams = action.params?.params || {};
        navigationService.navigateNested(action.route as any, screenName as any, screenParams);
        console.log('[NotificationService] ✅ Navigated to tab screen:', action.route, screenName);
      }
    }
  }

  /**
   * Pending navigation'ı state'e yaz
   */
  private setPendingNavigation(action: { route: string; params?: any }): void {
    const store = useNotificationStore.getState();
    store.setPendingNavigation(action);
  }

  /**
   * Pending navigation'ı consume et (Navigation ready olduğunda çağrılır)
   */
  consumePendingNavigation(): void {
    const store = useNotificationStore.getState();
    const pending = store.getPendingNavigation();

    if (pending) {
      this.navigateToAction(pending);
      store.clearPendingNavigation();
    }
  }
}

export const notificationService = new NotificationService();

