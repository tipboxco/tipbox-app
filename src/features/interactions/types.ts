/**
 * Interactions Feature - Type Definitions
 * Post etkileşimleri (like, bookmark, comment, share) için type definitions
 */

/**
 * Post Interaction Status
 * Kullanıcının bir post ile etkileşim durumu
 */
export interface PostInteractionStatus {
  liked: boolean;      // Kullanıcı post'u beğenmiş mi?
  favorited: boolean;  // Kullanıcı post'u favorilere eklemiş mi?
  shared: boolean;     // Kullanıcı post'u paylaşmış mı?
  upvoted?: boolean;   // Kullanıcı post'a upvote vermiş mi? (event posts için)
}

/**
 * Comment User
 * Yorum yapan kullanıcı bilgisi
 */
export interface CommentUser {
  id: string;
  name: string | null;
  avatar: string | null;
}

/**
 * Comment
 * Tek bir yorum objesi
 */
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  comment: string;
  isAnswer: boolean;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Comment with User
 * Kullanıcı bilgisi ile birlikte yorum
 */
export interface CommentWithUser extends Comment {
  user: CommentUser;
}

/**
 * Comment with Replies
 * Reply'lerle birlikte yorum (GET /interactions/posts/:postId/comments response formatı)
 */
export interface CommentWithReplies {
  comment: Comment;
  replies: Comment[];
  user: CommentUser;
}

/**
 * Comments Response
 * GET /interactions/posts/:postId/comments endpoint response
 */
export interface CommentsResponse {
  comments: CommentWithReplies[];
}

/**
 * Bookmark
 * Favorilere eklenmiş post bilgisi
 */
export interface Bookmark {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Bookmarks Response
 * GET /interactions/bookmarks endpoint response
 */
export interface BookmarksResponse {
  data: Bookmark[];
}

/**
 * Share Type
 * Paylaşım tipi
 */
export type ShareType = 'INTERNAL_REPOST' | 'EXTERNAL_SHARE';

/**
 * Share Request
 * POST /interactions/posts/:postId/share request body
 */
export interface ShareRequest {
  shareType: ShareType;
  platform?: string;  // EXTERNAL_SHARE için platform adı (örn: "Twitter", "Facebook")
}

/**
 * Share Response
 * POST /interactions/posts/:postId/share endpoint response
 */
export interface ShareResponse {
  id: string;
  userId: string;
  postId: string;
  shareType: ShareType;
  platform: string | null;
  createdAt: string;
}

/**
 * Create Comment Request
 * POST /interactions/posts/:postId/comments request body
 */
export interface CreateCommentRequest {
  comment: string;
  parentId?: string;  // Reply yapılıyorsa parent comment ID'si
}

/**
 * Update Comment Request
 * PUT /interactions/comments/:commentId request body
 */
export interface UpdateCommentRequest {
  comment: string;
}

/**
 * API Response Wrapper
 * Tüm API response'ları için genel wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

