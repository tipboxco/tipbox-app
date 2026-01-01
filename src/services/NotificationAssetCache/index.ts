import { Image } from 'expo-image';
import type { Notification } from '@/src/features/notifications/api/types';

/**
 * Notification Asset Cache Service
 * 
 * Rich notification images için pre-caching:
 * - User avatars
 * - Post images
 * - Notification thumbnails
 * 
 * expo-image kullanarak efficient caching
 */
class NotificationAssetCache {
  private cacheQueue: string[] = [];
  private isProcessing: boolean = false;
  private maxCacheSize: number = 50; // Maksimum cache edilecek image sayısı

  /**
   * Notification'dan image URL'lerini çıkar ve cache'le
   */
  async cacheNotificationAssets(notification: Notification): Promise<void> {
    const urls: string[] = [];

    // User avatar
    if (notification.metadata?.userAvatar) {
      urls.push(notification.metadata.userAvatar);
    }

    // Post image
    if (notification.metadata?.postImage) {
      urls.push(notification.metadata.postImage);
    }

    // Notification thumbnail
    if (notification.metadata?.thumbnail) {
      urls.push(notification.metadata.thumbnail);
    }

    // Queue'ya ekle
    this.cacheQueue.push(...urls);

    // Process queue
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Queue'yu işle
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.cacheQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.cacheQueue.length > 0 && this.cacheQueue.length <= this.maxCacheSize) {
      const url = this.cacheQueue.shift();
      if (!url) break;

      try {
        // expo-image ile preload
        await Image.prefetch(url, {
          cachePolicy: 'memory-disk', // Memory ve disk cache
        });
        console.log('[NotificationAssetCache] ✅ Cached:', url);
      } catch (error) {
        console.error('[NotificationAssetCache] ❌ Error caching:', url, error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Batch cache (birden fazla notification için)
   */
  async cacheBatchNotifications(notifications: Notification[]): Promise<void> {
    const urls = new Set<string>();

    notifications.forEach((notification) => {
      if (notification.metadata?.userAvatar) {
        urls.add(notification.metadata.userAvatar);
      }
      if (notification.metadata?.postImage) {
        urls.add(notification.metadata.postImage);
      }
      if (notification.metadata?.thumbnail) {
        urls.add(notification.metadata.thumbnail);
      }
    });

    // Queue'ya ekle
    this.cacheQueue.push(...Array.from(urls));

    // Process queue
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Cache'i temizle
   */
  clearCache(): void {
    this.cacheQueue = [];
    this.isProcessing = false;
  }
}

export const notificationAssetCache = new NotificationAssetCache();

