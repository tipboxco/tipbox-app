import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Alert, Platform, View, Pressable as RNPressable } from 'react-native';
// Heroicons imports
import {
  EllipsisHorizontalIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  BookmarkIcon,
  PencilIcon,
  TrashIcon,
} from 'react-native-heroicons/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from 'react-native-heroicons/solid';
import { useColorMode } from '@/src/hooks/useColorMode';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import CardImageCarousel from '../../CardImageCarousel';
import { useNavigation } from '@react-navigation/native';
import { navigationService } from '@/src/services/NavigationService';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { toImageSource } from '@/src/utils';
import type { LegacyPostUser, PostCardData } from '@/src/types/PostCard';
import {
  useLikePost,
  useUnlikePost,
  useBookmarkPost,
  useUnbookmarkPost,
  useSharePost,
  usePostStatus,
} from '@/src/features/interactions/api/hooks';
import { useAppStore } from '@/src/store/appStore';
import {
  useReportUser,
} from '@/src/features/profile/api/hooks';
import { ContextMenuReanimated } from './ContextMenuReanimated';
import { useUpdatePost, useDeletePost } from '@/src/features/post/api/hooks';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { PostOptionsMenu } from '@/src/components/PostOptionsMenu';
import { AnimatedCounter } from '@/src/components/AnimatedCounter';

interface PostCardProps {
  data: PostCardData;
  hideProduct?: boolean;
  isDetailMode?: boolean;
}

