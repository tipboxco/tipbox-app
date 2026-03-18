import React, { memo, useState, useEffect } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { View, Platform, Keyboard } from 'react-native';
import { PostCardContextMenu } from '@/src/components/PostCardContextMenu';
import type { PostCardMenuItem } from '@/src/components/PostCardContextMenu';
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
  UserIcon,
  FlagIcon,
} from 'react-native-heroicons/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from 'react-native-heroicons/solid';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import CardImageCarousel from '../../CardImageCarousel';
import ExperiencePostCard from '../ExperiencePostCard';
import { useNavigation } from '@react-navigation/native';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import type { UpdateCardData } from '@/src/types/UpdateCard';
import { toImageSource, formatRelativeTime } from '@/src/utils';
import {
  useLikePost,
  useUnlikePost,
  useBookmarkPost,
  useUnbookmarkPost,
  usePostStatus,
} from '@/src/features/interactions/api/hooks';
import { useReportUser } from '@/src/features/profile/api/hooks';
import type { UserReportCategory } from '@/src/features/profile/api/profileApi';
import { useAppStore } from '@/src/store/appStore';
import { Alert } from 'react-native';
import { useUpdatePost, useDeletePost } from '@/src/features/post/api/hooks';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { ShareToTrustedBottomSheet } from '@/src/features/post/components/ShareToTrustedBottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedCounter } from '@/src/components/AnimatedCounter';
import { useTranslation } from '@/src/hooks/useTranslation';
import { usePostTranslation } from '@/src/hooks/usePostTranslation';

interface UpdatePostCardProps {
  data: UpdateCardData;
  hideProduct?: boolean;
  isDetailMode?: boolean;
  showRelatedPost?: boolean;
  relatedPostData?: any;
  onDelete?: (postId: string) => void;
}

