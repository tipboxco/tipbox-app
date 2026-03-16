import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
  getBookmarks,
  createComment,
  getComments,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
  sharePost,
  sharePostToDm,
  getPostStatus,
  upvotePost,
  removeUpvote,
} from './interactionsApi';
import type {
  PostInteractionStatus,
  Comment,
  CommentsResponse,
  Bookmark,
  BookmarksResponse,
  ShareResponse,
  ApiResponse,
} from '../types';
import type { FeedApiResponse, FeedApiItem } from '@/src/features/feed/api/feedApi';
import { feedKeys } from '@/src/features/feed/api/hooks';
import { profileKeys } from '@/src/features/profile/api/hooks';
import type { UserFeedApiResponse } from '@/src/features/profile/api/profileApi';
import type { ProfileFeedItem } from '@/src/features/profile/types';

/**
 * Query Keys - Interactions feature için cache key pattern'leri
 */
export type CommentSortBy = 'newest' | 'oldest' | 'popular';

export const interactionKeys = {
  all: ['interactions'] as const,
  postStatus: (postId: string) => [...interactionKeys.all, 'status', postId] as const,
  comments: (postId: string, sortBy: CommentSortBy = 'newest') =>
    [...interactionKeys.all, 'comments', postId, sortBy] as const,
  /** Tüm sort varyantlarını invalidate/cancel için prefix */
  commentsPrefix: (postId: string) => [...interactionKeys.all, 'comments', postId] as const,
  bookmarks: () => [...interactionKeys.all, 'bookmarks'] as const,
};

/**
 * Helper: Feed içinde post bul ve güncelle
 */
const updatePostInFeed = (
  feedData: FeedApiResponse | undefined,
  postId: string,
  updater: (post: FeedApiItem['data']) => FeedApiItem['data']
): FeedApiResponse | undefined => {
  if (!feedData || !feedData.items || !Array.isArray(feedData.items)) {
    return feedData;
  }

  return {
    ...feedData,
    items: feedData.items.map((item) => {
      if (item?.data?.id === postId) {
        return {
          ...item,
          data: updater(item.data),
        };
      }
      return item;
    }),
  };
};

/**
 * Helper: Infinite query pages içinde post bul ve güncelle
 */
const updatePostInInfiniteFeed = (
  pages: FeedApiResponse[] | undefined,
  postId: string,
  updater: (post: FeedApiItem['data']) => FeedApiItem['data']
): FeedApiResponse[] | undefined => {
  if (!pages || !Array.isArray(pages)) return pages;

  return pages.map((page) => {
    const updated = updatePostInFeed(page, postId, updater);
    return updated || page;
  });
};

/**
 * Helper: Stats objesi güncelle
 */
const updateStats = (
  stats: { likes: number; comments: number; shares: number; bookmarks: number },
  updates: Partial<typeof stats>
) => ({
  ...stats,
  ...updates,
});

/**
 * Helper: Profile feed içinde post bul ve güncelle
 */
const updatePostInProfileFeed = (
  feedData: UserFeedApiResponse | undefined,
  postId: string,
  updater: (post: ProfileFeedItem) => ProfileFeedItem
): UserFeedApiResponse | undefined => {
  if (!feedData || !feedData.items || !Array.isArray(feedData.items)) {
    return feedData;
  }

  return {
    ...feedData,
    items: feedData.items.map((item) => {
      if (item?.id === postId) {
        return updater(item);
      }
      return item;
    }),
  };
};

/**
 * Helper: Infinite query pages içinde profile feed post bul ve güncelle
 */
const updatePostInInfiniteProfileFeed = (
  pages: UserFeedApiResponse[] | undefined,
  postId: string,
  updater: (post: ProfileFeedItem) => ProfileFeedItem
): UserFeedApiResponse[] | undefined => {
  if (!pages || !Array.isArray(pages)) return pages;

  return pages.map((page) => {
    const updated = updatePostInProfileFeed(page, postId, updater);
    return updated || page;
  });
};

