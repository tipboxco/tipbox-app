import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  createFreePost,
  createBenchmarkPost,
  createTipsAndTricksPost,
  createQuestionPost,
  createUpdatePost,
  createExperiencePost,
  splitExperience,
  getBoostOptions,
  getExperienceOptions,
  getPostDetail,
  searchPosts,
  updatePost,
  deletePost,
  togglePostBoost,
  getBoostPrice,
  type PostDetailResponse,
  type SearchPostsResponse,
  type UpdatePostRequest,
  type UpdatePostResponse,
  type DeletePostResponse,
  type ToggleBoostRequest,
  type ToggleBoostResponse,
  type GetBoostPriceResponse,
  type ExperienceOptionsResponse,
} from './postApi';
import type { CreatePostRequest, CreatePostResponse, ApiContextType } from '../types';
import type { 
  CreateBenchmarkPostRequest,
  CreateTipsAndTricksPostRequest,
  CreateQuestionPostRequest,
  CreateUpdatePostRequest,
  CreateExperiencePostRequest,
  SplitExperienceRequest,
  SplitExperienceResponse,
  BoostOption,
} from './postApi';
import { feedKeys } from '@/src/features/feed/api/hooks';
import { eventsKeys } from '@/src/features/events/api/hooks';
import { catalogKeys } from '@/src/features/catalog/api/hooks';
import { profileKeys } from '@/src/features/profile/api/hooks';

/**
 * Query Keys - Post feature için cache key pattern'leri
 */
export const postKeys = {
  all: ['posts'] as const,
  free: () => [...postKeys.all, 'free'] as const,
  boostOptions: () => [...postKeys.all, 'boostOptions'] as const,
  boostPrice: () => [...postKeys.all, 'boostPrice'] as const,
  experienceOptions: () => [...postKeys.all, 'experienceOptions'] as const,
  detail: (postId: string) => [...postKeys.all, 'detail', postId] as const,
  search: (q: string, cursor?: string, limit?: number) =>
    [...postKeys.all, 'search', q, cursor, limit] as const,
};

/**
 * Helper function to invalidate context-based feed queries
 */
const invalidateContextFeed = (
  queryClient: ReturnType<typeof useQueryClient>,
  contextType: ApiContextType,
  contextId: string
) => {
  // Invalidate context-specific feed queries
  switch (contextType) {
    case 'product':
      queryClient.invalidateQueries({
        queryKey: feedKeys.productFeed(contextId),
        refetchType: 'all',
      });
      break;
    case 'product_group':
      queryClient.invalidateQueries({
        queryKey: feedKeys.productGroupFeed(contextId),
        refetchType: 'all',
      });
      break;
    case 'sub_category':
      queryClient.invalidateQueries({
        queryKey: feedKeys.subCategoryFeed(contextId),
        refetchType: 'all',
      });
      break;
  }

  // Also invalidate general feed with context parameters
  queryClient.invalidateQueries({
    queryKey: feedKeys.feed(undefined, undefined, contextType, contextId),
    refetchType: 'all',
  });
};

/**
 * Merkezi post cache invalidasyon helper'ı.
 * Post oluşturma/silme/güncelleme sonrası tüm ilgili cache'leri invalidate eder.
 * refetchType: 'all' ile hem aktif hem inactive query'ler refetch edilir.
 */
export const invalidatePostRelatedCaches = (
  queryClient: ReturnType<typeof useQueryClient>,
  options?: {
    contextType?: ApiContextType;
    contextId?: string;
    eventId?: string;
  }
) => {
  const { contextType, contextId, eventId } = options || {};

  // 1. Ana feed (yeni/silinen post görünsün)
  queryClient.invalidateQueries({ queryKey: feedKeys.all, refetchType: 'all' });

  // 2. Post query'leri (post listesi güncellensin)
  queryClient.invalidateQueries({ queryKey: postKeys.all, refetchType: 'all' });

  // 3. TARGETED: Sadece profil post icerik tab'lari (trust, inventory, badges vs. dokunma)
  queryClient.invalidateQueries({ queryKey: profileKeys.posts(), refetchType: 'all' });
  queryClient.invalidateQueries({ queryKey: profileKeys.reviews(), refetchType: 'all' });
  queryClient.invalidateQueries({ queryKey: profileKeys.benchmarks(), refetchType: 'all' });
  queryClient.invalidateQueries({ queryKey: profileKeys.tips(), refetchType: 'all' });
  queryClient.invalidateQueries({ queryKey: profileKeys.replies(), refetchType: 'all' });

  // 4. Context-specific feed ve catalog posts
  if (contextType && contextId) {
    invalidateContextFeed(queryClient, contextType, contextId);
    invalidateCatalogPosts(queryClient, contextType, contextId);
  }

  // 5. Event cache'leri
  if (eventId) {
    queryClient.invalidateQueries({
      queryKey: ['events', 'posts', eventId],
      refetchType: 'all',
    });
    queryClient.invalidateQueries({
      queryKey: eventsKeys.detail(eventId),
      refetchType: 'all',
    });
    queryClient.invalidateQueries({
      queryKey: eventsKeys.active(),
      refetchType: 'all',
    });
  }
};

