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
  const response = await apiService.getClient().get<BookmarkApiItem[]>(
    `/users/${userId}/bookmarks`
  );
  return response.data;
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