/**
 * Get Post Status query hook
 * Post'un kullanıcı etkileşim durumunu getirir
 *
 * @param postId - Post ID'si
 * @returns React Query hook result
 */
export const usePostStatus = (postId: string) => {
  return useQuery<PostInteractionStatus, Error>({
    queryKey: interactionKeys.postStatus(postId),
    queryFn: async () => {
      const response = await getPostStatus(postId);
      // FIXED: Interceptor unwraps response, so response is already the data
      return response ?? { liked: false, favorited: false, shared: false, upvoted: false };
    },
    enabled: !!postId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
  });
};

/**
 * Get Comments query hook
 * Post'un yorumlarını getirir
 *
 * @param postId - Post ID'si
 * @param limit - Sayfa başına kayıt sayısı (default: 50)
 * @param sortBy - Sıralama: newest | oldest | popular (default: newest)
 * @returns React Query hook result
 */
export const useComments = (
  postId: string,
  limit: number = 50,
  sortBy: CommentSortBy = 'newest'
) => {
  return useQuery<CommentsResponse, Error>({
    queryKey: interactionKeys.comments(postId, sortBy),
    queryFn: async () => {
      const response = await getComments(postId, limit, sortBy);
      // FIXED: Interceptor unwraps response, so response is already the data
      return response ?? { comments: [] };
    },
    enabled: !!postId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
  });
};

/**
 * Get Bookmarks query hook
 * Kullanıcının bookmark'larını getirir
 *
 * @param limit - Sayfa başına kayıt sayısı (default: 50)
 * @returns React Query hook result
 */
export const useBookmarks = (limit: number = 50) => {
  return useQuery<Bookmark[], Error>({
    queryKey: interactionKeys.bookmarks(),
    queryFn: async () => {
      const response = await getBookmarks(limit);
      // Backend returns { success: true, data: { data: Bookmark[] } }
      // Interceptor unwraps to { data: Bookmark[] }
      // So response is { data: Bookmark[] } which is BookmarksResponse
      return response.data || [];
    },
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
  });
};

/**
 * Tek setQueriesData ile feed cache güncelle (single + infinite tek geçiş; profile skip - refetch on open)
 */
const setFeedPostUpdate = (
  queryClient: ReturnType<typeof useQueryClient>,
  postId: string,
  updater: (post: FeedApiItem['data']) => FeedApiItem['data']
) => {
  queryClient.setQueriesData(
    { queryKey: feedKeys.all },
    (old: any) => {
      if (!old) return old;
      if (old.pages && Array.isArray(old.pages)) {
        return {
          ...old,
          pages: updatePostInInfiniteFeed(old.pages, postId, updater),
        };
      }
      return updatePostInFeed(old, postId, updater);
    }
  );
};

/**
 * Like Post mutation hook
 * Post'u beğenir (optimistic update: sadece feed cache, profile refetch on open)
 */
export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<void>, Error, string, { previousFeedPages?: FeedApiResponse[] }>({
    mutationFn: likePost,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.all });
      await queryClient.cancelQueries({ queryKey: profileKeys.all });

      const previousFeedPages = queryClient.getQueryData<FeedApiResponse[]>(
        feedKeys.feed(undefined, 20)
      );

      setFeedPostUpdate(queryClient, postId, (post) => ({
        ...post,
        stats: updateStats(post.stats, { likes: post.stats.likes + 1 }),
        isLiked: true,
      }));

      return { previousFeedPages };
    },
    onError: (err, postId, context) => {
      // Cache'i eski haline döndür
      if (context?.previousFeedPages) {
        queryClient.setQueryData(feedKeys.feed(undefined, 20), context.previousFeedPages);
      }
      // Error logging
      console.error('[useLikePost] Error:', err);
    },
    onSuccess: (data, postId) => {
      // Sadece post status'u invalidate et (feed zaten optimistic update ile güncellendi)
      // Feed'i invalidate etme çünkü backend henüz güncellememiş olabilir ve eski data gelir
      queryClient.invalidateQueries({ queryKey: interactionKeys.postStatus(postId) });
    },
  });
};

