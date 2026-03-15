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
  private invalidateTimeout: NodeJS.Timeout | null = null;

  /**
   * Initialize state sync
   */
  initialize(queryClient: QueryClient): void {
    this.queryClient = queryClient;
    
    // Periyodik sync (her 5 saniyede bir)
    this.syncInterval = setInterval(() => {
      this.syncRealtimeNotifications();
    }, 5000);

  }

  /**
   * Realtime notifications'ı React Query cache'e sync et
   */
  private syncRealtimeNotifications(): void {
    if (!this.queryClient) return;

    const store = useNotificationStore.getState();
    const realtimeNotifications = store.getRealtimeNotificationsArray();

    // CRITICAL FIX: Güvenli array kontrolü - undefined/null durumunda hata önleme
    if (!Array.isArray(realtimeNotifications) || realtimeNotifications.length === 0) {
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
    // CRITICAL FIX: Güvenli array kontrolü - undefined durumunda hata önleme
    const unreadCount = Array.isArray(mergedNotifications) 
      ? mergedNotifications.filter((n) => !n.read).length 
      : 0;
    this.queryClient.setQueryData(notificationKeys.unreadCount(), {
      success: true,
      data: { count: unreadCount },
    });
    
    // Store'daki count'u da güncelle (sync için)
    // Not: store zaten 39. satırda tanımlanmış, tekrar tanımlamaya gerek yok
    if (store.unreadCountCache === null || Math.abs(store.unreadCountCache - unreadCount) > 1) {
      // Store count null ise veya büyük fark varsa güncelle
      store.setUnreadCountCache(unreadCount);
    }

      return mergedNotifications;
  }

  /**
   * Notification'ı store'a ekle ve cache'i sync et
   * 
   * Optimistic update yapıyoruz - bildirim anında görünecek
   * API'den gelen gerçek data ile sync edilecek
   */
  addNotification(notification: Notification): void {
    const store = useNotificationStore.getState();
    
    // Store'a ekle
    store.addRealtimeNotification(notification);
    
    // Optimistic update: Cache'e direkt ekle (anında görünsün)
    if (this.queryClient) {
      // Tüm parametreli list query'lerini al ve güncelle
      const queryCache = this.queryClient.getQueryCache();
      const listQueries = queryCache.findAll({ queryKey: notificationKeys.lists() });
      
      listQueries.forEach((query) => {
        const cachedData = query.state.data as { success: boolean; data: Notification[] } | undefined;
        
        if (cachedData && Array.isArray(cachedData.data)) {
          // Duplicate kontrolü
          const existingIndex = cachedData.data.findIndex((n) => n.id === notification.id);
          
          if (existingIndex >= 0) {
            // Update existing
            const updatedData = [...cachedData.data];
            updatedData[existingIndex] = notification;
            this.queryClient.setQueryData(query.queryKey, {
              ...cachedData,
              data: updatedData,
            });
          } else {
            // Add new (prepend - en yeni başta)
            this.queryClient.setQueryData(query.queryKey, {
              ...cachedData,
              data: [notification, ...cachedData.data],
            });
          }
        } else {
          // Cache yoksa, yeni data oluştur
          this.queryClient.setQueryData(query.queryKey, {
            success: true,
            data: [notification],
          });
        }
      });
      
      // Unread count'u increment et (optimistic) - ÖNCE store'da
      // ÖNEMLİ: Sadece okunmamış bildirimler için count'u artır
      if (!notification.read) {
        store.incrementUnreadCount();
      }
      
      // Store'dan güncel count'u al (increment'ten sonra)
      const storeCount = store.unreadCountCache;
      
      // Unread count query'sini güncelle (optimistic)
      // ÖNEMLİ: Store'dan gelen count'u kullan (daha güvenilir - realtime update için)
      const unreadCountData = this.queryClient.getQueryData<any>(
        notificationKeys.unreadCount()
      );

      // Store count varsa onu kullan (realtime update için öncelikli)
      // Yoksa cache'den al ve +1 yap (sadece okunmamış bildirimler için)
      let newCount: number;
      if (storeCount !== null) {
        // Store count varsa onu kullan (realtime update - socket ile gelen bildirim için)
        newCount = storeCount;
      } else {
        // Store count yoksa cache'den al ve +1 yap (sadece okunmamış bildirimler için)
        // Interceptor unwrap edebilir: { count: N } veya { data: { count: N } }
        const currentCacheCount = unreadCountData?.data?.count ?? unreadCountData?.count ?? 0;
        newCount = notification.read ? currentCacheCount : currentCacheCount + 1;
      }

      // Cache'i güncelle - interceptor unwrap formatına uygun ({ count: N })
      this.queryClient.setQueryData(notificationKeys.unreadCount(), {
        count: newCount,
      });
      
      // Debug log (sadece development'ta)
      if (__DEV__) {
        console.log('[NotificationStateSync] 📊 Unread count updated:', {
          storeCount,
          cacheCount: unreadCountData?.data?.count ?? unreadCountData?.count,
          newCount,
          notificationId: notification.id,
        });
      }
      
      // Background'da API'den gerçek data'yı getir (sync için)
      // Debounce: Birden fazla notification geldiğinde tek bir invalidate yap
      // Bu flickering'i önler (optimistic update → API response → tekrar optimistic update döngüsü)
      if (this.invalidateTimeout) {
        clearTimeout(this.invalidateTimeout);
      }
      
      this.invalidateTimeout = setTimeout(() => {
        // Sadece bir kez invalidate et (debounce)
        this.queryClient?.invalidateQueries({ queryKey: notificationKeys.lists() });
        this.queryClient?.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
        this.invalidateTimeout = null;
      }, 500); // 500ms debounce - birden fazla notification geldiğinde tek bir API call
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
    
    if (this.invalidateTimeout) {
      clearTimeout(this.invalidateTimeout);
      this.invalidateTimeout = null;
    }
    
    this.queryClient = null;
  }
}

export const notificationStateSync = new NotificationStateSync();
