import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createFreePost, 
  createBenchmarkPost,
  createTipsAndTricksPost,
  createQuestionPost,
  createUpdatePost,
  createExperiencePost,
} from './postApi';
import type { CreatePostRequest, CreatePostResponse } from '../types';
import type { 
  CreateBenchmarkPostRequest,
  CreateTipsAndTricksPostRequest,
  CreateQuestionPostRequest,
  CreateUpdatePostRequest,
  CreateExperiencePostRequest,
} from './postApi';
import { feedKeys } from '@/src/features/feed/api/hooks';

/**
 * Query Keys - Post feature için cache key pattern'leri
 */
export const postKeys = {
  all: ['posts'] as const,
  free: () => [...postKeys.all, 'free'] as const,
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
    onSuccess: () => {
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
    onSuccess: () => {
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
    onSuccess: () => {
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
    onSuccess: () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

/**
 * Create Experience Post mutation hook
 */
export const useCreateExperiencePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation<CreatePostResponse, Error, CreateExperiencePostRequest>({
    mutationFn: createExperiencePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