/**
 * Unlike Post mutation hook
 * Post beğenisini geri alır (optimistic update ile)
 *
 * @returns React Query mutation hook result
 */
export const useUnlikePost = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<void>, Error, string, { previousFeedPages?: FeedApiResponse[] }>({
    mutationFn: unlikePost,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.all });
      await queryClient.cancelQueries({ queryKey: profileKeys.all });

      const previousFeedPages = queryClient.getQueryData<FeedApiResponse[]>(
        feedKeys.feed(undefined, 20)
      );

      setFeedPostUpdate(queryClient, postId, (post) => ({
        ...post,
        stats: updateStats(post.stats, { likes: Math.max(0, post.stats.likes - 1) }),
        isLiked: false,
      }));

      return { previousFeedPages };
    },
    onError: (err, postId, context) => {
      if (context?.previousFeedPages) {
        queryClient.setQueryData(feedKeys.feed(undefined, 20), context.previousFeedPages);
      }
      // Error logging
      console.error('[useUnlikePost] Error:', err);
    },
    onSuccess: (data, postId) => {
      // Sadece post status'u invalidate et (feed zaten optimistic update ile güncellendi)
      queryClient.invalidateQueries({ queryKey: interactionKeys.postStatus(postId) });
    },
  });
};

/**
 * Bookmark Post mutation hook
 * Post'u favorilere ekler (optimistic update ile)
 *
 * @returns React Query mutation hook result
 */
export const useBookmarkPost = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<Bookmark>, Error, string, { previousFeedPages?: FeedApiResponse[] }>({
    mutationFn: bookmarkPost,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.all });
      await queryClient.cancelQueries({ queryKey: profileKeys.all });
      await queryClient.cancelQueries({ queryKey: interactionKeys.bookmarks() });

      const previousFeedPages = queryClient.getQueryData<FeedApiResponse[]>(
        feedKeys.feed(undefined, 20)
      );

      setFeedPostUpdate(queryClient, postId, (post) => ({
        ...post,
        stats: updateStats(post.stats, { bookmarks: post.stats.bookmarks + 1 }),
        isBookmarked: true,
      }));

      return { previousFeedPages };
    },
    onError: (err, postId, context) => {
      if (context?.previousFeedPages) {
        queryClient.setQueryData(feedKeys.feed(undefined, 20), context.previousFeedPages);
      }
      console.error('[useBookmarkPost] Error:', err);
    },
    onSuccess: (data, postId) => {
      // Bookmarks listesini invalidate et
      queryClient.invalidateQueries({ queryKey: interactionKeys.bookmarks() });
      // /users/{userId}/bookmarks endpoint'ini de invalidate et
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      // Post status'u invalidate et (feed zaten optimistic update ile güncellendi)
      queryClient.invalidateQueries({ queryKey: interactionKeys.postStatus(postId) });
    },
  });
};

/**
 * Unbookmark Post mutation hook
 * Post'u favorilerden çıkarır (optimistic update ile)
 *
 * @returns React Query mutation hook result
 */
