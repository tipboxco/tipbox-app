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
   * ARCHITECTURE FIX: Deterministic Notification Route Resolution
   * 
   * Route resolution follows a strict priority order:
   * 1. Backend navigation data (highest priority)
   * 2. Metadata-based resolution (postId, threadId, userId, eventId)
   * 3. Type-based fallback mapping
   * 
   * This ensures consistent navigation behavior across all notification sources.
   * 
   * @param notification - Notification object
   * @returns Navigation action veya null
   */
  getNavigationAction(notification: Notification): {
    route: string;
    params?: any;
  } | null {
    const { type, metadata, navigation: navData } = notification;

    // Priority 1: Backend'den gelen navigation data varsa öncelik ver
    if (navData?.screen) {
      return {
        route: navData.screen,
        params: navData.params,
      };
    }

    // Priority 2: Metadata-based resolution (en güvenilir)
    // Post notification - GlobalStackGroup
    if (metadata?.postId) {
      return {
        route: ROOT_ROUTES.POST,
        params: {
          screen: 'PostDetailScreen',
          params: {
            postData: { id: metadata.postId },
            type: 'post',
            commentId: metadata.commentId,
          },
        },
      };
    }

    // Message notification - GlobalStackGroup
    if (metadata?.threadId || metadata?.messageId || metadata?.requestId) {
      const threadId = metadata.threadId || metadata.messageId || metadata.requestId;
      return {
        route: ROOT_ROUTES.MESSAGE_DETAIL,
        params: {
          messageId: threadId,
          threadId: threadId,
          recipientUserId: metadata.userId,
          senderName: metadata.userName || 'Kullanıcı',
          senderTitle: metadata.userTitle || '',
          senderAvatar: metadata.userAvatar,
        },
      };
    }

    // Collection notification - GlobalStackGroup (collectionId varsa CollectionDetail'e git)
    if (metadata?.collectionId) {
      return {
        route: ROOT_ROUTES.COLLECTION_DETAIL,
        params: {
          collectionId: metadata.collectionId,
        },
      };
    }

    // Profile notification - GlobalStackGroup
    if (metadata?.userId) {
      return {
        route: ROOT_ROUTES.PROFILE,
        params: {
          screen: 'ProfileMain',
          params: { userId: metadata.userId },
        },
      };
    }

    // Event notification - Tab route
    if (metadata?.eventId) {
      return {
        route: TAB_ROUTES.EVENTS,
        params: {
          screen: 'EventsScreen',
          params: { eventId: metadata.eventId },
        },
      };
    }

    // Priority 3: Type-based fallback mapping
    // Notification type'a göre otomatik mapping
    switch (type) {
      // Post ile ilgili bildirimler → Post (GlobalStackGroup)
      // Fallback: Metadata'da postId yoksa Feed'e yönlendir
      case 'POST_LIKED':
      case 'POST_COMMENTED':
      case 'POST_SHARED':
      case 'POST_FAVORITED':
      case 'COMMENT_LIKED':
      case 'COMMENT_REPLIED':
        // Metadata'da postId varsa PostDetail'e, yoksa Feed'e git
        if (metadata?.postId) {
          return {
            route: ROOT_ROUTES.POST,
            params: {
              screen: 'PostDetailScreen',
              params: {
                postData: { id: metadata.postId },
                type: 'post',
                commentId: metadata.commentId,
              },
            },
          };
        }
        // Fallback: Feed tab'ına git
        return {
          route: TAB_ROUTES.FEED,
          params: {
            screen: 'FeedScreen',
          },
        };

      // Mesaj bildirimleri → MessageDetail (GlobalStackGroup)
      // Fallback: Metadata'da threadId yoksa Inbox'a yönlendir
      case 'NEW_MESSAGE':
      case 'DM_REQUEST_RECEIVED':
      case 'DM_REQUEST_ACCEPTED':
        // Metadata'da threadId varsa MessageDetail'e, yoksa Inbox'a git
        const threadId = metadata?.threadId || metadata?.messageId || metadata?.requestId;
        if (threadId) {
          return {
            route: ROOT_ROUTES.MESSAGE_DETAIL,
            params: {
              messageId: threadId,
              threadId: threadId,
              recipientUserId: metadata?.userId,
              senderName: metadata?.userName || 'Kullanıcı',
              senderTitle: metadata?.userTitle || '',
              senderAvatar: metadata?.userAvatar,
            },
          };
        }
        // Fallback: Inbox tab'ına git
        return {
          route: TAB_ROUTES.INBOX,
          params: {
            screen: 'MessagesScreen',
          },
        };

      // Trust bildirimleri → Profile (GlobalStackGroup)
      // Fallback: Metadata'da userId yoksa Feed'e yönlendir
      case 'NEW_TRUSTER':
      case 'NEW_TRUSTED_BY':
        if (metadata?.userId) {
          return {
            route: ROOT_ROUTES.PROFILE,
            params: {
              screen: 'ProfileMain',
              params: {
                userId: metadata.userId,
              },
            },
          };
        }
        // Fallback: Feed tab'ına git
        return {
          route: TAB_ROUTES.FEED,
          params: {
            screen: 'FeedScreen',
          },
        };

      // Badge/Achievement bildirimleri → CollectionDetail (collectionId varsa)
      case 'NEW_BADGE':
      case 'ACHIEVEMENT_UNLOCKED': {
        const data = notification.data || notification.metadata || {};
        const collectionId = data.collectionId || metadata?.collectionId;
        if (collectionId) {
          return {
            route: ROOT_ROUTES.COLLECTION_DETAIL,
            params: {
              collectionId,
            },
          };
        }
        if (metadata?.userId) {
          return {
            route: ROOT_ROUTES.PROFILE,
            params: {
              screen: 'ProfileMain',
              params: {
                userId: metadata.userId,
              },
            },
          };
        }
        return {
          route: TAB_ROUTES.FEED,
          params: {
            screen: 'FeedScreen',
          },
        };
      }

      // Collection bildirimleri → CollectionDetail (collectionId varsa)
      case 'COLLECTION_POST_ADDED':
      case 'COLLECTION_SHARED': {
        const collectionData = notification.data || notification.metadata || {};
        const colId = collectionData.collectionId || metadata?.collectionId;
        if (colId) {
          return {
            route: ROOT_ROUTES.COLLECTION_DETAIL,
            params: {
              collectionId: colId,
            },
          };
        }
        return {
          route: TAB_ROUTES.EVENTS,
          params: {
            screen: 'EventsScreen',
          },
        };
      }

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

      // Event bildirimleri → Events (Tab)
      // Fallback: Metadata'da eventId yoksa Events tab'ına yönlendir
      case 'EVENT_STARTED':
      case 'EVENT_ENDING_SOON':
      case 'EVENT_REWARD_AVAILABLE':
        return {
          route: TAB_ROUTES.EVENTS,
          params: {
            screen: 'EventsScreen',
            params: metadata?.eventId ? { eventId: metadata.eventId } : undefined,
          },
        };

      // Default fallback: Notifications screen (Tab route)
      default:
        return {
          route: TAB_ROUTES.NOTIFICATION,
          params: {
            screen: 'NotificationsScreen',
          },
        };
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
    
    // Event ID yoksa veya undefined ise, unique bir ID oluştur
    if (!eventId) {
      console.warn('[NotificationService] ⚠️ Notification ID is missing, generating unique ID:', {
        type: notification.type,
        timestamp: notification.createdAt,
      });
      // Unique ID oluştur (timestamp + type + random)
      const generatedId = `notification-${Date.now()}-${notification.type}-${Math.random().toString(36).substr(2, 9)}`;
      // Notification objesine ID ekle (mutable ama gerekli)
      (notification as any).id = generatedId;
    }
    
    const finalEventId = notification.id;
    
    if (this.isEventProcessed(finalEventId)) {
      console.log('[NotificationService] ⏭️ Duplicate notification ignored:', finalEventId);
      return;
    }

    // Event'i processed olarak işaretle
    this.markEventAsProcessed(finalEventId);

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
    // Güvenli kontrol: ROOT_ROUTES ve TAB_ROUTES undefined olabilir
    if (!ROOT_ROUTES || !TAB_ROUTES) {
      console.error('[NotificationService] ❌ ROOT_ROUTES or TAB_ROUTES is undefined');
      return;
    }
    
    const rootRouteValues = Object.values(ROOT_ROUTES) as string[];
    if (Array.isArray(rootRouteValues) && rootRouteValues.includes(action.route)) {
      navigationService.navigate(action.route as any, action.params);
      console.log('[NotificationService] ✅ Navigated to global screen:', action.route);
    } else {
      const tabRouteValues = Object.values(TAB_ROUTES) as string[];
      if (Array.isArray(tabRouteValues) && tabRouteValues.includes(action.route)) {
        const screenName = action.params?.screen || 'FeedScreen';
        const screenParams = action.params?.params || {};
        navigationService.navigateNested(action.route as any, screenName as any, screenParams);
        console.log('[NotificationService] ✅ Navigated to tab screen:', action.route, screenName);
      } else {
        console.warn('[NotificationService] ⚠️ Route not found in ROOT_ROUTES or TAB_ROUTES:', action.route);
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
   * 
   * Guard: Eğer navigation başarısız olursa (user busy veya navigation not ready),
   * navigateToAction() içinde zaten tekrar setPendingNavigation() çağrılıyor.
   * Bu yüzden burada clearPendingNavigation() çağrılmadan önce navigateToAction() çağrılmalı.
   */
  consumePendingNavigation(): void {
    const store = useNotificationStore.getState();
    const pending = store.getPendingNavigation();

    if (!pending) {
      return;
    }

    // Önce pending navigation'ı clear et (race condition'ı önlemek için)
    // Eğer navigation başarısız olursa, navigateToAction() içinde tekrar set edilecek
    store.clearPendingNavigation();

    // Sonra navigate et
    // Eğer navigation başarısız olursa (user busy veya navigation not ready),
    // navigateToAction() içinde zaten tekrar setPendingNavigation() çağrılıyor
    this.navigateToAction(pending);
  }
}

export const notificationService = new NotificationService();