const PostCard = ({ data, hideProduct = false, isDetailMode = false }: PostCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<any>();
  const { user } = useAppStore();
  
  const [isLiked, setIsLiked] = useState(data.isLiked ?? false);
  const [isBookmarked, setIsBookmarked] = useState(data.isBookmarked ?? false);
  const [isShared, setIsShared] = useState(data.isShared ?? false);
  
  // Animated counter states
  const [likesCount, setLikesCount] = useState(data.stats.likes);
  const [commentsCount, setCommentsCount] = useState(data.stats.comments);
  const [sharesCount, setSharesCount] = useState(data.stats.shares);
  const [bookmarksCount, setBookmarksCount] = useState(data.stats.bookmarks);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const contextMenuCloseRef = useRef<(() => void) | null>(null);

  // User profile check
  const targetUserId = data.user.id;
  const isPostOwner = user?.id && targetUserId && user.id === targetUserId;
  
  // Interaction hooks
  const likePostMutation = useLikePost();
  const unlikePostMutation = useUnlikePost();
  const bookmarkPostMutation = useBookmarkPost();
  const unbookmarkPostMutation = useUnbookmarkPost();
  const sharePostMutation = useSharePost();
  const { data: postStatus } = usePostStatus(data.id);
  
  // User action hooks
  const { mutate: reportUser } = useReportUser();
  const { openBottomSheet } = useGlobalBottomSheet();
  
  // Post owner actions
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

  // Sync with data prop changes
  useEffect(() => {
    if (data.isLiked !== undefined) setIsLiked(data.isLiked);
    if (data.isBookmarked !== undefined) setIsBookmarked(data.isBookmarked);
    if (data.isShared !== undefined) setIsShared(data.isShared);
  }, [data.isLiked, data.isBookmarked, data.isShared]);

  // Sync stats with data prop changes
  useEffect(() => {
    setLikesCount(data.stats.likes);
    setCommentsCount(data.stats.comments);
    setSharesCount(data.stats.shares);
    setBookmarksCount(data.stats.bookmarks);
  }, [data.stats.likes, data.stats.comments, data.stats.shares, data.stats.bookmarks]);

  const avatarSource = toImageSource(data.user.avatar);

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
      params: { postData: data, type: 'post' },
    });
  };

  const handleAvatarPress = () => {
    if (data.user.id) {
      navigationService.navigate(ROOT_ROUTES.PROFILE, {
        screen: 'ProfileMain',
        params: { userId: data.user.id },
      });
    }
  };

  // User actions menu handlers
  const handleViewProfile = useCallback(() => {
    if (data.user.id) {
      navigationService.navigate(ROOT_ROUTES.PROFILE, {
        screen: 'ProfileMain',
        params: { userId: data.user.id },
      });
    }
  }, [data.user.id]);

  const handleReport = useCallback(() => {
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
                description: 'User reported',
              },
            });
          },
        },
      ]
    );
  }, [user?.id, targetUserId, reportUser]);

  const handleBlock = useCallback(() => {
    if (!targetUserId) return;
    
    Alert.alert(
      'Kullanıcıyı Engelle',
      'Bu kullanıcıyı engellemek istediğinizden emin misiniz? Engellediğiniz kullanıcı sizinle etkileşime geçemez.',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: () => {
            // TODO: Block user API endpoint eklendiğinde buraya entegre edilecek
          },
        },
      ]
    );
  }, [targetUserId]);

  // Post owner actions
  const handleUpdate = useCallback(() => {
    // Context bilgilerini data'dan al
    const contextType = (data as any).contextType;
    const contextId = (data as any).contextId || (data.contextData?.id);
    const postType = (data as any).type || 'post';
    
    // PostOptionsMenu'yu bottom sheet olarak aç
    openBottomSheet(
      <PostOptionsMenu
        postId={data.id}
        postContent={data.content || (data as any).description}
        postAuthorName={data.user.name}
        postAuthorId={data.user.id}
        postType={postType}
        postContextType={contextType}
        postContextId={contextId}
      />
    );
  }, [data, openBottomSheet]);

  const handleDelete = useCallback(() => {
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
              Alert.alert('Success', 'Post deleted successfully.');
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

  const hasContextData = !!data.contextType && !!data.contextData;
  const isProductContext = hasContextData && data.contextType === ProductInfoType.PRODUCT;
  const isGroupOrSubCategoryContext =
    hasContextData &&
    (data.contextType === ProductInfoType.PRODUCT_GROUP ||
      data.contextType === ProductInfoType.SUB_CATEGORY);

  const isBoosted = data.source === 'BOOSTED';

  return (
    <VStack
      bg={isDark ? '$backgroundDark900' : '$white'}
      mb={16}
      position="relative"
    >
      {/* Header */}
      <VStack px={12} py={8} borderWidth={1} borderTopRightRadius={5} borderTopLeftRadius={5} borderColor="#E9E9E9">
        <HStack alignItems="center" space="xs">
          {avatarSource && (
            <Pressable onPress={handleAvatarPress}>
              <Image
                source={avatarSource}
                alt={data.user?.name || 'User'}
                mr={8}
                width={42}
                height={42}
                borderRadius={100}
              />
            </Pressable>
          )}
          <Pressable flex={1} onPress={handleAvatarPress}>
            <VStack flex={1} justifyContent="center">
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

      {/* Product / Context Info */}
      {!hideProduct && isProductContext && data.contextData ? (
        (() => {
          const context = data.contextData;
          // Güvenli image source - undefined ise ProductInfoCard kendi default'unu kullanacak
          const imageSource = context.image || require('@/assets/product/product_01.png');
          return (
            <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <ProductInfoCard
                size="small"
                type={ProductInfoType.PRODUCT}
                image={imageSource}
                title={context.name}
                subName={context.subName}
                onPress={() => {
                  // Product için PostsScreen'e navigate et
                  if (!context.id || !data.contextType) {
                    return;
                  }
                  
                  navigationService.navigate(ROOT_ROUTES.POST, {
                    screen: 'PostsScreen',
                    params: {
                      stage: 'Product',
                      name: context.name,
                      productInfo: {
                        image: imageSource,
                        title: context.name,
                        subName: context.subName,
                      },
                      selectedProduct: {
                        id: context.id,
                        name: context.name,
                        description: context.subName,
                        image: imageSource,
                      },
                      contextType: data.contextType,
                      contextId: context.id,
                    },
                  });
                }}
              />
            </Box>
          );
        })()
      ) : !hideProduct && isGroupOrSubCategoryContext && data.contextData ? (
        (() => {
          const context = data.contextData;
          // Güvenli image source - undefined ise ProductInfoCard kendi default'unu kullanacak
          const imageSource = context.image || require('@/assets/product/product_01.png');
          return (
            <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <ProductInfoCard
                size="small"
                type={data.contextType === ProductInfoType.PRODUCT_GROUP
                  ? ProductInfoType.PRODUCT_GROUP
                  : ProductInfoType.SUB_CATEGORY}
                image={imageSource}
                title={context.name}
                subName={context.subName}
                onPress={() => {
                  // ProductGroup veya SubCategory için PostsScreen'e navigate et
                  if (!context.id || !data.contextType) {
                    return;
                  }
                  
                  const stage = data.contextType === ProductInfoType.PRODUCT_GROUP 
                    ? 'ProductGroup' 
                    : 'SubCategories';
                  
                  navigationService.navigate(ROOT_ROUTES.POST, {
                    screen: 'PostsScreen',
                    params: {
                      stage,
                      name: context.name,
                      productInfo: {
                        image: imageSource,
                        title: context.name,
                        subName: context.subName,
                      },
                      contextType: data.contextType,
                      contextId: context.id,
                    },
                  });
                }}
              />
            </Box>
          );
        })()
      ) : !hideProduct && data.category ? (
        (() => {
          const category = data.category;
          if (!category) return null;

          if (category.product) {
            const productImageSource = toImageSource(category.product.image);
            return (
              <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
                <ProductInfoCard
                  size="small"
                  type={ProductInfoType.PRODUCT}
                  image={productImageSource}
                  title={category.product.name}
                  subName={category.product.subName}
                  onPress={() => {
                    // Product için BrandProductDetailScreen'e navigate et
                    if (category.product?.id) {
                      navigationService.navigateNested(
                        TAB_ROUTES.CATALOG, 
                        'BrandProductDetailScreen' as any, 
                        { 
                        productId: category.product.id 
                        }
                      );
                    }
                  }}
                />
              </Box>
            );
          }

          const categoryImageSource = toImageSource(category.image);
          return (
            <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <ProductInfoCard
                size="small"
                type={ProductInfoType.SUB_CATEGORY}
                image={categoryImageSource}
                title={category.name}
                subName={category.subCategory}
                onPress={() => {
                  // Category için CatalogScreen'e navigate et
                  navigationService.navigateNested(TAB_ROUTES.CATALOG, 'CatalogScreen' as any, undefined);
                }}
              />
            </Box>
          );
        })()
      ) : null}

      {/* Content */}
      <Pressable onPress={() => {
        if (isDetailMode) return; // Detay modunda navigation yapma
        navigationService.navigate(ROOT_ROUTES.POST, {
          screen: 'PostDetailScreen',
          params: { postData: data, type: 'post' }
        });
      }}>
        <VStack px={12} pb={8} pt={hideProduct ? 8 : 0} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize="$xs"
            numberOfLines={isDetailMode ? undefined : (data.images && data.images.length > 0 ? 3 : 6)}
          >
            {data.content}
          </Text>
        </VStack>
      </Pressable>

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
                params: { postData: data, type: 'post' }
              });
            }}
          >
            <VStack px={12} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <CardImageCarousel images={validImages} />
            </VStack>
          </Pressable>
        );
      })()}

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
      
      {/* Boosted Icon - Card'ın sağ alt köşesi */}
      {isBoosted && (
        <Box
          position="absolute"
          bottom={8}
          right={12}
          width={24}
          height={24}
          alignItems="center"
          justifyContent="center"
        >
          <Image
            source={require('@/assets/boost.svg')}
            alt="boosted"
            width={24}
            height={24}
          />
        </Box>
      )}

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
            // Overlay'e tıklanınca menu'yu kapat
            contextMenuCloseRef.current?.();
          }}
        />
      )}
    </VStack >
  );
};

const MemoizedPostCard = memo(PostCard);
MemoizedPostCard.displayName = 'PostCard';
export default MemoizedPostCard;

