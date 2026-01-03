import { QueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/src/store/notificationStore';
import { notificationKeys } from '@/src/features/notifications/api/hooks';
import type { Notification } from '@/src/features/notifications/api/types';

/**
 * Notification State Sync Service
 * 
 * Zustand store ile React Query cache'i arasında sync:
 * - Realtime notifications'ı React Query cache'e merge et
 * - Optimistic updates
 * - Cache invalidation
 * - State consistency
 */
class NotificationStateSync {
  private queryClient: QueryClient | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize state sync
   */
  initialize(queryClient: QueryClient): void {
    this.queryClient = queryClient;
    
    // Periyodik sync (her 5 saniyede bir)
    this.syncInterval = setInterval(() => {
      this.syncRealtimeNotifications();
    }, 5000);

    console.log('[NotificationStateSync] ✅ State sync initialized');
  }

  /**
   * Realtime notifications'ı React Query cache'e sync et
   */
  private syncRealtimeNotifications(): void {
    if (!this.queryClient) return;

    const store = useNotificationStore.getState();
    const realtimeNotifications = store.getRealtimeNotificationsArray();

    if (realtimeNotifications.length === 0) {
      return;
    }

    // React Query cache'den mevcut notifications'ı al
    const cachedData = this.queryClient.getQueryData<{
      success: boolean;
      data: Notification[];
    }>(notificationKeys.lists());

    let mergedNotifications: Notification[] = [];

    if (cachedData) {
      // Realtime notifications'ı cache'e merge et
      // Güvenli array kontrolü: cachedData.data undefined olabilir
      mergedNotifications = Array.isArray(cachedData.data) 
        ? [...cachedData.data]
        : [];
      
      // Güvenli forEach: realtimeNotifications her zaman array döndürür ama yine de kontrol edelim
      if (Array.isArray(realtimeNotifications)) {
        realtimeNotifications.forEach((realtime) => {
          const existingIndex = mergedNotifications.findIndex(
            (n) => n.id === realtime.id
          );

          if (existingIndex >= 0) {
            // Update existing
            mergedNotifications[existingIndex] = realtime;
          } else {
            // Add new (prepend - en yeni başta)
            mergedNotifications.unshift(realtime);
          }
        });
      }

      // Cache'i güncelle
      this.queryClient.setQueryData(notificationKeys.lists(), {
        ...cachedData,
        data: mergedNotifications,
      });
    } else {
      // Cache yoksa, realtime notifications'ı direkt set et
      mergedNotifications = realtimeNotifications;
      this.queryClient.setQueryData(notificationKeys.lists(), {
        success: true,
        data: realtimeNotifications,
      });
    }

    // Unread count'u güncelle
    const unreadCount = mergedNotifications.filter((n) => !n.read).length;
    this.queryClient.setQueryData(notificationKeys.unreadCount(), {
      success: true,
      data: { count: unreadCount },
    });

      return mergedNotifications;
  }

  /**
   * Notification'ı store'a ekle ve cache'i sync et
   * 
   * ÖNEMLİ: Optimistic update yapmıyoruz, sadece cache'i invalidate ediyoruz.
   * Bu sayede API'den gelen gerçek count kullanılır ve yanlış sayı gösterilmez.
   */
  addNotification(notification: Notification): void {
    const store = useNotificationStore.getState();
    
    // Store'a ekle
    store.addRealtimeNotification(notification);
    
    // Optimistic update YAPMA - API'den gelen gerçek count kullanılacak
    // Bu sayede yanlış sayı gösterilmez (14 yerine 1 gibi)
    
    // Cache'i invalidate et (React Query otomatik refetch yapacak ve gerçek count'u getirecek)
    if (this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      this.queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    }
  }

  /**
   * Notification'ı store'dan kaldır ve cache'i sync et
   */
  removeNotification(notificationId: string): void {
    const store = useNotificationStore.getState();
    
    // Store'dan kaldır
    store.removeRealtimeNotification(notificationId);
    
    // Cache'i invalidate et
    if (this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      this.queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    }
  }

  /**
   * Notification'ı read olarak işaretle
   */
  markAsRead(notificationId: string): void {
    const store = useNotificationStore.getState();
    const notification = store.realtimeNotifications.get(notificationId);

    if (notification && !notification.read) {
      // Store'da güncelle
      const updatedNotification = {
        ...notification,
        read: true,
        readAt: new Date().toISOString(),
      };
      
      store.addRealtimeNotification(updatedNotification);
      
      // Unread count'u decrement et (optimistic)
      store.decrementUnreadCount();
    }

    // Cache'i invalidate et
    if (this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      this.queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    this.queryClient = null;
    console.log('[NotificationStateSync] 🧹 State sync cleaned up');
  }
}

export const notificationStateSync = new NotificationStateSync();