export const useUnbookmarkPost = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<void>, Error, string, { previousFeedPages?: FeedApiResponse[] }>({
    mutationFn: unbookmarkPost,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.all });
      await queryClient.cancelQueries({ queryKey: profileKeys.all });
      await queryClient.cancelQueries({ queryKey: interactionKeys.bookmarks() });

      const previousFeedPages = queryClient.getQueryData<FeedApiResponse[]>(
        feedKeys.feed(undefined, 20)
      );

      setFeedPostUpdate(queryClient, postId, (post) => ({
        ...post,
        stats: updateStats(post.stats, { bookmarks: Math.max(0, post.stats.bookmarks - 1) }),
        isBookmarked: false,
      }));

      return { previousFeedPages };
    },
    onError: (err, postId, context) => {
      if (context?.previousFeedPages) {
        queryClient.setQueryData(feedKeys.feed(undefined, 20), context.previousFeedPages);
      }
      console.error('[useUnbookmarkPost] Error:', err);
    },
    onSuccess: (data, postId) => {
      // Bookmarks listesini invalidate et
      queryClient.invalidateQueries({ queryKey: interactionKeys.bookmarks() });
      // /users/{userId}/bookmarks endpoint'ini de invalidate et
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      // Post status'u invalidate et (feed zaten optimistic update ile güncellendi)
      queryClient.invalidateQueries({ queryKey: interactionKeys.postStatus(postId) });
    },
  });
};

/**
 * Create Comment mutation hook
 * Post'a yorum yapar (optimistic update ile)
 *
 * @returns React Query mutation hook result
 */
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<Comment>,
    Error,
    { postId: string; comment: string; parentId?: string },
    { previousComments?: CommentsResponse }
  >({
    mutationFn: ({ postId, comment, parentId }) => createComment(postId, comment, parentId),
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: interactionKeys.commentsPrefix(postId) });
      await queryClient.cancelQueries({ queryKey: feedKeys.all });

      const previousComments = queryClient.getQueryData<CommentsResponse>(
        interactionKeys.commentsPrefix(postId)
      );

      // Feed'deki comment sayısını artır
      queryClient.setQueriesData<FeedApiResponse>(
        { queryKey: feedKeys.all },
        (old) => {
          if (!old) return old;
          return updatePostInFeed(old, postId, (post) => ({
            ...post,
            stats: updateStats(post.stats, { comments: post.stats.comments + 1 }),
          }));
        }
      );

      // Profile feed'lerindeki comment sayısını da artır (tüm profile feed query'leri: posts, reviews, benchmarks, tips, replies)
      // Infinite query pages için güncelle
      queryClient.setQueriesData(
        { queryKey: profileKeys.posts() },
        (old: any) => {
          if (!old || !old.pages || !Array.isArray(old.pages)) return old;
          return {
            ...old,
            pages: updatePostInInfiniteProfileFeed(old.pages, postId, (post) => ({
              ...post,
              stats: updateStats(post.stats, { comments: post.stats.comments + 1 }),
            })),
          };
        }
      );

      queryClient.setQueriesData(
        { queryKey: profileKeys.reviews() },
        (old: any) => {
          if (!old || !old.pages || !Array.isArray(old.pages)) return old;
          return {
            ...old,
            pages: updatePostInInfiniteProfileFeed(old.pages, postId, (post) => ({
              ...post,
              stats: updateStats(post.stats, { comments: post.stats.comments + 1 }),
            })),
          };
        }
      );

      queryClient.setQueriesData(
        { queryKey: profileKeys.benchmarks() },
        (old: any) => {
          if (!old || !old.pages || !Array.isArray(old.pages)) return old;
          return {
            ...old,
            pages: updatePostInInfiniteProfileFeed(old.pages, postId, (post) => ({
              ...post,
              stats: updateStats(post.stats, { comments: post.stats.comments + 1 }),
            })),
          };
        }
      );

      queryClient.setQueriesData(
        { queryKey: profileKeys.tips() },
        (old: any) => {
          if (!old || !old.pages || !Array.isArray(old.pages)) return old;
          return {
            ...old,
            pages: updatePostInInfiniteProfileFeed(old.pages, postId, (post) => ({
              ...post,
              stats: updateStats(post.stats, { comments: post.stats.comments + 1 }),
            })),
          };
        }
      );

      queryClient.setQueriesData(
        { queryKey: profileKeys.replies() },
        (old: any) => {
          if (!old || !old.pages || !Array.isArray(old.pages)) return old;
          return {
            ...old,
            pages: updatePostInInfiniteProfileFeed(old.pages, postId, (post) => ({
              ...post,
              stats: updateStats(post.stats, { comments: post.stats.comments + 1 }),
            })),
          };
        }
      );

      return { previousComments };
    },
    onError: (err, variables) => {
      // SortBy ile cache key değiştiği için rollback yerine refetch
      queryClient.invalidateQueries({ queryKey: interactionKeys.commentsPrefix(variables.postId) });
      console.error('[useCreateComment] Error:', err);
    },
    onSuccess: (data, variables) => {
      // Comments'i invalidate et (yeni yorum eklendi)
      queryClient.invalidateQueries({ queryKey: interactionKeys.commentsPrefix(variables.postId) });
      // Feed'i invalidate etme - optimistic update zaten comment sayısını artırdı
    },
  });
};

