import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Platform, View, Pressable as RNPressable } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
// Heroicons imports
import {
  EllipsisHorizontalIcon,
  QuestionMarkCircleIcon,
  PaperAirplaneIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  BookmarkIcon,
  ChevronDoubleUpIcon,
  PencilIcon,
  TrashIcon,
} from 'react-native-heroicons/outline';
import { ContextMenuReanimated } from '../PostCard/ContextMenuReanimated';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from 'react-native-heroicons/solid';
import { QuestionPost } from '@/src/mock/profile/questions/types';
import type { QuestionCardData } from '@/src/types/QuestionCard';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import CardImageCarousel from '../../CardImageCarousel';
import { useNavigation } from '@react-navigation/native';
import { navigationService } from '@/src/services/NavigationService';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { toImageSource } from '@/src/utils';
import {
  useLikePost,
  useUnlikePost,
  useBookmarkPost,
  useUnbookmarkPost,
  useSharePost,
  usePostStatus,
} from '@/src/features/interactions/api/hooks';
import { useReportUser } from '@/src/features/profile/api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { Alert } from 'react-native';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { useUpdatePost, useDeletePost } from '@/src/features/post/api/hooks';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { PostOptionsMenu } from '@/src/components/PostOptionsMenu';

interface QuestionPostCardProps {
  data: QuestionPost | QuestionCardData; // Accept both types for compatibility
  hideProduct?: boolean;
  isDetailMode?: boolean;
}

