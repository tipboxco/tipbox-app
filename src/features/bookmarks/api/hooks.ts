import { useQuery } from '@tanstack/react-query';
import { getUserBookmarks, getUserBookmarksNew } from './bookmarksApi';
import type { BookmarkApiItem } from './bookmarksApi';
import { useCurrentUserIdOrLogout } from '@/src/utils';
import { interactionKeys, useBookmarks as useInteractionsBookmarks } from '@/src/features/interactions/api/hooks';
import type { Bookmark } from '@/src/features/interactions/types';

/**
 * Query Keys - Bookmarks feature için cache key pattern'leri
 */
export const bookmarkKeys = {
  all: ['bookmarks'] as const,
  userBookmarks: (userId: string) =>
    [...bookmarkKeys.all, userId] as const,
};

/**
 * Get User Bookmarks query hook (Legacy - Deprecated)
 * Eski endpoint'i kullanır
 *
 * @deprecated Use useUserBookmarksNew instead
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useUserBookmarks();
 */
export const useUserBookmarks = () => {
  const userId = useCurrentUserIdOrLogout();

  return useQuery<BookmarkApiItem[], Error>({
    queryKey: userId ? bookmarkKeys.userBookmarks(userId) : ['bookmarks', 'disabled'],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return getUserBookmarks(userId);
    },
    enabled: !!userId,
    staleTime: 0, // Cache yok
    gcTime: 0, // Cache yok
    refetchOnMount: 'always', // Her mount'ta yeniden fetch et
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get User Bookmarks query hook (New)
 * Yeni interactions API endpoint'ini kullanır
 * Kullanıcının kendi bookmark'larını getirir
 *
 * @param limit - Sayfa başına kayıt sayısı (default: 50)
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useUserBookmarksNew();
 */
export const useUserBookmarksNew = (limit: number = 50) => {
  return useQuery<Bookmark[], Error>({
    queryKey: interactionKeys.bookmarks(),
    queryFn: () => getUserBookmarksNew(limit),
    staleTime: 2 * 60 * 1000, // 2 dakika
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

/**
 * Re-export useBookmarks from interactions API for convenience
 */
export { useInteractionsBookmarks as useBookmarks };

