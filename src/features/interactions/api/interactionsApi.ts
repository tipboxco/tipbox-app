import { apiService } from '@/src/services/ApiService';
import type {
  PostInteractionStatus,
  Comment,
  CommentsResponse,
  Bookmark,
  BookmarksResponse,
  ShareRequest,
  ShareResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
  ApiResponse,
} from '../types';

/**
 * Like Post endpoint function
 * Post'u beğenir
 *
 * @param postId - Beğenilecek post'un ID'si
 * @returns ApiResponse<void>
 */
export const likePost = async (postId: string): Promise<ApiResponse<void>> => {
  const client = apiService.getClient();
  const response = await client.post<ApiResponse<void>>(
    `/interactions/posts/${postId}/like`
  );
  return response.data;
};

/**
 * Unlike Post endpoint function
 * Post beğenisini geri alır
 *
 * @param postId - Beğenisi geri alınacak post'un ID'si
 * @returns ApiResponse<void>
 */
export const unlikePost = async (postId: string): Promise<ApiResponse<void>> => {
  const client = apiService.getClient();
  const response = await client.delete<ApiResponse<void>>(
    `/interactions/posts/${postId}/like`
  );
  return response.data;
};

/**
 * Bookmark Post endpoint function
 * Post'u favorilere ekler
 *
 * @param postId - Favorilere eklenecek post'un ID'si
 * @returns ApiResponse<Bookmark>
 */
export const bookmarkPost = async (postId: string): Promise<ApiResponse<Bookmark>> => {
  const client = apiService.getClient();
  const response = await client.post<ApiResponse<Bookmark>>(
    `/interactions/posts/${postId}/bookmark`
  );
  return response.data;
};

/**
 * Unbookmark Post endpoint function
 * Post'u favorilerden çıkarır
 *
 * @param postId - Favorilerden çıkarılacak post'un ID'si
 * @returns ApiResponse<void>
 */
export const unbookmarkPost = async (postId: string): Promise<ApiResponse<void>> => {
  const client = apiService.getClient();
  const response = await client.delete<ApiResponse<void>>(
    `/interactions/posts/${postId}/bookmark`
  );
  return response.data;
};

/**
 * Get Bookmarks endpoint function
 * Kullanıcının favorilerini getirir
 *
 * @param limit - Sayfa başına kayıt sayısı (default: 50, max: 100)
 * @returns BookmarksResponse
 */
export const getBookmarks = async (limit: number = 50): Promise<BookmarksResponse> => {
  const client = apiService.getClient();
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  
  const response = await client.get<BookmarksResponse>(
    `/interactions/bookmarks?${params.toString()}`
  );
  return response.data;
};

/**
 * Create Comment endpoint function
 * Post'a yorum yapar
 *
 * @param postId - Yorum yapılacak post'un ID'si
 * @param comment - Yorum metni
 * @param parentId - Opsiyonel: Reply yapılıyorsa parent comment ID'si
 * @returns ApiResponse<Comment>
 */
export const createComment = async (
  postId: string,
  comment: string,
  parentId?: string
): Promise<ApiResponse<Comment>> => {
  const client = apiService.getClient();
  const body: CreateCommentRequest = {
    comment,
    ...(parentId && { parentId }),
  };
  
  const response = await client.post<ApiResponse<Comment>>(
    `/interactions/posts/${postId}/comments`,
    body
  );
  return response.data;
};

/**
 * Get Comments endpoint function
 * Post'un yorumlarını getirir
 *
 * @param postId - Yorumları getirilecek post'un ID'si
 * @param limit - Sayfa başına kayıt sayısı (default: 50, max: 100)
 * @returns ApiResponse<CommentsResponse>
 */
export const getComments = async (
  postId: string,
  limit: number = 50
): Promise<ApiResponse<CommentsResponse>> => {
  const client = apiService.getClient();
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  
  const response = await client.get<ApiResponse<CommentsResponse>>(
    `/interactions/posts/${postId}/comments?${params.toString()}`
  );
  return response.data;
};

