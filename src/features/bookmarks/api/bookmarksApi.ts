import { apiService } from '../../../services/ApiService';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import type { ProfilePost } from '@/src/features/profile/types';
import { CardType } from '@/src/types/common';

/**
 * Bookmarks API Response - Union type for all possible bookmark types
 */
export type BookmarkApiItem = 
  | (BenchmarkApiItem & { type: 'benchmark' })
  | (ProfilePost & { type: 'post' })
  | (TipsApiItem & { type: 'tipsAndTricks' })
  | (QuestionApiItem & { type: 'question' });

/**
 * Get User Bookmarks endpoint function
 * Kullanıcının bookmark'larını getirir
 *
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