/**
 * Helper function to invalidate catalog posts queries
 * Catalog posts (subCategoryPosts, productGroupPosts, catalogProductPosts) için invalidate eder
 * 
 * Tüm filter ve sort kombinasyonlarını invalidate eder çünkü query key'lerde filter ve sort parametreleri var
 */
export const invalidateCatalogPosts = (
  queryClient: ReturnType<typeof useQueryClient>,
  contextType: ApiContextType,
  contextId: string
) => {
  switch (contextType) {
    case 'product':
      // Invalidate catalog product posts - tüm filter/sort kombinasyonlarını invalidate et
      // Query key format: ['catalog', 'catalogProductPosts', productId, filter, sort, cursor, limit]
      queryClient.invalidateQueries({ 
        queryKey: ['catalog', 'catalogProductPosts', contextId],
        exact: false
      });
      // Also invalidate product posts (/products/:productId/posts) - used in BrandProductDetailScreen
      queryClient.invalidateQueries({ 
        queryKey: catalogKeys.productPosts(contextId),
        exact: false
      });
      break;
    case 'product_group':
      // Invalidate product group posts - tüm filter/sort kombinasyonlarını invalidate et
      // Query key format: ['catalog', 'productGroupPosts', productGroupId, filter, sort, cursor, limit]
      queryClient.invalidateQueries({ 
        queryKey: ['catalog', 'productGroupPosts', contextId],
        exact: false
      });
      break;
    case 'sub_category':
      // Invalidate sub category posts - tüm filter/sort kombinasyonlarını invalidate et
      // Query key format: ['catalog', 'subCategoryPosts', subCategoryId, filter, sort, cursor, limit]
      queryClient.invalidateQueries({ 
        queryKey: ['catalog', 'subCategoryPosts', contextId],
        exact: false
      });
      break;
  }
  
  if (__DEV__) {
    console.log('[invalidateCatalogPosts] ✅ Invalidated catalog posts:', {
      contextType,
      contextId,
    });
  }
};

/**
 * Create Free Post mutation hook
 * Serbest gönderi oluşturmak için mutation hook
 *
 * @example
 * const createPost = useCreateFreePost();
 * createPost.mutate({
 *   contextType: 'sub_category',
 *   contextId: '123',
 *   description: 'Post description',
 *   images: ['uri1', 'uri2']
 * });
 */
export const useCreateFreePost = () => {
  const queryClient = useQueryClient();

  return useMutation<CreatePostResponse, Error, CreatePostRequest>({
    mutationFn: createFreePost,
    onSuccess: (_, variables) => {
      invalidatePostRelatedCaches(queryClient, {
        contextType: variables.contextType,
        contextId: variables.contextId,
        eventId: variables.eventId,
      });
    },
  });
};

/**
 * Create Benchmark Post mutation hook
 * Benchmark (karşılaştırma) gönderisi oluşturmak için mutation hook
 *
 * @example
 * const createPost = useCreateBenchmarkPost();
 * createPost.mutate({
 *   contextType: 'product',
 *   contextId: '123',
 *   description: 'Post description',
 *   products: [
 *     { productId: 'product1', isSelected: true },
 *     { productId: 'product2', isSelected: false }
 *   ],
 *   images: ['uri1', 'uri2']
 * });
 */
export const useCreateBenchmarkPost = () => {
  const queryClient = useQueryClient();

  return useMutation<CreatePostResponse, Error, CreateBenchmarkPostRequest>({
    mutationFn: createBenchmarkPost,
    onSuccess: (_, variables) => {
      invalidatePostRelatedCaches(queryClient, {
        contextType: variables.contextType,
        contextId: variables.contextId,
      });
    },
  });
};

/**
 * Create Tips & Tricks Post mutation hook
 */