/**
 * Update Comment endpoint function
 * Yorumu günceller
 *
 * @param commentId - Güncellenecek yorumun ID'si
 * @param comment - Yeni yorum metni
 * @returns ApiResponse<Comment>
 */
export const updateComment = async (
  commentId: string,
  comment: string
): Promise<ApiResponse<Comment>> => {
  const client = apiService.getClient();
  const body: UpdateCommentRequest = {
    comment,
  };
  
  const response = await client.put<ApiResponse<Comment>>(
    `/interactions/comments/${commentId}`,
    body
  );
  return response.data;
};

/**
 * Delete Comment endpoint function
 * Yorumu siler
 *
 * @param commentId - Silinecek yorumun ID'si
 * @returns ApiResponse<void>
 */
export const deleteComment = async (commentId: string): Promise<ApiResponse<void>> => {
  const client = apiService.getClient();
  const response = await client.delete<ApiResponse<void>>(
    `/interactions/comments/${commentId}`
  );
  return response.data;
};

/**
 * Like Comment endpoint function
 * Yorumu beğenir
 *
 * @param commentId - Beğenilecek yorumun ID'si
 * @returns ApiResponse<void>
 */
export const likeComment = async (commentId: string): Promise<ApiResponse<void>> => {
  const client = apiService.getClient();
  const response = await client.post<ApiResponse<void>>(
    `/interactions/comments/${commentId}/like`
  );
  return response.data;
};

/**
 * Unlike Comment endpoint function
 * Yorum beğenisini geri alır
 *
 * @param commentId - Beğenisi geri alınacak yorumun ID'si
 * @returns ApiResponse<void>
 */
export const unlikeComment = async (commentId: string): Promise<ApiResponse<void>> => {
  const client = apiService.getClient();
  const response = await client.delete<ApiResponse<void>>(
    `/interactions/comments/${commentId}/like`
  );
  return response.data;
};

/**
 * Share Post endpoint function
 * Post'u paylaşır
 *
 * @param postId - Paylaşılacak post'un ID'si
 * @param shareType - Paylaşım tipi (INTERNAL_REPOST veya EXTERNAL_SHARE)
 * @param platform - Opsiyonel: EXTERNAL_SHARE için platform adı
 * @returns ApiResponse<ShareResponse>
 */
export const sharePost = async (
  postId: string,
  shareType: 'INTERNAL_REPOST' | 'EXTERNAL_SHARE',
  platform?: string
): Promise<ApiResponse<ShareResponse>> => {
  const client = apiService.getClient();
  const body: ShareRequest = {
    shareType,
    ...(platform && { platform }),
  };
  
  const response = await client.post<ApiResponse<ShareResponse>>(
    `/interactions/posts/${postId}/share`,
    body
  );
  return response.data;
};

/**
 * Share Post to DM endpoint function
 * POST /interactions/posts/{postId}/share-to-dm
 */
export const sharePostToDm = async (
  postId: string,
  toUserId: string,
  message?: string
): Promise<{ messageId: string; threadId: string }> => {
  const client = apiService.getClient();
  const response = await client.post<{ messageId: string; threadId: string }>(
    `/interactions/posts/${postId}/share-to-dm`,
    { toUserId, ...(message && { message }) }
  );
  return response.data;
};

/**
 * Get Post Status endpoint function
 * Kullanıcının post ile etkileşim durumunu getirir
 *
 * @param postId - Durumu kontrol edilecek post'un ID'si
 * @returns ApiResponse<PostInteractionStatus>
 */
export const getPostStatus = async (
  postId: string
): Promise<ApiResponse<PostInteractionStatus>> => {
  const client = apiService.getClient();
  const response = await client.get<ApiResponse<PostInteractionStatus>>(
    `/interactions/posts/${postId}/status`
  );
  return response.data;
};

