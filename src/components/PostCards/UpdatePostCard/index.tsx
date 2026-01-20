import React, { memo, useState, useEffect, useRef } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Platform, View, Pressable as RNPressable } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
// Heroicons imports
import {
  EllipsisHorizontalIcon,
  InformationCircleIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  BookmarkIcon,
  PencilIcon,
  TrashIcon,
} from 'react-native-heroicons/outline';
import { ContextMenuReanimated } from '../PostCard/ContextMenuReanimated';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from 'react-native-heroicons/solid';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import CardImageCarousel from '../../CardImageCarousel';
import { useNavigation } from '@react-navigation/native';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import type { UpdateCardData } from '@/src/types/UpdateCard';
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
import { useUpdatePost, useDeletePost } from '@/src/features/post/api/hooks';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { PostOptionsMenu } from '@/src/components/PostOptionsMenu';
import { AnimatedCounter } from '@/src/components/AnimatedCounter';

interface UpdatePostCardProps {
  data: UpdateCardData;
  hideProduct?: boolean;
  isDetailMode?: boolean;
  showRelatedPost?: boolean;
  relatedPostData?: any;
}

const UpdatePostCard = ({ data, hideProduct = false, isDetailMode = false, showRelatedPost, relatedPostData }: UpdatePostCardProps) => {
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

  // Product'ı relatedPost.product'tan al (null check ile)
  const product = data.relatedPost?.product;
  
  // ContextType'a göre ProductInfoType belirle
  const productInfoType = data.contextType || ProductInfoType.PRODUCT;

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
      params: { postData: data, type: 'update' },
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
  const handleUpdate = React.useCallback(() => {
    // Context bilgilerini data'dan al
    const contextType = data.contextType === ProductInfoType.PRODUCT ? 'product' :
                       data.contextType === ProductInfoType.PRODUCT_GROUP ? 'product_group' :
                       data.contextType === ProductInfoType.SUB_CATEGORY ? 'sub_category' : undefined;
    const contextId = product?.id || (data as any).contextId;
    
    // PostOptionsMenu'yu bottom sheet olarak aç
    openBottomSheet(
      <PostOptionsMenu
        postId={data.id}
        postContent={data.content}
        postAuthorName={data.user.name}
        postAuthorId={data.user.id}
        postType="update"
        postContextType={contextType}
        postContextId={contextId}
      />
    );
  }, [data, product, openBottomSheet]);

  const handleDelete = React.useCallback(() => {
    Alert.alert(
      'Post\'u Sil',
      'Bu post\'u silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePostMutation.mutateAsync(data.id);
              Alert.alert('Başarılı', 'Post başarıyla silindi.');
            } catch (error: any) {
              Alert.alert(
                'Hata',
                error.response?.data?.message || 'Post silinirken bir hata oluştu.'
              );
            }
          },
        },
      ]
    );
  }, [data.id, deletePostMutation]);

    return (
        <VStack
            bg={isDark ? '$backgroundDark900' : '$white'}
            mb={16}
            position="relative"
        >
      {/* Header */}
      <VStack 
        px={12} 
        py={8} 
        borderWidth={1} 
        borderTopRightRadius={5} 
        borderTopLeftRadius={5} 
        borderColor="#E9E9E9"
      >
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
            menuItems={isPostOwner ? [
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
            ] : undefined}
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
      {!hideProduct && product && (
        <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <ProductInfoCard
            size="small"
            type={productInfoType}
            image={toImageSource(product.image)}
            title={product.name}
            subName={product.subName}
            isOwned={product.isOwned}
            onPress={() => {
              // Context'e göre PostsScreen'e navigate et
              if (!product.id || !data.contextType) return;
              
              const stage = data.contextType === ProductInfoType.PRODUCT_GROUP 
                ? 'ProductGroup' 
                : data.contextType === ProductInfoType.SUB_CATEGORY
                ? 'SubCategories'
                : 'Product';
              
              navigationService.navigate(ROOT_ROUTES.POST, {
                screen: 'PostsScreen',
                params: {
                  stage,
                  name: product.name,
                  productInfo: {
                    image: toImageSource(product.image),
                    title: product.name,
                    subName: product.subName,
                  },
                  ...(data.contextType === ProductInfoType.PRODUCT && {
                    selectedProduct: {
                      id: product.id,
                      name: product.name,
                      description: product.subName,
                      image: toImageSource(product.image),
                    },
                  }),
                  contextType: data.contextType,
                  contextId: product.id,
                },
              });
            }}
          />
        </Box>
      )}

      {/* Badges */}
      <HStack px={12} pb={8} pt={hideProduct ? 10 : 2} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9" justifyContent="space-between" alignItems="center">
        <Box
          borderWidth={1}
          borderColor="#9672FA"
          bgColor="#571FDD"
          borderRadius={20}
          flexDirection="row"
          justifyContent="center"
          px='$3'
          py='$2'
        >
          <InformationCircleIcon width={12} height={12} color={'#fff'} />
          <Text
            fontSize={9}
            fontWeight="$bold"
            ml={5}
            color={'#fff'}
          >
            Update
          </Text>
        </Box>
      </HStack>

      {/* Content */}
      <VStack px={12} pb={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
        <Pressable onPress={() => {
          if (isDetailMode) return; // Detay modunda navigation yapma
          // Navigate to PostDetailScreen
          navigationService.navigate(ROOT_ROUTES.POST, {
            screen: 'PostDetailScreen',
            params: { 
              postData: data, 
              type: 'update',
            }
          });
        }}>
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize="$xs"
            numberOfLines={isDetailMode ? undefined : (data.images && data.images.length > 0 ? 3 : 6)}
          >
            {data.content}
          </Text>
        </Pressable>

        {/* See Related Post Button - Detay sayfasına yönlendirir */}
        {data.relatedPost && (
          <Pressable 
            onPress={() => {
              // Detay sayfasına yönlendir (related post detay sayfasında açılacak)
              navigationService.navigate(ROOT_ROUTES.POST, {
                screen: 'PostDetailScreen',
                params: { 
                  postData: data, 
                  type: 'update',
                }
              });
            }} 
            mt={10}
          >
            <Text
              color={isDark ? '$textDark50' : '#A3A3A3'}
              fontSize={10}
              textDecorationLine="underline"
              fontWeight="$bold"
            >
              See Related Post {'>'}
            </Text>
          </Pressable>
        )}
      </VStack>

      {/* Images */}
      {(() => {
        const validImages = data.images?.map(img => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img) || [];
        if (validImages.length === 0) return null;
        return (
          <Pressable
            onPress={() => {
              if (isDetailMode) return; // Detay modunda navigation yapma
              navigationService.navigate(ROOT_ROUTES.POST, {
                screen: 'PostDetailScreen',
                params: { postData: data, type: 'update' }
              });
            }}
          >
            <VStack px={12} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <CardImageCarousel images={validImages} />
            </VStack>
          </Pressable>
        );
      })()}

      {/* Related Post Details - Sadece detay sayfasında gösterilecek, burada render edilmiyor */}

      {/* Stats */}
      <HStack
        px={12}
        py={8}
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
              <AnimatedCounter
                value={likesCount}
                color={isDark ? '$textDark50' : '#000'}
                fontSize={10}
                ml={4}
              />
            </HStack>
          </Pressable>
          <Pressable onPress={handleComment}>
            <HStack mr={10} alignItems="center">
              <ChatBubbleLeftIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
              <AnimatedCounter
                value={commentsCount}
                color={isDark ? '$textDark50' : '#000'}
                fontSize={10}
                ml={4}
              />
            </HStack>
          </Pressable>
          <Pressable onPress={handleShare}>
            <HStack mr={10} alignItems="center">
              <PaperAirplaneIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
              <AnimatedCounter
                value={sharesCount}
                color={isDark ? '$textDark50' : '#000'}
                fontSize={10}
                ml={4}
              />
            </HStack>
          </Pressable>
          <Pressable onPress={handleBookmark}>
            <HStack mr={10} alignItems="center">
              {isBookmarked ? (
                <BookmarkIconSolid width={24} height={24} color="#829905" />
              ) : (
                <BookmarkIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
              )}
              <AnimatedCounter
                value={bookmarksCount}
                color={isDark ? '$textDark50' : '#000'}
                fontSize={10}
                ml={4}
              />
            </HStack>
          </Pressable>
        </HStack>
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

export default memo(UpdatePostCard);

