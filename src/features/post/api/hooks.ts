import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  createFreePost, 
  createBenchmarkPost,
  createTipsAndTricksPost,
  createQuestionPost,
  createUpdatePost,
  createExperiencePost,
  splitExperience,
  getBoostOptions,
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

/**
 * Query Keys - Post feature için cache key pattern'leri
 */
export const postKeys = {
  all: ['posts'] as const,
  free: () => [...postKeys.all, 'free'] as const,
  boostOptions: () => [...postKeys.all, 'boostOptions'] as const,
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
  
  return useMutation<CreatePostResponse, Error, CreatePostRequest>({
    mutationFn: createFreePost,
    onSuccess: (data, variables) => {
      // Context-based feed'i invalidate et
      invalidateContextFeed(queryClient, variables.contextType, variables.contextId);
      
      // Ana feed'i invalidate et ki yeni post görünsün
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      // Post listesini de invalidate et
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      // Profil feed'lerini de invalidate et (kullanıcı kendi gönderisini görebilsin)
      queryClient.invalidateQueries({ queryKey: ['profile'] });
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
    onSuccess: (data, variables) => {
      // Context-based feed'i invalidate et
      invalidateContextFeed(queryClient, variables.contextType, variables.contextId);
      
      // Ana feed'i invalidate et ki yeni post görünsün
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      // Post listesini de invalidate et
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      // Profil feed'lerini de invalidate et (kullanıcı kendi gönderisini görebilsin)
      queryClient.invalidateQueries({ queryKey: ['profile'] });
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
    onSuccess: (data, variables) => {
      // Context-based feed'i invalidate et
      invalidateContextFeed(queryClient, variables.contextType, variables.contextId);
      
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
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
    onSuccess: (data, variables) => {
      // Context-based feed'i invalidate et
      invalidateContextFeed(queryClient, variables.contextType, variables.contextId);
      
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
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
    onSuccess: (data, variables) => {
      // Context-based feed'i invalidate et
      invalidateContextFeed(queryClient, variables.contextType, variables.contextId);
      
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
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
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    gcTime: 10 * 60 * 1000, // 10 dakika garbage collection
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
    onSuccess: (data, variables) => {
      // Context-based feed'i invalidate et
      invalidateContextFeed(queryClient, variables.contextType, variables.contextId);
      
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

