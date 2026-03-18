import React, { useState, useEffect, useCallback } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { View } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
// Heroicons imports
import {
  EllipsisHorizontalIcon,
  QuestionMarkCircleIcon,
  PaperAirplaneIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  BookmarkIcon,
  TrashIcon,
  UserIcon,
  FlagIcon,
  RocketLaunchIcon,
} from 'react-native-heroicons/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from 'react-native-heroicons/solid';
import { QuestionPost } from '@/src/mock/profile/questions/types';
import type { QuestionCardData } from '@/src/types/QuestionCard';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import { PostCardContextMenu } from '@/src/components/PostCardContextMenu';
import type { PostCardMenuItem } from '@/src/components/PostCardContextMenu';
import CardImageCarousel from '../../CardImageCarousel';
import { useNavigation } from '@react-navigation/native';
import { navigationService } from '@/src/services/NavigationService';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
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
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { useUpdatePost, useDeletePost, useTogglePostBoost } from '@/src/features/post/api/hooks';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { PostOptionsMenu } from '@/src/components/PostOptionsMenu';
import { ShareToTrustedBottomSheet } from '@/src/features/post/components/ShareToTrustedBottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedCounter } from '@/src/components/AnimatedCounter';
import { useTranslation } from '@/src/hooks/useTranslation';
import { usePostTranslation } from '@/src/hooks/usePostTranslation';

interface QuestionPostCardProps {
  data: QuestionPost | QuestionCardData; // Accept both types for compatibility
  hideProduct?: boolean;
  isDetailMode?: boolean;
  onDelete?: (postId: string) => void;
}

export const QuestionPostCard = ({ data, hideProduct = false, isDetailMode = false, onDelete }: QuestionPostCardProps) => {
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
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isShared, setIsShared] = useState(false);
  
  // Boost state (backend bazen is_boosted/boosted_until snake_case döner)
  const resolvedIsBoosted = data.isBoosted ?? (data as { is_boosted?: boolean }).is_boosted ?? false;
  const resolvedBoostedUntil = data.boostedUntil ?? (data as { boosted_until?: string }).boosted_until;
  const [isBoosted, setIsBoosted] = useState(resolvedIsBoosted);
  const [boostedUntil, setBoostedUntil] = useState<string | undefined>(resolvedBoostedUntil);
  const [boostPrice, setBoostPrice] = useState(data.boostPrice);
  // Boost badge sadece süre dolmamışsa gösterilir
  const isBoostActive = isBoosted && boostedUntil && new Date(boostedUntil) > new Date();
  
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
  const insets = useSafeAreaInsets();
  const { mutate: reportUser } = useReportUser();
  const updatePostMutation = useUpdatePost();
  const deletePostMutation = useDeletePost();
  const toggleBoostMutation = useTogglePostBoost();

  // Sync with post status from API
  useEffect(() => {
    if (postStatus) {
      setIsLiked(postStatus.liked);
      setIsBookmarked(postStatus.favorited);
      setIsShared(postStatus.shared);
    }
  }, [postStatus]);

  // Sync boost state with data prop changes (isBoosted, boostedUntil, snake_case fallback)
  useEffect(() => {
    const v = data.isBoosted ?? (data as { is_boosted?: boolean }).is_boosted ?? false;
    const until = data.boostedUntil ?? (data as { boosted_until?: string }).boosted_until;
    setIsBoosted(v);
    setBoostedUntil(until);
    setBoostPrice(data.boostPrice);
  }, [data]);

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

  const handleShare = useCallback(() => {
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
  }, [data.id, data.content, data.user?.name, openBottomSheet, closeBottomSheet]);

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
  const handleUpdate = useCallback(() => {
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

  // Boost toggle handler
  const handleBoostToggle = useCallback((value: boolean) => {
    // Optimistic update
    setIsBoosted(value);
    
    toggleBoostMutation.mutate(
      { postId: data.id, enabled: value },
      {
        onSuccess: (response) => {
          // Backend'den gelen güncel değerleri ayarla
          setIsBoosted(response.isBoosted);
          setBoostPrice(response.boostPrice);
          
          Alert.alert(
            t('card.boost.success'),
            value
              ? (response.boostPrice ? t('card.boost.activatedWithCost', { price: response.boostPrice }) : t('card.boost.activated'))
              : t('card.boost.deactivated')
          );
        },
        onError: (error: any) => {
          // Hata durumunda geri al
          setIsBoosted(!value);

          const errorMessage = error?.response?.data?.message || error?.message || t('card.boost.errorMessage');
          Alert.alert(t('card.boost.errorTitle'), errorMessage);
        },
      }
    );
  }, [data.id, toggleBoostMutation]);

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
                    isOwned: data.category.product.isOwned,
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
      <HStack px={12} pb={8} pt={hideProduct ? 8 : 0} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9" gap={8} alignItems="center">
          <Box
            borderWidth={2}
            borderColor="#B8CC04"
            bgColor="#758600"
            borderRadius={20}
            px={10}
            py={6}
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
          >
            <QuestionMarkCircleIcon width={12} height={12} color={'#fff'} />
            <Text
              fontSize={8}
              fontWeight="$semibold"
              ml={5}
              color={'#fff'}
            >
              {t('card.badges.question')}
            </Text>
          </Box>

          {isBoostActive && (
            <Box
              borderWidth={2}
              borderColor="#EF4D81"
              bgColor="#E0195B"
              borderRadius={20}
              px={10}
              py={6}
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
            >
              <RocketLaunchIcon width={12} height={12} color="#fff" />
              <Text fontSize={8} fontWeight="$semibold" ml={5} color="#fff">
                {t('card.badges.boosted')}
              </Text>
            </Box>
          )}
      </HStack>

      {/* Content - Boost Post sadece 3 nokta menüde (doğru tasarım: badge ile içerik arasında değil) */}
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
            fontSize="$sm"
            lineHeight={18}
            numberOfLines={isDetailMode ? undefined : (data.images && data.images.length > 0 ? 3 : 6)}
          >
            {data.content}
          </Text>
        </VStack>
      </Pressable>

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
                params: { postData: data, type: 'question' }
              });
            }}
          >
            <VStack px={12} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <CardImageCarousel images={validImages} isDetailMode={isDetailMode} />
            </VStack>
          </Pressable>
        );
      })()}

      {/* Stats */}
      <HStack
        px={12}
        py={12}
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

// PERFORMANCE FIX: Memoize component to prevent unnecessary re-renders in feed lists
export default React.memo(QuestionPostCard);

