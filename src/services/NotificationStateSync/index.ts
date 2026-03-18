import { QueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/src/store/notificationStore';
import {
  notificationKeys,
  prependNotificationToCache,
  updateNotificationInCache,
  removeNotificationFromCache,
  incrementUnreadCountInCache,
  decrementUnreadCountInCache,
} from '@/src/features/notifications/api/hooks';
import type { Notification } from '@/src/features/notifications/api/types';

/**
 * Notification State Sync Service
 *
 * Zustand store ile React Query cache'i arasinda sync:
 * - Yeni bildirimler cache'e prepend edilir (invalidation yok)
 * - Optimistic updates
 * - Cache consistency
 *
 * CACHE-FIRST: invalidateQueries KULLANILMAZ
 * Tum guncellemeler cache uzerinden yapilir (setQueryData)
 */
class NotificationStateSync {
  private queryClient: QueryClient | null = null;

  /**
   * Initialize state sync
   */
  initialize(queryClient: QueryClient): void {
    this.queryClient = queryClient;
  }

  /**
   * Notification'i store'a ekle ve cache'e prepend et
   *
   * CACHE-FIRST: invalidateQueries KULLANILMAZ
   * Bildirim aninda cache'e eklenir, backend'e istek atilmaz
   */
  addNotification(notification: Notification): void {
    const store = useNotificationStore.getState();

    // Store'a ekle
    store.addRealtimeNotification(notification);

    // Cache'e prepend et (InfiniteQuery pages structure)
    if (this.queryClient) {
      prependNotificationToCache(this.queryClient, notification);

      // Unread count'u increment et (optimistic)
      if (!notification.read) {
        store.incrementUnreadCount();
        incrementUnreadCountInCache(this.queryClient);
      }

      if (__DEV__) {
        console.log('[NotificationStateSync] Cache prepend:', {
          notificationId: notification.id,
          type: notification.type,
          storeCount: store.unreadCountCache,
        });
      }

      // CACHE-FIRST: invalidateQueries YOK
      // Bildirim zaten cache'e eklendi, backend'e tekrar istek atilmaz
    }
  }

  /**
   * Notification'i store'dan kaldir ve cache'den sil
   */
  removeNotification(notificationId: string): void {
    const store = useNotificationStore.getState();

    // Store'dan kaldir
    store.removeRealtimeNotification(notificationId);

    // Cache'den sil
    if (this.queryClient) {
      removeNotificationFromCache(this.queryClient, notificationId);
      // CACHE-FIRST: invalidateQueries YOK
    }
  }

  /**
   * Notification'i read olarak isaretle
   */
  markAsRead(notificationId: string): void {
    const store = useNotificationStore.getState();
    const notification = store.realtimeNotifications.get(notificationId);

    if (notification && !notification.read) {
      // Store'da guncelle
      const updatedNotification = {
        ...notification,
        read: true,
        readAt: new Date().toISOString(),
      };

      store.addRealtimeNotification(updatedNotification);
      store.decrementUnreadCount();
    }

    // Cache'de guncelle
    if (this.queryClient) {
      updateNotificationInCache(this.queryClient, notificationId, (n) => ({
        ...n,
        read: true,
        readAt: new Date().toISOString(),
      }));
      decrementUnreadCountInCache(this.queryClient);
      // CACHE-FIRST: invalidateQueries YOK
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.queryClient = null;
  }
}

export const notificationStateSync = new NotificationStateSync();