/**
 * Update Comment mutation hook
 * Yorumu günceller
 *
 * @returns React Query mutation hook result
 */
export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<Comment>,
    Error,
    { commentId: string; postId: string; comment: string },
    { previousComments?: CommentsResponse }
  >({
    mutationFn: ({ commentId, comment }) => updateComment(commentId, comment),
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: interactionKeys.commentsPrefix(postId) });

      const previousComments = queryClient.getQueryData<CommentsResponse>(
        interactionKeys.commentsPrefix(postId)
      );

      return { previousComments };
    },
    onError: (err, variables) => {
      queryClient.invalidateQueries({ queryKey: interactionKeys.commentsPrefix(variables.postId) });
      console.error('[useUpdateComment] Error:', err);
    },
    onSuccess: (data, variables) => {
      // Comments'i invalidate et (yorum güncellendi)
      queryClient.invalidateQueries({ queryKey: interactionKeys.commentsPrefix(variables.postId) });
    },
  });
};

/**
 * Delete Comment mutation hook
 * Yorumu siler (optimistic update ile)
 *
 * @returns React Query mutation hook result
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<void>, Error, { commentId: string; postId: string }, { previousComments?: CommentsResponse }>({
    mutationFn: ({ commentId }) => deleteComment(commentId),
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: interactionKeys.commentsPrefix(postId) });
      await queryClient.cancelQueries({ queryKey: feedKeys.all });

      const previousComments = queryClient.getQueryData<CommentsResponse>(
        interactionKeys.commentsPrefix(postId)
      );

      // Feed'deki comment sayısını azalt
      queryClient.setQueriesData<FeedApiResponse>(
        { queryKey: feedKeys.all },
        (old) => {
          if (!old) return old;
          return updatePostInFeed(old, postId, (post) => ({
            ...post,
            stats: updateStats(post.stats, { comments: Math.max(0, post.stats.comments - 1) }),
          }));
        }
      );

      return { previousComments };
    },
    onError: (err, variables) => {
      queryClient.invalidateQueries({ queryKey: interactionKeys.commentsPrefix(variables.postId) });
      console.error('[useDeleteComment] Error:', err);
    },
    onSuccess: (data, variables) => {
      // Comments'i invalidate et (yorum silindi)
      queryClient.invalidateQueries({ queryKey: interactionKeys.commentsPrefix(variables.postId) });
      // Feed'i invalidate etme - optimistic update zaten comment sayısını azalttı
    },
  });
};

/**
 * Like Comment mutation hook
 * Likes a comment (no optimistic update, waits for backend response)
 *
 * @returns React Query mutation hook result
 */
export const useLikeComment = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<void>, Error, { commentId: string; postId: string }>({
    mutationFn: ({ commentId }) => likeComment(commentId),
    onSuccess: (data, variables) => {
      // Invalidate comments query to get updated like status from backend
      queryClient.invalidateQueries({ queryKey: interactionKeys.commentsPrefix(variables.postId) });
    },
    onError: (err, variables) => {
      console.error('[useLikeComment] Error:', err);
      // Hata durumunda da refetch et - doğru isLiked state'ini al
      queryClient.invalidateQueries({ queryKey: interactionKeys.commentsPrefix(variables.postId) });
    },
  });
};

