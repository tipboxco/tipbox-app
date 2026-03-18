import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActivityIndicator, Pressable, FlatList, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, VStack, HStack, Text, Image, Box, Input, InputField } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { NewsStackParamList } from '../NewsNavigator';
import { Header } from '@/src/components/Header';
import { BookOpenIcon, HeartIcon, ShareIcon, ChevronLeftIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon } from 'react-native-heroicons/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon, BookmarkIcon as BookmarkSolidIcon } from 'react-native-heroicons/solid';
import { toImageSource, formatRelativeTime } from '@/src/utils';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import {
  useNewsDetail,
  useBrandProductNewsDetail,
  useLikeNews,
  useUnlikeNews,
  useFavoriteNews,
  useUnfavoriteNews,
  useShareNews,
  useBrandProductNewsComments,
  useCreateBrandProductNewsComment,
} from '../api/hooks';
import type { NewsComment } from '../types';
import { useDeleteComment, useLikeComment, useUnlikeComment, useUpdateComment } from '@/src/features/interactions/api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { TrashIcon } from 'react-native-heroicons/outline';
import { useQueryClient } from '@tanstack/react-query';
import { catalogKeys } from '../api/hooks';
import CommentsCard from '@/src/components/CommentsCard';
import { useTranslation } from '@/src/hooks/useTranslation';

type NewsDetailScreenNavigationProp = NativeStackNavigationProp<NewsStackParamList, 'NewsDetailScreen'>;
type NewsDetailScreenRouteProp = RouteProp<NewsStackParamList, 'NewsDetailScreen'>;

