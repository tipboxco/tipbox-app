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
  getPostDetail,
  searchPosts,
  type PostDetailResponse,
  type SearchPostsResponse,
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
import { profileKeys } from '@/src/features/profile/api/hooks';
import { useAppStore } from '@/src/store/appStore';

/**
 * Query Keys - Post feature için cache key pattern'leri
 */
export const postKeys = {
  all: ['posts'] as const,
  free: () => [...postKeys.all, 'free'] as const,
  boostOptions: () => [...postKeys.all, 'boostOptions'] as const,
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
        queryKey: feedKeys.productFeed(contextId) 
      });
      break;
    case 'product_group':
      queryClient.invalidateQueries({ 
        queryKey: feedKeys.productGroupFeed(contextId) 
      });
      break;
    case 'sub_category':
      queryClient.invalidateQueries({ 
        queryKey: feedKeys.subCategoryFeed(contextId) 
      });
      break;
  }
  
  // Also invalidate general feed with context parameters
  queryClient.invalidateQueries({ 
    queryKey: feedKeys.feed(undefined, undefined, contextType, contextId) 
  });
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
  const userId = useAppStore((state) => state.user?.id);
  
  return useMutation<CreatePostResponse, Error, CreatePostRequest>({
    mutationFn: createFreePost,
    onSuccess: (data, variables) => {
      // Context-based feed'i invalidate et
      invalidateContextFeed(queryClient, variables.contextType, variables.contextId);
      
      // Event ID varsa event posts'u da invalidate et (event'e bağlı post için)
      if (variables.eventId) {
        queryClient.invalidateQueries({ queryKey: eventsKeys.posts(variables.eventId) });
        queryClient.invalidateQueries({ queryKey: eventsKeys.detail(variables.eventId) });
        queryClient.invalidateQueries({ queryKey: eventsKeys.active() });
      }
      
      // Ana feed'i invalidate et ki yeni post görünsün
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      // Post listesini de invalidate et
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      
      // Profil feed'lerini invalidate et (kullanıcı kendi gönderisini görebilsin)
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Mevcut kullanıcının profil postlarını spesifik olarak invalidate et
      if (userId) {
        queryClient.invalidateQueries({ queryKey: profileKeys.userPosts(userId) });
        // Tüm limit varyasyonlarını da invalidate et
        queryClient.invalidateQueries({ 
          queryKey: ['profile', 'posts', userId],
          exact: false 
        });
      }
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
  const userId = useAppStore((state) => state.user?.id);
  
  return useMutation<CreatePostResponse, Error, CreateBenchmarkPostRequest>({
    mutationFn: createBenchmarkPost,
    onSuccess: (data, variables) => {
      // Context-based feed'i invalidate et
      invalidateContextFeed(queryClient, variables.contextType, variables.contextId);
      
      // Ana feed'i invalidate et ki yeni post görünsün
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      // Post listesini de invalidate et
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      
      // Profil feed'lerini invalidate et (kullanıcı kendi gönderisini görebilsin)
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Mevcut kullanıcının profil postlarını spesifik olarak invalidate et
      if (userId) {
        queryClient.invalidateQueries({ queryKey: profileKeys.userPosts(userId) });
        queryClient.invalidateQueries({ 
          queryKey: ['profile', 'posts', userId],
          exact: false 
        });
      }
    },
  });
};

/**
 * Create Tips & Tricks Post mutation hook
 */
export const useCreateTipsAndTricksPost = () => {
  const queryClient = useQueryClient();
  const userId = useAppStore((state) => state.user?.id);
  
  return useMutation<CreatePostResponse, Error, CreateTipsAndTricksPostRequest>({
    mutationFn: createTipsAndTricksPost,
    onSuccess: (data, variables) => {
      // Context-based feed'i invalidate et
      invalidateContextFeed(queryClient, variables.contextType, variables.contextId);
      
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Mevcut kullanıcının profil postlarını spesifik olarak invalidate et
      if (userId) {
        queryClient.invalidateQueries({ queryKey: profileKeys.userPosts(userId) });
        queryClient.invalidateQueries({ 
          queryKey: ['profile', 'posts', userId],
          exact: false 
        });
      }
    },
  });
};

/**
 * Create Question Post mutation hook
 */
export const useCreateQuestionPost = () => {
  const queryClient = useQueryClient();
  const userId = useAppStore((state) => state.user?.id);
  
  return useMutation<CreatePostResponse, Error, CreateQuestionPostRequest>({
    mutationFn: createQuestionPost,
    onSuccess: (data, variables) => {
      // Context-based feed'i invalidate et
      invalidateContextFeed(queryClient, variables.contextType, variables.contextId);
      
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Mevcut kullanıcının profil postlarını spesifik olarak invalidate et
      if (userId) {
        queryClient.invalidateQueries({ queryKey: profileKeys.userPosts(userId) });
        queryClient.invalidateQueries({ 
          queryKey: ['profile', 'posts', userId],
          exact: false 
        });
      }
    },
  });
};

/**
 * Create Update Post mutation hook
 */
export const useCreateUpdatePost = () => {
  const queryClient = useQueryClient();
  const userId = useAppStore((state) => state.user?.id);
  
  return useMutation<CreatePostResponse, Error, CreateUpdatePostRequest>({
    mutationFn: createUpdatePost,
    onSuccess: (data, variables) => {
      // Context-based feed'i invalidate et
      invalidateContextFeed(queryClient, variables.contextType, variables.contextId);
      
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Mevcut kullanıcının profil postlarını spesifik olarak invalidate et
      if (userId) {
        queryClient.invalidateQueries({ queryKey: profileKeys.userPosts(userId) });
        queryClient.invalidateQueries({ 
          queryKey: ['profile', 'posts', userId],
          exact: false 
        });
      }
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
  const userId = useAppStore((state) => state.user?.id);
  
  return useMutation<CreatePostResponse, Error, CreateExperiencePostRequest>({
    mutationFn: createExperiencePost,
    onSuccess: (data, variables) => {
      // Context-based feed'i invalidate et
      invalidateContextFeed(queryClient, variables.contextType, variables.contextId);
      
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Mevcut kullanıcının profil postlarını spesifik olarak invalidate et
      if (userId) {
        queryClient.invalidateQueries({ queryKey: profileKeys.userPosts(userId) });
        queryClient.invalidateQueries({ 
          queryKey: ['profile', 'posts', userId],
          exact: false 
        });
      }
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