/**
 * Unlike Comment mutation hook
 * Unlikes a comment (no optimistic update, waits for backend response)
 *
 * @returns React Query mutation hook result
 */
export const useUnlikeComment = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<void>, Error, { commentId: string; postId: string }>({
    mutationFn: ({ commentId }) => unlikeComment(commentId),
    onSuccess: (data, variables) => {
      // Invalidate comments query to get updated like status from backend
      queryClient.invalidateQueries({ queryKey: interactionKeys.commentsPrefix(variables.postId) });
    },
    onError: (err, variables) => {
      console.error('[useUnlikeComment] Error:', err);
      // Hata durumunda da refetch et - doğru isLiked state'ini al
      queryClient.invalidateQueries({ queryKey: interactionKeys.commentsPrefix(variables.postId) });
    },
  });
};

/**
 * Share Post mutation hook
 * Post'u paylaşır (sadece başarılı olduğunda sayıyı artırır)
 *
 * @returns React Query mutation hook result
 */
export const useSharePost = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<ShareResponse>,
    Error,
    { postId: string; shareType: 'INTERNAL_REPOST' | 'EXTERNAL_SHARE'; platform?: string }
  >({
    mutationFn: ({ postId, shareType, platform }) => sharePost(postId, shareType, platform),
    onSuccess: (data, variables) => {
      // Sadece backend başarılı olduğunda feed'i güncelle
      queryClient.setQueriesData<FeedApiResponse>(
        { queryKey: feedKeys.all },
        (old) => {
          if (!old) return old;
          return updatePostInFeed(old, variables.postId, (post) => ({
            ...post,
            stats: updateStats(post.stats, { shares: post.stats.shares + 1 }),
            isShared: true,
          }));
        }
      );

      // Infinite query pages için de güncelle
      queryClient.setQueriesData(
        { queryKey: feedKeys.all },
        (old: any) => {
          if (!old || !old.pages || !Array.isArray(old.pages)) return old;
          return {
            ...old,
            pages: updatePostInInfiniteFeed(old.pages, variables.postId, (post) => ({
              ...post,
              stats: updateStats(post.stats, { shares: post.stats.shares + 1 }),
              isShared: true,
            })),
          };
        }
      );

      // Profile feed'leri için de güncelle (tüm profile feed query'leri: posts, reviews, benchmarks, tips, replies)
      // Infinite query pages için güncelle
      queryClient.setQueriesData(
        { queryKey: profileKeys.posts() },
        (old: any) => {
          if (!old || !old.pages || !Array.isArray(old.pages)) return old;
          return {
            ...old,
            pages: updatePostInInfiniteProfileFeed(old.pages, variables.postId, (post) => ({
              ...post,
              stats: updateStats(post.stats, { shares: post.stats.shares + 1 }),
              isShared: true,
            })),
          };
        }
      );

      queryClient.setQueriesData(
        { queryKey: profileKeys.reviews() },
        (old: any) => {
          if (!old || !old.pages || !Array.isArray(old.pages)) return old;
          return {
            ...old,
            pages: updatePostInInfiniteProfileFeed(old.pages, variables.postId, (post) => ({
              ...post,
              stats: updateStats(post.stats, { shares: post.stats.shares + 1 }),
              isShared: true,
            })),
          };
        }
      );

      queryClient.setQueriesData(
        { queryKey: profileKeys.benchmarks() },
        (old: any) => {
          if (!old || !old.pages || !Array.isArray(old.pages)) return old;
          return {
            ...old,
            pages: updatePostInInfiniteProfileFeed(old.pages, variables.postId, (post) => ({
              ...post,
              stats: updateStats(post.stats, { shares: post.stats.shares + 1 }),
              isShared: true,
            })),
          };
        }
      );

      queryClient.setQueriesData(
        { queryKey: profileKeys.tips() },
        (old: any) => {
          if (!old || !old.pages || !Array.isArray(old.pages)) return old;
          return {
            ...old,
            pages: updatePostInInfiniteProfileFeed(old.pages, variables.postId, (post) => ({
              ...post,
              stats: updateStats(post.stats, { shares: post.stats.shares + 1 }),
              isShared: true,
            })),
          };
        }
      );

      queryClient.setQueriesData(
        { queryKey: profileKeys.replies() },
        (old: any) => {
          if (!old || !old.pages || !Array.isArray(old.pages)) return old;
          return {
            ...old,
            pages: updatePostInInfiniteProfileFeed(old.pages, variables.postId, (post) => ({
              ...post,
              stats: updateStats(post.stats, { shares: post.stats.shares + 1 }),
              isShared: true,
            })),
          };
        }
      );

      // Post status'u invalidate et
      queryClient.invalidateQueries({ queryKey: interactionKeys.postStatus(variables.postId) });
    },
    onError: (err, variables) => {
      // Error logging
      console.error('[useSharePost] Error:', err);
    },
  });
};

