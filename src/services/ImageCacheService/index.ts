/**
 * ImageCacheService
 * 
 * expo-image cache yönetimi için utility servis
 * Not: clearMemoryCache ve clearDiskCache fonksiyonları expo-image'in bazı versiyonlarında mevcut olmayabilir
 */
export class ImageCacheService {
  /**
   * Memory cache'i temizler
   * Uygulama çalışırken RAM'deki cache'i temizler
   */
  static async clearMemory(): Promise<void> {
    try {
      // Dynamic import ile expo-image'den fonksiyonları al
      const expoImage = await import('expo-image');
      if (expoImage.clearMemoryCache && typeof expoImage.clearMemoryCache === 'function') {
        await expoImage.clearMemoryCache();
        console.log('[ImageCacheService] ✅ Memory cache cleared');
      } else {
        console.warn('[ImageCacheService] ⚠️ clearMemoryCache is not available in this expo-image version');
      }
    } catch (error) {
      console.warn('[ImageCacheService] ⚠️ Error clearing memory cache:', error);
    }
  }

  /**
   * Disk cache'i temizler
   * Cihazın depolama alanındaki cache'i temizler
   */
  static async clearDisk(): Promise<void> {
    try {
      // Dynamic import ile expo-image'den fonksiyonları al
      const expoImage = await import('expo-image');
      if (expoImage.clearDiskCache && typeof expoImage.clearDiskCache === 'function') {
        await expoImage.clearDiskCache();
        console.log('[ImageCacheService] ✅ Disk cache cleared');
      } else {
        console.warn('[ImageCacheService] ⚠️ clearDiskCache is not available in this expo-image version');
      }
    } catch (error) {
      console.warn('[ImageCacheService] ⚠️ Error clearing disk cache:', error);
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
      console.warn('[ImageCacheService] ⚠️ Error clearing all cache:', error);
    }
  }
}


