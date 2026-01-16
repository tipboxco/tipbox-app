import { NavigationContainerRef } from '@react-navigation/native';
import type { Notification } from '../../../features/notifications/api/types';

/**
 * Navigation Utilities
 * 
 * Notification tap handling ve deep linking için navigation helper'ları
 */

let navigationRef: NavigationContainerRef<any> | null = null;

/**
 * Navigation ref'i set et
 */
export function setNavigationRef(ref: NavigationContainerRef<any> | null): void {
  navigationRef = ref;
}

/**
 * Navigation ref'i al
 */
export function getNavigationRef(): NavigationContainerRef<any> | null {
  return navigationRef;
}

/**
 * Notification'dan navigation action'ı çıkar ve navigate et
 */
export function navigateFromNotification(notification: Notification): boolean {
  if (!navigationRef) {
    console.warn('[NavigationUtils] Navigation ref is not set');
    return false;
  }

  try {
    // Navigation data notification'dan geliyorsa kullan
    if (notification.navigation) {
      navigationRef.navigate(notification.navigation.screen as never, notification.navigation.params as never);
      return true;
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
          navigationRef.navigate('Post' as never, { postId: notification.data.postId } as never);
          return true;
        }
        break;

      case 'NEW_MESSAGE':
      case 'DM_REQUEST_RECEIVED':
      case 'DM_REQUEST_ACCEPTED':
        if (notification.data?.threadId) {
          navigationRef.navigate('MessageDetail' as never, {
            threadId: notification.data.threadId,
            messageId: notification.data.messageId,
          } as never);
          return true;
        }
        break;

      case 'NEW_TRUSTER':
      case 'NEW_TRUSTED_BY':
        if (notification.data?.userId) {
          navigationRef.navigate('Profile' as never, { userId: notification.data.userId } as never);
          return true;
        }
        break;

      case 'EXPERT_REQUEST_AVAILABLE':
      case 'EXPERT_REQUEST_ANSWERED':
        if (notification.data?.requestId) {
          navigationRef.navigate('SupportMessageDetail' as never, {
            requestId: notification.data.requestId,
          } as never);
          return true;
        }
        break;

      case 'EVENT_STARTED':
      case 'EVENT_ENDING_SOON':
      case 'EVENT_REWARD_AVAILABLE':
        if (notification.data?.eventId) {
          navigationRef.navigate('Event' as never, { eventId: notification.data.eventId } as never);
          return true;
        }
        break;

      default:
        break;
    }

    return false;
  } catch (error) {
    console.error('[NavigationUtils] Navigation error:', error);
    return false;
  }
}

/**
 * Pending navigation'ı handle et
 */
export function handlePendingNavigation(): boolean {
  if (!navigationRef) {
    return false;
  }

  try {
    const { useNotificationStore } = require('../../../store/notificationStore');
    const store = useNotificationStore.getState();
    const pendingNavigation = store.getPendingNavigation();

    if (pendingNavigation) {
      navigationRef.navigate(pendingNavigation.route as never, pendingNavigation.params as never);
      store.clearPendingNavigation();
      return true;
    }

    return false;
  } catch (error) {
    console.error('[NavigationUtils] Handle pending navigation error:', error);
    return false;
  }
}
