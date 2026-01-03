import { apiService } from '../../../services/ApiService';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import type { ProfilePost } from '@/src/features/profile/types';
import { CardType } from '@/src/types/common';
import { getBookmarks } from '@/src/features/interactions/api/interactionsApi';
import type { Bookmark } from '@/src/features/interactions/types';

/**
 * Bookmarks API Response - Union type for all possible bookmark types
 */
export type BookmarkApiItem = 
  | (BenchmarkApiItem & { type: 'benchmark' })
  | (ProfilePost & { type: 'post' })
  | (TipsApiItem & { type: 'tipsAndTricks' })
  | (QuestionApiItem & { type: 'question' });

/**
 * Get User Bookmarks endpoint function (Legacy - Deprecated)
 * Eski endpoint'i kullanır - yeni endpoint'e migrate edilmelidir
 *
 * @deprecated Use getBookmarks from interactions API instead
 * @param userId - Kullanıcı ID'si
 * @returns BookmarkApiItem[] - Kullanıcının bookmark listesi
 */
export const getUserBookmarks = async (
  userId: string
): Promise<BookmarkApiItem[]> => {
  try {
    const response = await apiService.getClient().get<any>(
      `/users/${userId}/bookmarks`
    );
    
    // API response formatını kontrol et
    // Eğer { success: true, data: [...] } formatındaysa data'yı al
    // Eğer direkt array ise direkt kullan
    if (response.data && typeof response.data === 'object') {
      // Eğer data property'si varsa ve array ise
      if ('data' in response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      // Eğer direkt array ise
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // Eğer items property'si varsa (feed formatı gibi)
      if ('items' in response.data && Array.isArray(response.data.items)) {
        return response.data.items;
      }
    }
    
    // Hiçbiri değilse boş array döndür
    console.warn('[getUserBookmarks] Unexpected response format:', {
      userId,
      responseDataType: typeof response.data,
      responseDataKeys: response.data ? Object.keys(response.data) : null,
      responseData: response.data,
    });
    
    return [];
  } catch (error: any) {
    console.error('[getUserBookmarks] API Error:', {
      userId,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Bookmarks endpoint function (New)
 * Yeni interactions API endpoint'ini kullanır
 * Kullanıcının kendi bookmark'larını getirir
 *
 * @param limit - Sayfa başına kayıt sayısı (default: 50)
 * @returns Bookmark[] - Bookmark listesi (postId'ler içerir)
 */
export const getUserBookmarksNew = async (
  limit: number = 50
): Promise<Bookmark[]> => {
  const response = await getBookmarks(limit);
  return response.data || [];
};

