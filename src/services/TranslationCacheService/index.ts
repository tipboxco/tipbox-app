import AsyncStorage from '@react-native-async-storage/async-storage';
import { TranslationCacheEntry } from '../../types/translation';

const CACHE_PREFIX = 'translation_cache_';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 gün (milliseconds)

export class TranslationCacheService {
  /**
   * Cache key oluşturur
   * Format: translation_cache_postId_sourceLang_targetLang
   */
  private static getCacheKey(
    postId: string,
    sourceLanguage: string,
    targetLanguage: string
  ): string {
    return `${CACHE_PREFIX}${postId}_${sourceLanguage}_${targetLanguage}`;
  }

  /**
   * Content hash oluşturur (içerik değişikliği kontrolü için)
   */
  private static createContentHash(content: string): string {
    // Basit hash fonksiyonu (production'da crypto kullanılabilir)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32bit integer'a çevir
    }
    return hash.toString(36);
  }

  /**
   * Cache'den çeviriyi getirir
   */
  static async get(
    postId: string,
    originalContent: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string | null> {
    try {
      const key = this.getCacheKey(postId, sourceLanguage, targetLanguage);
      const cached = await AsyncStorage.getItem(key);

      if (!cached) {
        console.log('[TranslationCache] MISS:', key);
        return null;
      }

      const entry: TranslationCacheEntry = JSON.parse(cached);

      // TTL kontrolü (7 gün)
      const now = Date.now();
      if (now - entry.timestamp > CACHE_TTL) {
        console.log('[TranslationCache] EXPIRED:', key);
        await this.remove(postId, sourceLanguage, targetLanguage);
        return null;
      }

      // Content hash kontrolü (post içeriği değişmiş mi?)
      const currentHash = this.createContentHash(originalContent);
      if (entry.contentHash !== currentHash) {
        console.log('[TranslationCache] CONTENT_CHANGED:', key);
        await this.remove(postId, sourceLanguage, targetLanguage);
        return null;
      }

      console.log('[TranslationCache] HIT:', key);
      return entry.translatedContent;
    } catch (error) {
      console.error('[TranslationCache] Error reading cache:', error);
      return null;
    }
  }

  /**
   * Çeviriyi cache'e kaydeder
   */
  static async set(
    postId: string,
    originalContent: string,
    translatedContent: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<void> {
    try {
      const key = this.getCacheKey(postId, sourceLanguage, targetLanguage);
      const entry: TranslationCacheEntry = {
        postId,
        originalContent,
        translatedContent,
        sourceLanguage,
        targetLanguage,
        timestamp: Date.now(),
        contentHash: this.createContentHash(originalContent),
      };

      await AsyncStorage.setItem(key, JSON.stringify(entry));
      console.log('[TranslationCache] SAVED:', key);
    } catch (error) {
      console.error('[TranslationCache] Error saving cache:', error);
    }
  }

  /**
   * Belirli bir çeviriyi cache'den siler
   */
  static async remove(
    postId: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<void> {
    try {
      const key = this.getCacheKey(postId, sourceLanguage, targetLanguage);
      await AsyncStorage.removeItem(key);
      console.log('[TranslationCache] REMOVED:', key);
    } catch (error) {
      console.error('[TranslationCache] Error removing cache:', error);
    }
  }

  /**
   * Tüm çeviri cache'ini temizler
   */
  static async clearAll(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const translationKeys = allKeys.filter(key =>
        key.startsWith(CACHE_PREFIX)
      );
      await AsyncStorage.multiRemove(translationKeys);
      console.log('[TranslationCache] CLEARED_ALL:', translationKeys.length);
    } catch (error) {
      console.error('[TranslationCache] Error clearing cache:', error);
    }
  }

  /**
   * Expired cache'leri temizler (opsiyonel cleanup)
   */
  static async cleanupExpired(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const translationKeys = allKeys.filter(key =>
        key.startsWith(CACHE_PREFIX)
      );

      for (const key of translationKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const entry: TranslationCacheEntry = JSON.parse(cached);
          const now = Date.now();
          if (now - entry.timestamp > CACHE_TTL) {
            await AsyncStorage.removeItem(key);
            console.log('[TranslationCache] EXPIRED_REMOVED:', key);
          }
        }
      }
    } catch (error) {
      console.error('[TranslationCache] Error cleaning up cache:', error);
    }
  }
}

