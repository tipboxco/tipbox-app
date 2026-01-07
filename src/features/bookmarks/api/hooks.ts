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
 * Get User Bookmarks query hook
 * /users/{userId}/bookmarks endpoint'ini kullanır
 * Kullanıcının bookmark'larını tam post verileri ile getirir
 *
 * @deprecated Bu endpoint deprecated. useUserBookmarksWithDetails kullanın.
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
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Get User Bookmarks with improved error handling
 * Eski endpoint'i kullanır, hata durumunda detaylı log yazar
 *
 * @returns React Query hook result
 */
export const useUserBookmarksWithFallback = () => {
  const userId = useCurrentUserIdOrLogout();

  return useQuery<BookmarkApiItem[], Error>({
    queryKey: userId ? bookmarkKeys.userBookmarks(userId) : ['bookmarks', 'disabled'],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      try {
        const data = await getUserBookmarks(userId);
        console.log('[useUserBookmarks] ✅ Success:', {
          userId,
          bookmarksCount: data?.length || 0,
          bookmarks: data?.map((b) => ({ id: b.id, type: b.type })),
        });
        return data;
      } catch (error: any) {
        console.error('[useUserBookmarks] ❌ Error:', {
          userId,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
        throw error;
      }
    },
    enabled: !!userId,
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
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
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Re-export useBookmarks from interactions API for convenience
 */
export { useInteractionsBookmarks as useBookmarks };

