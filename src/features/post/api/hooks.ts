import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFreePost } from './postApi';
import type { CreatePostRequest, CreatePostResponse } from '../types';

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
      // Feed'i invalidate et ki yeni post görünsün
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      // Post listesini de invalidate et
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
};