export const useCreateTipsAndTricksPost = () => {
  const queryClient = useQueryClient();

  return useMutation<CreatePostResponse, Error, CreateTipsAndTricksPostRequest>({
    mutationFn: createTipsAndTricksPost,
    onSuccess: (_, variables) => {
      invalidatePostRelatedCaches(queryClient, {
        contextType: variables.contextType,
        contextId: variables.contextId,
      });
    },
  });
};

/**
 * Create Question Post mutation hook
 */
export const useCreateQuestionPost = () => {
  const queryClient = useQueryClient();

  return useMutation<CreatePostResponse, Error, CreateQuestionPostRequest>({
    mutationFn: createQuestionPost,
    onSuccess: (_, variables) => {
      invalidatePostRelatedCaches(queryClient, {
        contextType: variables.contextType,
        contextId: variables.contextId,
      });
    },
  });
};

/**
 * Create Update Post mutation hook
 */
export const useCreateUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation<CreatePostResponse, Error, CreateUpdatePostRequest>({
    mutationFn: createUpdatePost,
    onSuccess: (_, variables) => {
      invalidatePostRelatedCaches(queryClient, {
        contextType: variables.contextType,
        contextId: variables.contextId,
      });
    },
  });
};

/**
 * Get Boost Options query hook
 * Question post için kullanılabilir boost option'ları getirir
 * 
 * @example
 * const { data, isLoading, error } = useBoostOptions();
 */