const UpdatePostCard = ({ data, hideProduct = false, isDetailMode = false, showRelatedPost, relatedPostData, onDelete }: UpdatePostCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<any>();
  const { user } = useAppStore();
  const { t, i18n } = useTranslation('post');

  // Translation hooks
  const {
    translatedContent,
    isTranslating,
    showTranslation,
    toggleTranslation,
    shouldTranslate,
  } = usePostTranslation({
    postId: data.id,
    originalContent: data.content || '',
    enabled: isDetailMode,
  });

  const targetUserId = data.user.id;
  const isPostOwner = user?.id && targetUserId && user.id === targetUserId;

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
  const { data: postStatus } = usePostStatus(data.id);
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  const insets = useSafeAreaInsets();
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

  // Transform relatedPost to ExperiencePostCardData for consistent rendering
  const transformedRelatedPost = React.useMemo(() => {
    const rp = data.relatedPost || relatedPostData;
    if (!rp) return null;

    // Use parent update post's user information as the related post's user
    return {
      id: rp.id || '',
      user: data.user,
      contextData: rp.product || { id: '', name: '', subName: '', image: '', isOwned: false },
      contextType: productInfoType,
      content: (rp.content && Array.isArray(rp.content)) ? rp.content : [],
      tags: (rp.tags && Array.isArray(rp.tags)) ? rp.tags : [],
      images: (rp.images && Array.isArray(rp.images)) ? rp.images : [],
      stats: rp.stats || { likes: 0, comments: 0, shares: 0, bookmarks: 0 },
      createdAt: new Date().toISOString(),
    };
  }, [data.relatedPost, relatedPostData, data.user, productInfoType]);

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
    openBottomSheet(
      <ShareToTrustedBottomSheet
        postId={data.id}
        postContent={data.content}
        postAuthorName={data.user?.name}
        onShareSuccess={() => {
          setIsShared(true);
          setSharesCount((prev) => prev + 1);
        }}
        onClose={closeBottomSheet}
      />,
      {
        snapPoints: ['65%', '90%'],
        keyboardBehavior: 'interactive',
        keyboardBlurBehavior: 'restore',
        android_keyboardInputMode: 'adjustResize',
      }
    );
  };

  const handleComment = () => {
    if (isDetailMode) return; // Detay modunda navigation yapma
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'PostDetailScreen',
      params: { 
        postData: data, 
        type: 'update',
        showRelatedPost: true,
        relatedPostData: data.relatedPost,
      },
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

  // Report categories with labels
  const reportCategories = React.useMemo<Array<{ value: UserReportCategory; label: string }>>(() => [
    { value: 'SPAM', label: t('report.categories.spam') },
    { value: 'HARASSMENT', label: t('report.categories.harassment') },
    { value: 'SCAM', label: t('report.categories.scam') },
    { value: 'INAPPROPRIATE_CONTENT', label: t('report.categories.inappropriateContent') },
    { value: 'FAKE_ACCOUNT', label: t('report.categories.fakeAccount') },
    { value: 'OTHER', label: t('report.categories.other') },
  ], [t]);

  const handleReport = React.useCallback(() => {
    if (!user?.id || !targetUserId) return;
    
    const username = data.user?.name || t('card.unknownUser');

    Alert.alert(
      t('report.title'),
      t('report.message', { username }),
      [
        ...reportCategories.map((category) => ({
          text: category.label,
          onPress: () => {
            reportUser(
              {
                userId: user.id,
                targetUserId,
                data: {
                  category: category.value,
                  description: `Reported for: ${category.label}`,
                },
              },
              {
                onSuccess: () => {
                  Alert.alert(t('report.successTitle'), t('report.successMessage'));
                },
                onError: (error: any) => {
                  const errorMessage = error?.response?.data?.message || error?.message || t('report.errorDefault');
                  Alert.alert(t('report.errorTitle'), errorMessage);
                },
              }
            );
          },
        })),
        {
          text: t('report.cancel'),
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }, [user?.id, targetUserId, reportUser, reportCategories, data.user?.name, t]);

  // Post owner actions
  const handleUpdate = React.useCallback(() => {
    // CreateUpdatePostScreen'e yönlendir - update post'u düzenleme modu
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'CreateUpdatePostScreen',
      params: {
        postId: data.id, // Update modu için post ID
        product: product ? {
          id: product.id,
          name: product.name,
          description: product.subName,
          image: toImageSource(product.image),
        } : undefined,
      },
    });
  }, [data, product]);

  const handleDelete = React.useCallback(() => {
    Alert.alert(
      t('delete.confirmTitle'),
      t('delete.confirmMessage'),
      [
        {
          text: t('report.cancel'),
          style: 'cancel',
        },
        {
          text: t('menu.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePostMutation.mutateAsync(data.id);
              onDelete?.(data.id);
              Alert.alert(t('delete.successTitle'), t('delete.successMessage'));
            } catch (error: any) {
              Alert.alert(
                t('delete.errorTitle'),
                error.response?.data?.message || t('delete.errorMessage')
              );
            }
          },
        },
      ]
    );
  }, [data.id, deletePostMutation, t, onDelete]);

  const menuItems = React.useMemo<PostCardMenuItem[]>(() => {
    const iconColor = isDark ? '#fff' : '#000';
    if (isPostOwner) {
      return [
        {
          label: t('menu.delete'),
          icon: <TrashIcon width={20} height={20} color="#FF3040" />,
          onPress: handleDelete,
          color: '#FF3040',
        },
      ];
    }
    return [
      {
        label: t('menu.viewProfile'),
        icon: <UserIcon width={20} height={20} color={iconColor} />,
        onPress: handleViewProfile,
      },
      {
        label: t('menu.report'),
        icon: <FlagIcon width={20} height={20} color="#FF3040" />,
        onPress: handleReport,
        color: '#FF3040',
      },
    ];
  }, [isDark, isPostOwner, t, handleDelete, handleViewProfile, handleReport]);

    return (
        <View
            style={{
                backgroundColor: isDark ? '#000000' : '#FFFFFF',
                position: 'relative',
            }}
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
            <VStack
              flex={1}
              justifyContent="center"
            >
              <HStack alignItems="center">
                <Text
                  color={isDark ? '$textDark50' : '#000'}
                  fontSize="$sm"
                  fontWeight="$bold"
                >
                  {data.user?.name || t('card.unknownUser')}
                </Text>
                {data.createdAt ? (
                  <Text
                    color={isDark ? '$textDark400' : '#A3A3A3'}
                    fontSize={11}
                  >
                    {`  •  ${formatRelativeTime(data.createdAt, i18n.language)}`}
                  </Text>
                ) : null}
              </HStack>
              {data.user?.title ? (
                <Text
                  color={isDark ? '$textDark400' : '#787878'}
                  fontSize="$xs"
                  numberOfLines={1}
                  maxWidth={250}
                >
                  {data.user.title}
                </Text>
              ) : null}
            </VStack>
          </Pressable>
          <PostCardContextMenu items={menuItems}>
            <EllipsisHorizontalIcon width={24} height={24} color={isDark ? '#fff' : '#A3A3A3'} />
          </PostCardContextMenu>
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
                  isOwned: product.isOwned,
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
            {t('card.badges.update')}
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
              showRelatedPost: true,
              relatedPostData: data.relatedPost,
            }
          });
        }}>
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize="$sm"
            lineHeight={18}
            numberOfLines={isDetailMode ? undefined : (data.images && data.images.length > 0 ? 3 : 6)}
          >
            {data.content}
          </Text>
        </Pressable>

        {/* See Related Post Button - Sadece feed'de göster (detay ekranında showRelatedPost true olduğu için gerek yok) */}
        {!isDetailMode && data.relatedPost && (
          <Pressable 
            onPress={() => {
              // Detay sayfasına yönlendir (related post detay sayfasında açılacak)
              navigationService.navigate(ROOT_ROUTES.POST, {
                screen: 'PostDetailScreen',
                params: { 
                  postData: data, 
                  type: 'update',
                  showRelatedPost: true,
                  relatedPostData: data.relatedPost,
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
              {t('card.seeRelatedPost')}
            </Text>
          </Pressable>
        )}
      </VStack>

      {/* Translated Content - only in detail mode */}
      {isDetailMode && showTranslation && translatedContent && (
        <VStack px={12} pb={4} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9" space="xs">
          <Box height={1} bg={isDark ? '#333' : '#E9E9E9'} />
          <Text
            color={isDark ? '$textDark200' : '#666'}
            fontSize="$sm"
            fontStyle="italic"
          >
            {translatedContent}
          </Text>
        </VStack>
      )}

      {/* Translate Button - only in detail mode */}
      {isDetailMode && shouldTranslate && (
        <Box pb="$2" px="$3" borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <Pressable onPress={toggleTranslation}>
            <HStack alignItems="center" space="xs">
              <Image
                source={require('@/assets/translate.png')}
                alt="translate"
                width={16}
                height={16}
              />
              <Text
                color="#829905"
                fontSize="$sm"
                textDecorationLine="underline"
              >
                {isTranslating
                  ? t('card.translate.translating')
                  : showTranslation
                  ? t('card.translate.hideTranslation')
                  : t('card.translate.translate')}
              </Text>
            </HStack>
          </Pressable>
        </Box>
      )}

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
                params: {
                  postData: data,
                  type: 'update',
                  showRelatedPost: true,
                  relatedPostData: data.relatedPost,
                }
              });
            }}
          >
            <VStack px={12} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <CardImageCarousel images={validImages} isDetailMode={isDetailMode} />
            </VStack>
          </Pressable>
        );
      })()}

      {/* Related Post Details - Render using ExperiencePostCard for consistent display */}
      {showRelatedPost && transformedRelatedPost && (
        <ExperiencePostCard
          data={transformedRelatedPost}
          isDetailMode={isDetailMode}
          showHeader={false}
          showActions={false}
          hideProduct={false}
        />
      )}

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

    </View>
    );
};

export default memo(UpdatePostCard);