const NewsDetailScreenComponent: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NewsDetailScreenNavigationProp>();
  const route = useRoute<NewsDetailScreenRouteProp>();
  const { t } = useTranslation('catalog');

  const { newsId, brandId, productId } = route.params;
  
  // Actions bar height
  const actionsBarHeight = 56;

  // API hook - brandId ve productId varsa brand product news detail, yoksa normal news detail
  const newsDetailQuery = brandId && productId
    ? useBrandProductNewsDetail(brandId, productId, newsId)
    : useNewsDetail(newsId);
  
  const { data: newsDetail, isLoading, error } = newsDetailQuery;

  // Interaction state
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);

  // Sync with newsDetail
  useEffect(() => {
    if (newsDetail) {
      setIsLiked(newsDetail.isLiked || false);
      setIsFavorited(newsDetail.isFavorited || false);
      setIsShared(newsDetail.isShared || false);
      setLikesCount(newsDetail.likesCount || 0);
      setCommentsCount(newsDetail.commentsCount || 0);
      setSharesCount(newsDetail.sharesCount || 0);
      setFavoritesCount(newsDetail.favoritesCount || 0);
      setViewsCount(newsDetail.viewsCount || 0);
    }
  }, [newsDetail]);

  // Mutation hooks
  const likeNewsMutation = useLikeNews();
  const unlikeNewsMutation = useUnlikeNews();
  const favoriteNewsMutation = useFavoriteNews();
  const unfavoriteNewsMutation = useUnfavoriteNews();
  const shareNewsMutation = useShareNews();
  
  // Comments query - sadece brand product news comments kullanılıyor
  // enabled: false yaparak sadece bottom sheet açıldığında fetch edilmesini sağlıyoruz
  const commentsQuery = useBrandProductNewsComments(brandId, productId, newsId);
  const { data: commentsData, isLoading: isLoadingComments } = commentsQuery;
  const comments = commentsData?.data || [];
  
  // Create comment mutation - sadece brand product news comments kullanılıyor
  const createBrandProductNewsCommentMutation = useCreateBrandProductNewsComment();
  
  // Bottom sheet
  const { openBottomSheet } = useGlobalBottomSheet();

  // Handlers - memoized
  const handleLike = useCallback(() => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
      unlikeNewsMutation.mutate({ newsId, brandId, productId });
    } else {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
      likeNewsMutation.mutate({ newsId, brandId, productId });
    }
  }, [isLiked, newsId, brandId, productId, likeNewsMutation, unlikeNewsMutation]);

  const handleFavorite = useCallback(() => {
    if (isFavorited) {
      setIsFavorited(false);
      setFavoritesCount(prev => Math.max(0, prev - 1));
      unfavoriteNewsMutation.mutate({ newsId, brandId, productId });
    } else {
      setIsFavorited(true);
      setFavoritesCount(prev => prev + 1);
      favoriteNewsMutation.mutate({ newsId, brandId, productId });
    }
  }, [isFavorited, newsId, brandId, productId, favoriteNewsMutation, unfavoriteNewsMutation]);

  const handleShare = useCallback(() => {
    if (isShared) return;
    setIsShared(true);
    setSharesCount(prev => prev + 1);
    shareNewsMutation.mutate({ 
      newsId, 
      request: { shareType: 'INTERNAL_REPOST' },
      brandId,
      productId,
    });
  }, [isShared, newsId, brandId, productId, shareNewsMutation]);
  
  const handleCommentSubmit = useCallback((comment: string) => {
    if (!comment.trim() || !brandId || !productId) return;
    
    if (createBrandProductNewsCommentMutation.isPending) return;
    createBrandProductNewsCommentMutation.mutate(
      {
        brandId,
        productId,
        newsId,
        request: { comment: comment.trim() },
      },
      {
        onSuccess: () => {
          Keyboard.dismiss();
          // Comments count'u güncelle
          setCommentsCount(prev => prev + 1);
        },
      }
    );
  }, [newsId, brandId, productId, createBrandProductNewsCommentMutation]);
  
  const handleComment = useCallback(() => {
    if (!brandId || !productId) return; // Brand product news için gerekli
    
    openBottomSheet(
      <NewsCommentsBottomSheet
        newsId={newsId}
        brandId={brandId}
        productId={productId}
        comments={comments}
        isLoadingComments={isLoadingComments}
        onCommentSubmit={handleCommentSubmit}
        isSubmitting={createBrandProductNewsCommentMutation.isPending}
      />,
      {
        snapPoints: ['75%', '90%'],
        enablePanDownToClose: true,
        backdropPressBehavior: 'close',
        onClose: () => {
          // Bottom sheet kapandığında klavyeyi hemen kapat
          Keyboard.dismiss();
        },
      }
    );
  }, [newsId, brandId, productId, comments, isLoadingComments, openBottomSheet, handleCommentSubmit, createBrandProductNewsCommentMutation.isPending]);

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      {/* Header - Fixed at top */}
      <Header
        title={t('newsDetail.title')}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      {/* Scrollable Content: Banner + Source/Date + Title + Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: actionsBarHeight + 16,
        }}
      >
        {isLoading ? (
          <VStack alignItems="center" py="$8" flex={1} justifyContent="center">
            <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            <Text mt="$4" fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
              {t('newsDetail.loading')}
            </Text>
          </VStack>
        ) : error ? (
          <VStack alignItems="center" py="$8" flex={1} justifyContent="center">
            <Text fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
              {t('newsDetail.error')}
            </Text>
          </VStack>
        ) : newsDetail ? (
          <VStack>
            {/* News Banner Image - Full width */}
            <Image
              source={
                (newsDetail.banner || newsDetail.image)
                  ? toImageSource(newsDetail.banner || newsDetail.image)
                  : require('@/assets/defaultImages/default-banner.png')
              }
              alt={newsDetail.title}
              style={{
                width: '100%',
                height: 250,
              }}
              resizeMode="cover"
            />

            {/* Source and Date */}
            <Box px="$4" pt="$2" pb="$2">
              <HStack alignItems="center" space="xs">
                <BookOpenIcon width={12} height={12} color="#B9B9B9" />
                <Text
                  color="#B9B9B9"
                  fontSize={11}
                  fontWeight="$medium"
                >
                  {newsDetail.source} - {newsDetail.date}
                </Text>
              </HStack>
            </Box>

            {/* Title + Content */}
            <VStack space="md" px="$4" pb="$4">
              <Text
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={18}
                fontWeight="$bold"
                lineHeight={24}
              >
                {newsDetail.title}
              </Text>

              <Text
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={12}
                lineHeight={18}
                textAlign="justify"
              >
                {newsDetail.content}
              </Text>
            </VStack>
          </VStack>
        ) : null}
      </ScrollView>


      {/* Actions Bar - Fixed at bottom */}
      {newsDetail && (
        <Box
          height={actionsBarHeight}
          bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
          borderTopWidth={1}
          borderTopColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
          px="$4"
          justifyContent="center"
          pb={insets.bottom}
        >
          <HStack alignItems="center" justifyContent="space-between" width="100%">
            {/* Left Side: Like, Comment, Share */}
            <HStack alignItems="center" space="md">
              {/* Like Button */}
              <Pressable onPress={handleLike} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {isLiked ? (
                  <HeartSolidIcon size={24} color="#FF3B30" />
                ) : (
                  <HeartIcon size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                )}
                <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize="$sm" fontWeight="$medium">
                  {likesCount.toLocaleString()}
                </Text>
              </Pressable>

              {/* Comment Button */}
              <Pressable onPress={handleComment} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ChatBubbleLeftRightIcon size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize="$sm" fontWeight="$medium">
                  {commentsCount.toLocaleString()}
                </Text>
              </Pressable>

              {/* Share Button */}
              <Pressable onPress={handleShare} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ShareIcon size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize="$sm" fontWeight="$medium">
                  {sharesCount.toLocaleString()}
                </Text>
              </Pressable>
            </HStack>

            {/* Right Side: Favorite/Bookmark */}
            <Pressable onPress={handleFavorite} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {isFavorited ? (
                <BookmarkSolidIcon size={24} color="#FFD700" />
              ) : (
                <BookmarkIcon size={24} color={isDark ? '#FFFFFF' : '#000000'} />
              )}
              <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize="$sm" fontWeight="$medium">
                {favoritesCount.toLocaleString()}
              </Text>
            </Pressable>
          </HStack>
        </Box>
      )}
    </Box>
  );
};