export const useBoostOptions = () => {
  return useQuery<BoostOption[], Error>({
    queryKey: postKeys.boostOptions(),
    queryFn: getBoostOptions,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get Boost Price query hook
 * Dinamik boost fiyatını getirir (platform aktivitesine göre)
 *
 * @example
 * const { data: boostPrice, isLoading } = useBoostPrice();
 */
export const useBoostPrice = () => {
  return useQuery<GetBoostPriceResponse, Error>({
    queryKey: postKeys.boostPrice(),
    queryFn: getBoostPrice,
    staleTime: 1000 * 60 * 5, // 5 dakika - fiyat dinamik, sık güncellenir
    refetchInterval: 1000 * 60 * 5, // Her 5 dakikada bir yeniden getir
  });
};

/**
 * Get Experience Options query hook
 * Duration, Location ve Purpose seçeneklerini getirir
 *
 * @example
 * const { data: options, isLoading } = useGetExperienceOptions();
 */
export const useGetExperienceOptions = () => {
  return useQuery<ExperienceOptionsResponse, Error>({
    queryKey: postKeys.experienceOptions(),
    queryFn: getExperienceOptions,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat
    gcTime: 4 * 60 * 60 * 1000, // 4 saat
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Split Experience mutation hook
 * Gemini AI ile deneyim metnini kategorilere ayırır
 * 
 * @example
 * const splitMutation = useSplitExperience();
 * splitMutation.mutate({
 *   productId: 'product-123',
 *   content: 'Bu ürünü aldım, çok memnun kaldım...'
 * });
 */
export const useSplitExperience = () => {
  return useMutation<SplitExperienceResponse, Error, SplitExperienceRequest>({
    mutationFn: splitExperience,
  });
};

/**
 * Create Experience Post mutation hook
 */
export const useCreateExperiencePost = () => {
  const queryClient = useQueryClient();

  return useMutation<CreatePostResponse, Error, CreateExperiencePostRequest>({
    mutationFn: createExperiencePost,
    onSuccess: (_, variables) => {
      invalidatePostRelatedCaches(queryClient, {
        contextType: variables.contextType,
        contextId: variables.contextId,
      });
    },
  });
};

/**
 * Get Post Detail query hook
 * Post detayını getirir (notification'dan gelen sadece ID içeren postData için)
 * 
 * @param postId - Post ID'si
 * @param enabled - Query'nin aktif olup olmadığı (default: true)
 * @param forceRefresh - Her zaman en güncel veriyi fetch et (notification'dan geldiğinde true)
 * 
 * @example
 * const { data: postDetail, isLoading } = usePostDetail('post-123');
 * // Notification'dan geldiğinde:
 * const { data: postDetail, isLoading } = usePostDetail('post-123', true, true);
 */
export const usePostDetail = (
  postId: string | undefined,
  enabled: boolean = true,
  forceRefresh: boolean = false
) => {
  return useQuery<PostDetailResponse, Error>({
    queryKey: postKeys.detail(postId || ''),
    queryFn: () => getPostDetail(postId!),
    enabled: enabled && !!postId,
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    // Force refresh ise cache kullanma (notification'dan geldiğinde)
    staleTime: forceRefresh ? 0 : 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: forceRefresh ? 'always' : false, // Force refresh ise her zaman refetch et
    refetchOnWindowFocus: forceRefresh, // Force refresh ise focus'ta da refetch et
    retry: 1,
  });
};

/**
 * Search Posts infinite query hook
 * Post başlığı veya içeriğinde arama yapar
 *
 * @param q - Arama terimi (required)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSearchPosts('review', 20);
 */
export const useSearchPosts = (q: string, limit: number = 20) => {
  const hasSearchQuery = !!q && q.trim().length > 0;
  
  return useInfiniteQuery<SearchPostsResponse, Error>({
    queryKey: postKeys.search(q, undefined, limit),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return searchPosts(q, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore || lastPage.items.length === 0) {
        return undefined;
      }
      return lastPage.pagination.cursor;
    },
    enabled: hasSearchQuery,
    staleTime: 0, // Search için cache yok, her zaman fresh data
    gcTime: 0, // Search için cache yok
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 0, // Search için retry yok (hızlı hata göster)
  });
};

/**
 * Update Post mutation hook
 * Post'u güncellemek için mutation hook
 *
 * @example
 * const updatePostMutation = useUpdatePost();
 * updatePostMutation.mutate({
 *   postId: 'post-123',
 *   data: {
 *     content: 'Updated content',
 *     images: ['uri1', 'uri2']
 *   }
 * });
 */
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdatePostResponse, Error, { postId: string; data: UpdatePostRequest }>({
    mutationFn: ({ postId, data }) => updatePost(postId, data),
    onSuccess: (_, variables) => {
      // Post detail'i ayrıca invalidate et
      queryClient.invalidateQueries({
        queryKey: postKeys.detail(variables.postId),
        refetchType: 'all',
      });
      // Tüm post-related cache'leri invalidate et
      invalidatePostRelatedCaches(queryClient);
      // Catalog posts'ları da invalidate et (context bilgisi olmadan tümünü)
      queryClient.invalidateQueries({ queryKey: catalogKeys.all, refetchType: 'all' });
    },
  });
};

/**
 * Delete Post mutation hook
 * Post'u silmek için mutation hook
 *
 * @example
 * const deletePostMutation = useDeletePost();
 * deletePostMutation.mutate('post-123');
 */
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation<DeletePostResponse, Error, string>({
    mutationFn: async (postId) => {
      try {
        return await deletePost(postId);
      } catch (error: any) {
        // 404 = post zaten silinmiş, başarılı kabul et
        if (error?.response?.status === 404) {
          return { success: true, message: 'Post already deleted' };
        }
        throw error;
      }
    },
    retry: false,
    onSuccess: (_, postId) => {
      // Post detail'i ayrıca invalidate et
      queryClient.invalidateQueries({
        queryKey: postKeys.detail(postId),
        refetchType: 'all',
      });
      // Tüm post-related cache'leri invalidate et
      invalidatePostRelatedCaches(queryClient);
      // Event ve catalog cache'lerini de invalidate et (context bilgisi olmadan tümünü)
      queryClient.invalidateQueries({
        queryKey: eventsKeys.all,
        refetchType: 'all',
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.all,
        refetchType: 'all',
      });
    },
  });
};

/**
 * Toggle Post Boost mutation hook
 * Question post için boost'u açar/kapatır
 *
 * @example
 * const toggleBoostMutation = useTogglePostBoost();
 * toggleBoostMutation.mutate({
 *   postId: 'post-123',
 *   enabled: true
 * });
 */
export const useTogglePostBoost = () => {
  const queryClient = useQueryClient();

  return useMutation<ToggleBoostResponse, Error, ToggleBoostRequest>({
    mutationFn: (data) => togglePostBoost(data),
    onSuccess: (data, variables) => {
      console.log('[useTogglePostBoost] ✅ Boost toggled successfully:', {
        postId: variables.postId,
        isBoosted: data.isBoosted,
        boostPrice: data.boostPrice,
      });

      // Post detail'i ayrıca invalidate et
      queryClient.invalidateQueries({
        queryKey: postKeys.detail(variables.postId),
        refetchType: 'all',
      });
      // Tüm post-related cache'leri invalidate et
      invalidatePostRelatedCaches(queryClient);
      // Catalog posts'ları da invalidate et (context bilgisi olmadan tümünü)
      queryClient.invalidateQueries({ queryKey: catalogKeys.all, refetchType: 'all' });
    },
    onError: (error: any) => {
      console.error('[useTogglePostBoost] ❌ Failed to toggle boost:', {
        error: error.message,
        response: error.response?.data,
      });
    },
  });
};