export const useSharePostToDm = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { messageId: string; threadId: string },
    Error,
    { postId: string; toUserId: string; message?: string }
  >({
    mutationFn: ({ postId, toUserId, message }) => sharePostToDm(postId, toUserId, message),
    onSuccess: (data, variables) => {
      // Sadece backend başarılı olduğunda feed'i güncelle
      queryClient.setQueriesData<FeedApiResponse>(
        { queryKey: feedKeys.all },
        (old) => {
          if (!old) return old;
          return updatePostInFeed(old, variables.postId, (post) => ({
            ...post,
            stats: updateStats(post.stats, { shares: post.stats.shares + 1 }),
            isShared: true,
          }));
        }
      );

      // Infinite query pages için de güncelle
      queryClient.setQueriesData(
        { queryKey: feedKeys.all },
        (old: any) => {
          if (!old || !old.pages || !Array.isArray(old.pages)) return old;
          return {
            ...old,
            pages: updatePostInInfiniteFeed(old.pages, variables.postId, (post) => ({
              ...post,
              stats: updateStats(post.stats, { shares: post.stats.shares + 1 }),
              isShared: true,
            })),
          };
        }
      );

      // Profile feed'leri için de güncelle (tüm profile feed query'leri: posts, reviews, benchmarks, tips, replies)
      // Infinite query pages için güncelle
      queryClient.setQueriesData(
        { queryKey: profileKeys.posts() },
        (old: any) => {
          if (!old || !old.pages || !Array.isArray(old.pages)) return old;
          return {
            ...old,
            pages: updatePostInInfiniteProfileFeed(old.pages, variables.postId, (post) => ({
              ...post,
              stats: updateStats(post.stats, { shares: post.stats.shares + 1 }),
              isShared: true,
            })),
          };
        }
      );

      queryClient.setQueriesData(
        { queryKey: profileKeys.reviews() },
        (old: any) => {
          if (!old || !old.pages || !Array.isArray(old.pages)) return old;
          return {
            ...old,
            pages: updatePostInInfiniteProfileFeed(old.pages, variables.postId, (post) => ({
              ...post,
              stats: updateStats(post.stats, { shares: post.stats.shares + 1 }),
              isShared: true,
            })),
          };
        }
      );

      queryClient.setQueriesData(
        { queryKey: profileKeys.benchmarks() },
        (old: any) => {
          if (!old || !old.pages || !Array.isArray(old.pages)) return old;
          return {
            ...old,
            pages: updatePostInInfiniteProfileFeed(old.pages, variables.postId, (post) => ({
              ...post,
              stats: updateStats(post.stats, { shares: post.stats.shares + 1 }),
              isShared: true,
            })),
          };
        }
      );

      queryClient.setQueriesData(
        { queryKey: profileKeys.tips() },
        (old: any) => {
          if (!old || !old.pages || !Array.isArray(old.pages)) return old;
          return {
            ...old,
            pages: updatePostInInfiniteProfileFeed(old.pages, variables.postId, (post) => ({
              ...post,
              stats: updateStats(post.stats, { shares: post.stats.shares + 1 }),
              isShared: true,
            })),
          };
        }
      );

      queryClient.setQueriesData(
        { queryKey: profileKeys.replies() },
        (old: any) => {
          if (!old || !old.pages || !Array.isArray(old.pages)) return old;
          return {
            ...old,
            pages: updatePostInInfiniteProfileFeed(old.pages, variables.postId, (post) => ({
              ...post,
              stats: updateStats(post.stats, { shares: post.stats.shares + 1 }),
              isShared: true,
            })),
          };
        }
      );

      // Post status'u invalidate et
      queryClient.invalidateQueries({ queryKey: interactionKeys.postStatus(variables.postId) });
    },
    onError: (err, variables) => {
      // Error logging
      console.error('[useSharePostToDm] Error:', err);
    },
  });
};

