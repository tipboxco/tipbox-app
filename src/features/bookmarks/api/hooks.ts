import { useQuery } from '@tanstack/react-query';
import { getUserBookmarks } from './bookmarksApi';
import type { BookmarkApiItem } from './bookmarksApi';
import { useCurrentUserIdOrLogout } from '@/src/utils';

/**
 * Query Keys - Bookmarks feature için cache key pattern'leri
 */
export const bookmarkKeys = {
  all: ['bookmarks'] as const,
  userBookmarks: (userId: string) =>
    [...bookmarkKeys.all, userId] as const,
};

/**
 * Get User Bookmarks query hook
 * Kullanıcının bookmark'larını getirir (cache olmadan)
 *
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