const NewsDetailScreen = React.memo(NewsDetailScreenComponent);
NewsDetailScreen.displayName = 'NewsDetailScreen';

// News Comments Bottom Sheet Component
interface NewsCommentsBottomSheetProps {
  newsId: string;
  brandId?: string;
  productId?: string;
  comments: NewsComment[];
  isLoadingComments: boolean;
  onCommentSubmit: (comment: string) => void;
  isSubmitting: boolean;
}

const NewsCommentsBottomSheet: React.FC<NewsCommentsBottomSheetProps> = ({
  newsId,
  brandId,
  productId,
  comments,
  isLoadingComments,
  onCommentSubmit,
  isSubmitting,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();
  const [commentText, setCommentText] = useState('');
  const inputRef = useRef<any>(null);
  const { closeBottomSheet } = useGlobalBottomSheet();
  const deleteCommentMutation = useDeleteComment();
  const likeCommentMutation = useLikeComment();
  const unlikeCommentMutation = useUnlikeComment();
  const updateCommentMutation = useUpdateComment();
  const currentUserId = useAppStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  const { t } = useTranslation('catalog');
  
  // Auto focus input when bottom sheet opens
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  
  const handleSubmit = () => {
    if (!commentText.trim() || isSubmitting) return;
    
    onCommentSubmit(commentText.trim());
    setCommentText('');
  };

  // Handle delete comment
  const handleDeleteComment = useCallback((commentId: string) => {
    if (!commentId) return;
    
    // News comment'ler için postId olarak newsId kullanıyoruz
    // Genel delete endpoint'i kullanılıyor: DELETE /interactions/comments/:commentId
    deleteCommentMutation.mutate(
      { commentId, postId: newsId },
      {
        onSuccess: () => {
          // News comment query key'ini invalidate et
          if (brandId && productId) {
            queryClient.invalidateQueries({ 
              queryKey: [...catalogKeys.all, 'brandProductNewsComments', brandId, productId, newsId] 
            });
            // News detail'i de invalidate et (commentsCount güncellenmesi için)
            queryClient.invalidateQueries({ 
              queryKey: [...catalogKeys.all, 'brandProductNewsDetail', brandId, productId, newsId] 
            });
          }
        },
        onError: (error) => {
          console.error('[NewsCommentsBottomSheet] Delete comment error:', error);
        },
      }
    );
  }, [deleteCommentMutation, newsId, brandId, productId, queryClient]);

  // Handle like comment - no optimistic update, wait for backend response
  const handleLikeComment = useCallback((commentId: string, postId: string) => {
    if (!commentId) return;
    
    likeCommentMutation.mutate(
      { commentId, postId: newsId },
      {
        onSuccess: () => {
          // Invalidate news comment query to get updated like status from backend
          if (brandId && productId) {
            queryClient.invalidateQueries({ 
              queryKey: [...catalogKeys.all, 'brandProductNewsComments', brandId, productId, newsId] 
            });
          }
        },
        onError: (error) => {
          console.error('[NewsCommentsBottomSheet] Like comment error:', error);
        },
      }
    );
  }, [likeCommentMutation, newsId, brandId, productId, queryClient]);

  // Handle unlike comment - no optimistic update, wait for backend response
  const handleUnlikeComment = useCallback((commentId: string, postId: string) => {
    if (!commentId) return;
    
    unlikeCommentMutation.mutate(
      { commentId, postId: newsId },
      {
        onSuccess: () => {
          // Invalidate news comment query to get updated like status from backend
          if (brandId && productId) {
            queryClient.invalidateQueries({ 
              queryKey: [...catalogKeys.all, 'brandProductNewsComments', brandId, productId, newsId] 
            });
          }
        },
        onError: (error) => {
          console.error('[NewsCommentsBottomSheet] Unlike comment error:', error);
        },
      }
    );
  }, [unlikeCommentMutation, newsId, brandId, productId, queryClient]);

  // Handle edit comment
  const handleEditComment = useCallback((commentId: string, postId: string, newContent: string) => {
    if (!commentId || !newContent.trim()) return;
    
    updateCommentMutation.mutate(
      { commentId, postId: newsId, comment: newContent },
      {
        onSuccess: () => {
          // News comment query key'ini invalidate et
          if (brandId && productId) {
            queryClient.invalidateQueries({ 
              queryKey: [...catalogKeys.all, 'brandProductNewsComments', brandId, productId, newsId] 
            });
          }
        },
        onError: (error) => {
          console.error('[NewsCommentsBottomSheet] Update comment error:', error);
        },
      }
    );
  }, [updateCommentMutation, newsId, brandId, productId, queryClient]);
  
  const renderComment = ({ item }: { item: NewsComment }) => {
    const formattedDate = formatRelativeTime(item.createdAt);
    const isOwnComment = item.userId && currentUserId && item.userId === currentUserId;
    
    return (
      <CommentsCard
        userName={item.userName}
        userTitle=""
        avatar={toImageSource(item.userAvatar) || require('@/assets/avatar/default-useravatar.png')}
        timeAgo={formattedDate}
        content={item.comment}
        commentId={item.id}
        userId={item.userId}
        currentUserId={currentUserId}
        postId={newsId}
        likesCount={item.likesCount || 0}
        isLiked={false} // Backend doesn't provide isLiked, will be updated after like/unlike via query invalidation
        onDelete={handleDeleteComment}
        onLike={handleLikeComment}
        onUnlike={handleUnlikeComment}
        onEdit={handleEditComment}
        isDeleting={deleteCommentMutation.isPending}
        isLiking={likeCommentMutation.isPending || unlikeCommentMutation.isPending}
        isEditing={updateCommentMutation.isPending}
      />
    );
  };
  
  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      {/* Header */}
      <Box
        px="$4"
        py="$3"

        borderBottomWidth={1}
        borderBottomColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
      >
        <Text
          color={isDark ? '#FFFFFF' : '#000000'}
          fontSize={18}
          fontWeight="$bold"
        >
          {t('newsDetail.comments')}
        </Text>
      </Box>
      
      {/* Comments List */}
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        extraData={currentUserId} // currentUserId değiştiğinde re-render için
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingBottom: 80, // Input yüksekliği için padding
        }}
        ListEmptyComponent={
          isLoadingComments ? (
            <Box py="$8" alignItems="center">
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
          ) : (
            <Box py="$8" alignItems="center">
              <Text color={isDark ? '$textLight400' : '$textDark400'} fontSize="$sm">
                {t('newsDetail.noCommentsYet')}
              </Text>
            </Box>
          )
        }
      />
      
      {/* Comment Input - Fixed at bottom */}
      <Box
        position="absolute"
        bottom={-20}
        
        left={0}
        right={0}
        px="$4"
        py="$3"
        bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
        
        borderTopWidth={1}
        borderTopColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
      >
        <HStack space="sm" alignItems="center">
          <Input
            flex={1}
            variant="outline"
            borderRadius={20}
            size="md"
            isDisabled={false}
            isInvalid={false}
            isReadOnly={false}
            bg={isDark ? '#1A1A1A' : '#F5F5F5'}
            borderColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
          >
            <InputField
              ref={inputRef}
              placeholder={t('newsDetail.writeComment')}
              placeholderTextColor={isDark ? '#666666' : '#999999'}
              value={commentText}
              onChangeText={setCommentText}
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={14}
              multiline
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                textAlignVertical: 'center',
                textAlign: 'left',
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 14,
                fontWeight: 'normal',
                fontStyle: 'normal',
              }}
              maxLength={500}
            />
          </Input>
          
          <Pressable
            onPress={handleSubmit}
            disabled={!commentText.trim() || isSubmitting}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDark ? '#2A2A2A' : '#E5E5E5',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !commentText.trim() || isSubmitting ? 0.5 : 1,
            }}
          >
            <PaperAirplaneIcon size={20} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        </HStack>
      </Box>
    </Box>
  );
};

export default NewsDetailScreen;