export const QuestionPostCard = ({ data, hideProduct = false, isDetailMode = false }: QuestionPostCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<any>();
  const { user } = useAppStore();
  const targetUserId = data.user.id;
  const isPostOwner = user?.id && targetUserId && user.id === targetUserId;
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const contextMenuCloseRef = useRef<(() => void) | null>(null);
  const { openBottomSheet } = useGlobalBottomSheet();
  
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isShared, setIsShared] = useState(false);
  
  // Animated counter states
  const [likesCount, setLikesCount] = useState(data.stats.likes);
  const [commentsCount, setCommentsCount] = useState(data.stats.comments);
  const [sharesCount, setSharesCount] = useState(data.stats.shares);
  const [bookmarksCount, setBookmarksCount] = useState(data.stats.bookmarks);

  // Interaction hooks
  const likePostMutation = useLikePost();
  const unlikePostMutation = useUnlikePost();
  const bookmarkPostMutation = useBookmarkPost();
  const unbookmarkPostMutation = useUnbookmarkPost();
  const sharePostMutation = useSharePost();
  const { data: postStatus } = usePostStatus(data.id);
  const { mutate: reportUser } = useReportUser();
  const updatePostMutation = useUpdatePost();
  const deletePostMutation = useDeletePost();

  // Sync with post status from API
  useEffect(() => {
    if (postStatus) {
      setIsLiked(postStatus.liked);
      setIsBookmarked(postStatus.favorited);
      setIsShared(postStatus.shared);
    }
  }, [postStatus]);

  // Sync stats with data prop changes
  useEffect(() => {
    setLikesCount(data.stats.likes);
    setCommentsCount(data.stats.comments);
    setSharesCount(data.stats.shares);
    setBookmarksCount(data.stats.bookmarks);
  }, [data.stats.likes, data.stats.comments, data.stats.shares, data.stats.bookmarks]);

  // Action handlers
  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
      unlikePostMutation.mutate(data.id);
    } else {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
      likePostMutation.mutate(data.id);
    }
  };

  const handleBookmark = () => {
    if (isBookmarked) {
      setIsBookmarked(false);
      setBookmarksCount(prev => Math.max(0, prev - 1));
      unbookmarkPostMutation.mutate(data.id);
    } else {
      setIsBookmarked(true);
      setBookmarksCount(prev => prev + 1);
      bookmarkPostMutation.mutate(data.id);
    }
  };

  const handleShare = () => {
    // Zaten paylaşılmışsa tekrar paylaşma
    if (isShared) return;
    
    setIsShared(true);
    setSharesCount(prev => prev + 1);
    sharePostMutation.mutate({
      postId: data.id,
      shareType: 'INTERNAL_REPOST',
    });
  };

  const handleComment = () => {
    if (isDetailMode) return; // Detay modunda navigation yapma
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'PostDetailScreen',
      params: { postData: data, type: 'question' },
    });
  };

  const handleViewProfile = React.useCallback(() => {
    if (data.user.id) {
      navigationService.navigate(ROOT_ROUTES.PROFILE, {
        screen: 'ProfileMain',
        params: { userId: data.user.id },
      });
    }
  }, [data.user.id]);

  const handleReport = React.useCallback(() => {
    if (!user?.id || !targetUserId) return;
    
    Alert.alert(
      'Kullanıcıyı Raporla',
      'Bu kullanıcıyı raporlamak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Raporla',
          style: 'destructive',
          onPress: () => {
            reportUser({
              userId: user.id,
              targetUserId,
              data: {
                category: 'OTHER',
                description: 'Kullanıcı raporlandı',
              },
            });
          },
        },
      ]
    );
  }, [user?.id, targetUserId, reportUser]);

  // Post owner actions
  const handleUpdate = useCallback(() => {
    console.log('[QuestionPostCard] ✏️ Update button clicked');
    // Context bilgilerini data'dan al
    const contextType = (data as any).contextType;
    const contextId = (data as any).contextId || data.category?.product?.id;
    
    // PostOptionsMenu'yu bottom sheet olarak aç
    openBottomSheet(
      <PostOptionsMenu
        postId={data.id}
        postContent={data.content || (data as any).description}
        postAuthorName={data.user.name}
        postAuthorId={data.user.id}
        postType="question"
        postContextType={contextType}
        postContextId={contextId}
      />
    );
  }, [data, openBottomSheet]);

  const handleDelete = useCallback(() => {
    console.log('[QuestionPostCard] 🗑️ Delete button clicked for post:', data.id);
    console.log('[QuestionPostCard] isPostOwner:', isPostOwner);
    console.log('[QuestionPostCard] user?.id:', user?.id);
    console.log('[QuestionPostCard] targetUserId:', targetUserId);
    
    Alert.alert(
      'Post\'u Sil',
      'Bu post\'u silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        {
          text: 'İptal',
          style: 'cancel',
          onPress: () => {
            console.log('[QuestionPostCard] ❌ Delete cancelled by user');
          },
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            console.log('[QuestionPostCard] ✅ Delete confirmed, sending DELETE request to /posts/' + data.id);
            
            try {
              const response = await deletePostMutation.mutateAsync(data.id);
              
              console.log('[QuestionPostCard] ✅ Post deleted successfully:', {
                postId: data.id,
                response,
                timestamp: new Date().toISOString(),
              });
              
              Alert.alert('Başarılı', 'Post başarıyla silindi.');
            } catch (error: any) {
              console.error('[QuestionPostCard] ❌ Delete post error:', {
                postId: data.id,
                url: `/posts/${data.id}`,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                timestamp: new Date().toISOString(),
              });
              
              Alert.alert(
                'Hata',
                error.response?.data?.message || 'Post silinirken bir hata oluştu.'
              );
            }
          },
        },
      ]
    );
  }, [data.id, deletePostMutation, isPostOwner, user?.id, targetUserId]);

  return (
    <VStack
      bg={isDark ? '$backgroundDark900' : '$white'}
      mb={16}
      position="relative"
    >
      {/* Header */}
      <VStack px={12} py={8} borderWidth={1} borderTopRightRadius={5} borderTopLeftRadius={5} borderColor="#E9E9E9">
        <HStack alignItems="center" space="xs">
          {data.user && toImageSource(data.user.avatar) && (
            <Pressable onPress={handleViewProfile}>
              <Image
                source={toImageSource(data.user.avatar)!}
                alt={data.user?.name || 'User'}
                mr={8}
                width={42}
                height={42}
                borderRadius={100}
              />
            </Pressable>
          )}
          <Pressable flex={1} onPress={handleViewProfile}>
            <VStack flex={1}>
              <Text
                color={isDark ? '$textDark50' : '#000'}
                fontSize="$sm"
                fontWeight="$bold"
              >
                {data.user?.name || 'Unknown User'}
              </Text>
              <Text
                color={isDark ? '$textDark400' : '#787878'}
                fontSize={11}
                numberOfLines={1}
                maxWidth={250}
              >
                {data.user?.title || ''}
              </Text>
            </VStack>
          </Pressable>
          <ContextMenuReanimated
            onViewProfile={handleViewProfile}
            onReport={!isPostOwner ? handleReport : undefined}
            menuItems={(() => {
              if (isPostOwner) {
                const items = [
                  {
                    label: 'Güncelle',
                    icon: <PencilIcon width={20} height={20} color={isDark ? '#fff' : '#000'} />,
                    onPress: handleUpdate,
                  },
                  {
                    label: 'Sil',
                    icon: <TrashIcon width={20} height={20} color="#FF3040" />,
                    onPress: handleDelete,
                    color: '#FF3040',
                  },
                ];
                console.log('[QuestionPostCard] ✅ Menu items for post owner:', items.length, 'items');
                console.log('[QuestionPostCard] handleDelete type:', typeof handleDelete);
                return items;
              }
              console.log('[QuestionPostCard] ❌ Not post owner, using default menu items');
              return undefined;
            })()}
            onMenuStateChange={setIsContextMenuOpen}
            onCloseRef={(closeFn) => {
              contextMenuCloseRef.current = closeFn;
            }}
          >
            <EllipsisHorizontalIcon width={24} height={24} color={isDark ? '#fff' : '#A3A3A3'} />
          </ContextMenuReanimated>
        </HStack>
      </VStack>

      {/* Product */}
      {
        !hideProduct && data.category && data.category.product ? (
          <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
            <ProductInfoCard
              size="small"
              type={ProductInfoType.PRODUCT}
              image={toImageSource(data.category.product.image) || require('@/assets/inventory/product_01.png')}
              title={data.category.product.name}
              subName={data.category.product.subName}
              onPress={() => {
                // Product için PostsScreen'e navigate et
                if (!data.category?.product?.id) return;
                
                navigationService.navigate(ROOT_ROUTES.POST, {
                  screen: 'PostsScreen',
                  params: {
                    stage: 'Product',
                    name: data.category.product.name,
                    productInfo: {
                      image: toImageSource(data.category.product.image) || require('@/assets/inventory/product_01.png'),
                      title: data.category.product.name,
                      subName: data.category.product.subName,
                    },
                    selectedProduct: {
                      id: data.category.product.id,
                      name: data.category.product.name,
                      description: data.category.product.subName,
                      image: toImageSource(data.category.product.image) || require('@/assets/inventory/product_01.png'),
                    },
                    contextType: ProductInfoType.PRODUCT,
                    contextId: data.category.product.id,
                  },
                });
              }}
            />
          </Box>
        ) : !hideProduct && data.category ? (
          <Box px={12} py={8} borderTopWidth={1} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
            <ProductInfoCard
              size="small"
              type={ProductInfoType.SUB_CATEGORY}
              image={toImageSource(data.category.image) || require('@/assets/inventory/product_01.png')}
              title={data.category.name}
              subName={data.category.subCategory}
              onPress={() => {
                // SubCategory için PostsScreen'e navigate et
                if (!data.category?.id) return;
                
                navigationService.navigate(ROOT_ROUTES.POST, {
                  screen: 'PostsScreen',
                  params: {
                    stage: 'SubCategories',
                    name: data.category.name,
                    productInfo: {
                      image: toImageSource(data.category.image) || require('@/assets/inventory/product_01.png'),
                      title: data.category.name,
                      subName: data.category.subCategory,
                    },
                    contextType: ProductInfoType.SUB_CATEGORY,
                    contextId: data.category.id,
                  },
                });
              }}
            />
          </Box>
        ) : null
      }

      {/* Badges */}
      <HStack px={12} pb={8} pt={hideProduct ? 8 : 0} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
        <Box
          bg={isDark ? '$backgroundDark900' : '$white'}
          borderWidth={2}
          borderColor="#B8CC04"
          bgColor="#758600"
          borderRadius={20}
          width={90}
          px={10}
          py={6}
          mr={16}
          flexDirection="row"
          alignItems="center"
          justifyContent="space-evenly"
        >
          <QuestionMarkCircleIcon width={12} height={12} color={'#fff'} />
          <Text
            fontSize={8}
            fontWeight="$semibold"
            ml={5}
            color={'#fff'}
          >
            Question
          </Text>
        </Box>

        {data.isBoosted && (
          <Box
            bgColor="#E0195B"
            borderWidth={2}
            borderColor="#EF4D81"
            borderRadius={20}
            width={90}
            px={10}
            py={6}
            flexDirection="row"
            alignItems="center"
            justifyContent="space-evenly"
          >
            <Image
              source={require('@/assets/boost.svg')}
              alt="boost"
              width={12}
              height={12}
            />
            <Text
              fontSize={8}
              fontWeight="$semibold"
              ml={5}
              color="#fff"
            >
              Boosted
            </Text>
          </Box>
        )}
      </HStack>

      {/* Content */}
      <Pressable onPress={() => {
        if (isDetailMode) return; // Detay modunda navigation yapma
        navigationService.navigate(ROOT_ROUTES.POST, {
          screen: 'PostDetailScreen',
          params: { postData: data, type: 'question' }
        });
      }}>
        <VStack px={12} pb={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize="$xs"
            numberOfLines={data.images && data.images.length > 0 ? 3 : 6}
          >
            {data.content}
          </Text>
        </VStack>
      </Pressable>

      {/* Images */}
      {data.images && data.images.length > 0 && (
        <Pressable
          onPress={() => {
            if (isDetailMode) return; // Detay modunda navigation yapma
            navigationService.navigate(ROOT_ROUTES.POST, {
              screen: 'PostDetailScreen',
              params: { postData: data, type: 'question' }
            });
          }}
        >
          <VStack px={12} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
            <CardImageCarousel 
              images={data.images.map(img => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)} 
            />
          </VStack>
        </Pressable>
      )}

      {/* Stats */}
      <HStack
        px={12}
        py={10}
        borderRightWidth={1}
        borderLeftWidth={1}
        borderBottomWidth={1}
        borderBottomRightRadius={5}
        borderBottomLeftRadius={5}
        borderColor="#E9E9E9"
        justifyContent="space-between"
      >
        <HStack>
          <Pressable onPress={handleLike}>
          <HStack mr={10} alignItems="center">
              {isLiked ? (
                <HeartIconSolid width={24} height={24} color="#FF3040" />
              ) : (
                <HeartIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
              )}
              <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={10}>
                {likesCount}
              </Text>
          </HStack>
          </Pressable>
          <Pressable onPress={handleComment}>
          <HStack mr={10} alignItems="center">
            <ChatBubbleLeftIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
              <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={10}>
                {commentsCount}
              </Text>
          </HStack>
          </Pressable>
          <Pressable onPress={handleShare}>
          <HStack mr={10} alignItems="center">
            <PaperAirplaneIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
          </HStack>
          </Pressable>
          <Pressable onPress={handleBookmark}>
          <HStack mr={10} alignItems="center">
              {isBookmarked ? (
                <BookmarkIconSolid width={24} height={24} color="#829905" />
              ) : (
                <BookmarkIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
              )}
              <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={10}>
                {bookmarksCount}
              </Text>
          </HStack>
          </Pressable>
        </HStack>
        {data.isBoosted && (
          <Box>
            <ChevronDoubleUpIcon
              width={24}
              height={24}
              color="#22C55E"
            />
          </Box>
        )}
      </HStack>

      {/* Overlay - menu açıkken PostCard'a tıklamayı engellemek için */}
      {isContextMenuOpen && (
        <RNPressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'transparent',
            zIndex: 999,
          }}
          onPress={() => {
            contextMenuCloseRef.current?.();
          }}
        />
      )}
    </VStack>
  );
};

// PERFORMANCE FIX: Memoize component to prevent unnecessary re-renders in feed lists
export default React.memo(QuestionPostCard);

