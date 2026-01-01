import { clearMemoryCache, clearDiskCache } from 'expo-image';

/**
 * ImageCacheService
 * 
 * expo-image cache yönetimi için utility servis
 */
export class ImageCacheService {
  /**
   * Memory cache'i temizler
   * Uygulama çalışırken RAM'deki cache'i temizler
   */
  static async clearMemory(): Promise<void> {
    try {
      await clearMemoryCache();
      console.log('[ImageCacheService] ✅ Memory cache cleared');
    } catch (error) {
      console.error('[ImageCacheService] ❌ Error clearing memory cache:', error);
    }
  }

  /**
   * Disk cache'i temizler
   * Cihazın depolama alanındaki cache'i temizler
   */
  static async clearDisk(): Promise<void> {
    try {
      await clearDiskCache();
      console.log('[ImageCacheService] ✅ Disk cache cleared');
    } catch (error) {
      console.error('[ImageCacheService] ❌ Error clearing disk cache:', error);
    }
  }

  /**
   * Tüm cache'i temizler (memory + disk)
   * Logout veya cache temizleme ihtiyacı olduğunda kullanılabilir
   */
  static async clearAll(): Promise<void> {
    try {
      await Promise.all([
        this.clearMemory(),
        this.clearDisk(),
      ]);
      console.log('[ImageCacheService] ✅ All cache cleared');
    } catch (error) {
      console.error('[ImageCacheService] ❌ Error clearing all cache:', error);
    }
  }
}