/**
 * Upvote Post mutation hook
 * Event post'una upvote verir ve cache'i günceller
 *
 * @returns React Query mutation hook
 */
export const useUpvotePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId }: { postId: string }) => upvotePost(postId),
    onMutate: async (variables) => {
      const { postId } = variables;

      // Optimistic update için önceki verileri kaydet
      await queryClient.cancelQueries({ queryKey: feedKeys.all() });
      await queryClient.cancelQueries({ queryKey: profileKeys.all() });

      // Feed cache güncelle (upvotesCount +1, isUpvoted = true)
      setFeedPostUpdate(queryClient, postId, (post) => ({
        ...post,
        stats: {
          ...post.stats,
          upvotes: (post.stats.upvotes || 0) + 1,
        },
        isUpvoted: true,
      }));

      // Post status'u invalidate et
      queryClient.invalidateQueries({ queryKey: interactionKeys.postStatus(postId) });
    },
    onError: (err, variables) => {
      // Hata durumunda cache'i geri yükle (refetch ile)
      queryClient.invalidateQueries({ queryKey: feedKeys.all() });
      queryClient.invalidateQueries({ queryKey: profileKeys.all() });
      console.error('[useUpvotePost] Error:', err);
    },
  });
};

/**
 * Remove Upvote mutation hook
 * Post upvote'unu geri alır ve cache'i günceller
 *
 * @returns React Query mutation hook
 */
export const useRemoveUpvote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId }: { postId: string }) => removeUpvote(postId),
    onMutate: async (variables) => {
      const { postId } = variables;

      // Optimistic update için önceki verileri kaydet
      await queryClient.cancelQueries({ queryKey: feedKeys.all() });
      await queryClient.cancelQueries({ queryKey: profileKeys.all() });

      // Feed cache güncelle (upvotesCount -1, isUpvoted = false)
      setFeedPostUpdate(queryClient, postId, (post) => ({
        ...post,
        stats: {
          ...post.stats,
          upvotes: Math.max((post.stats.upvotes || 0) - 1, 0),
        },
        isUpvoted: false,
      }));

      // Post status'u invalidate et
      queryClient.invalidateQueries({ queryKey: interactionKeys.postStatus(postId) });
    },
    onError: (err, variables) => {
      // Hata durumunda cache'i geri yükle (refetch ile)
      queryClient.invalidateQueries({ queryKey: feedKeys.all() });
      queryClient.invalidateQueries({ queryKey: profileKeys.all() });
      console.error('[useRemoveUpvote] Error:', err);
    },
  });
};

