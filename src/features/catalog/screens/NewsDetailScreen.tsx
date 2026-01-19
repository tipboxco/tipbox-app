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

type NewsDetailScreenNavigationProp = NativeStackNavigationProp<NewsStackParamList, 'NewsDetailScreen'>;
type NewsDetailScreenRouteProp = RouteProp<NewsStackParamList, 'NewsDetailScreen'>;

const NewsDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NewsDetailScreenNavigationProp>();
  const route = useRoute<NewsDetailScreenRouteProp>();

  const { newsId, brandId, productId } = route.params;
  
  // 
  // Actions bar height - sabit değer (tab bar yok çünkü RootNavigator'da)
  const actionsBarHeight = 56 + insets.bottom; // Sabit yükseklik

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
  const commentsQuery = useBrandProductNewsComments(brandId, productId, newsId);
  const { data: commentsData, isLoading: isLoadingComments } = commentsQuery;
  const comments = commentsData?.data || [];
  
  // Create comment mutation - sadece brand product news comments kullanılıyor
  const createBrandProductNewsCommentMutation = useCreateBrandProductNewsComment();
  
  // Bottom sheet
  const { openBottomSheet } = useGlobalBottomSheet();

  // Handlers
  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
      unlikeNewsMutation.mutate({ newsId, brandId, productId });
    } else {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
      likeNewsMutation.mutate({ newsId, brandId, productId });
    }
  };

  const handleFavorite = () => {
    if (isFavorited) {
      setIsFavorited(false);
      setFavoritesCount(prev => Math.max(0, prev - 1));
      unfavoriteNewsMutation.mutate({ newsId, brandId, productId });
    } else {
      setIsFavorited(true);
      setFavoritesCount(prev => prev + 1);
      favoriteNewsMutation.mutate({ newsId, brandId, productId });
    }
  };

  const handleShare = () => {
    if (isShared) return;
    setIsShared(true);
    setSharesCount(prev => prev + 1);
    shareNewsMutation.mutate({ 
      newsId, 
      request: { shareType: 'INTERNAL_REPOST' },
      brandId,
      productId,
    });
  };
  
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
        comments={comments}
        isLoadingComments={isLoadingComments}
        onCommentSubmit={handleCommentSubmit}
        isSubmitting={createBrandProductNewsCommentMutation.isPending}
      />,
      {
        snapPoints: ['75%', '90%'],
        enablePanDownToClose: true,
        backdropPressBehavior: 'close',
      }
    );
  }, [newsId, brandId, productId, comments, isLoadingComments, openBottomSheet, handleCommentSubmit, createBrandProductNewsCommentMutation.isPending]);

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      {/* Header - Fixed at top */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        zIndex={1000}
        pt={insets.top}
        bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      >
        <Header
          title="Brand History Book"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
      </Box>

      {/* Fixed Banner and Source/Date Section */}
      {newsDetail && (
        <VStack
          position="absolute"
          top={insets.top + 56} // Header height + safe area top
          left={0}
          right={0}
          zIndex={100}
        >
          {/* News Banner Image - Full width, no padding */}
          <Box
            width="100%"
            height={250}
            bg="rgba(0, 0, 0, 0.2)"
            overflow="hidden"
          >
            <Image
              source={
                (newsDetail.banner || newsDetail.image)
                  ? toImageSource(newsDetail.banner || newsDetail.image)
                  : require('@/assets/defaultImages/default-banner.png')
              }
              alt={newsDetail.title}
              style={{
                width: '100%',
                height: '100%',
              }}
              resizeMode="cover"
            />
          </Box>

          {/* Source and Date - Fixed below banner */}
          <Box px="$4" pt="$2" pb="$2" bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
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
        </VStack>
      )}

      {/* Scrollable Title and Content */}
        <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingTop: insets.top + 56 + 250 + 40, // Header + Banner + Source/Date height
          paddingBottom: actionsBarHeight + insets.bottom, // Actions bar + safe area bottom
        }}
        >
          {isLoading ? (
            <VStack alignItems="center" py="$8" flex={1} justifyContent="center">
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
              <Text mt="$4" fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
                Loading news...
              </Text>
            </VStack>
          ) : error ? (
            <VStack alignItems="center" py="$8" flex={1} justifyContent="center">
              <Text fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
                Error loading news
              </Text>
            </VStack>
          ) : newsDetail ? (
            <VStack space="md" px="$4" pb="$4">
                {/* Title */}
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={18}
                  fontWeight="$bold"
                lineHeight={24}
                >
                  {newsDetail.title}
                </Text>

                {/* Content */}
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={12}
                lineHeight={18}
                  textAlign="justify"
                >
                  {newsDetail.content}
                </Text>
            </VStack>
          ) : null}
        </ScrollView>


      {/* Actions Bar - Fixed at bottom */}
      {newsDetail && (
        <Box
          position="absolute"
          bottom={10}
          left={0}
          right={0}
          height={actionsBarHeight}
          bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
          borderTopWidth={1}
          borderTopColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
          px="$4"
          justifyContent="center"
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

// News Comments Bottom Sheet Component
interface NewsCommentsBottomSheetProps {
  newsId: string;
  comments: NewsComment[];
  isLoadingComments: boolean;
  onCommentSubmit: (comment: string) => void;
  isSubmitting: boolean;
}

const NewsCommentsBottomSheet: React.FC<NewsCommentsBottomSheetProps> = ({
  newsId,
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
  
  const renderComment = ({ item }: { item: NewsComment }) => {
    const formattedDate = formatRelativeTime(item.createdAt);
    
    return (
      <Box
        borderBottomWidth={1}
        borderBottomColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
        py="$3"
        px="$4"
      >
        <HStack space="sm" alignItems="flex-start">
          {/* Avatar */}
          <Image
            source={toImageSource(item.userAvatar) || require('@/assets/avatar/default-useravatar.png')}
            alt={item.userName}
            width={40}
            height={40}
            borderRadius={20}
            resizeMode="cover"
          />
          
          {/* Comment Content */}
          <VStack flex={1} >
            {/* User Name and Time */}
            <HStack justifyContent="space-between" alignItems="center">
              <Text
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={14}
                fontWeight="$bold"
              >
                {item.userName}
              </Text>
              <Text
                color="#B9B9B9"
                fontSize={11}
              >
                {formattedDate}
              </Text>
            </HStack>
            
            {/* Comment Text */}
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={12}
              lineHeight={18}
            >
              {item.comment}
            </Text>
      </VStack>
        </HStack>
      </Box>
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
          Comments
        </Text>
      </Box>
      
      {/* Comments List */}
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
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
                No comments yet. Be the first to comment!
              </Text>
            </Box>
          )
        }
      />
      
      {/* Comment Input - Fixed at bottom */}
      <Box
        position="absolute"
        bottom={-40}
        
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
              placeholder="Write a comment..."
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
