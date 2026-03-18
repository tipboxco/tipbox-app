import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { PostCardContextMenu } from '@/src/components/PostCardContextMenu';
import type { PostCardMenuItem } from '@/src/components/PostCardContextMenu';
import { useColorMode } from '@/src/hooks/useColorMode';
// Heroicons imports
import {
  EllipsisHorizontalIcon,
  TagIcon,
  CubeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  BookmarkIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  FlagIcon,
  ArrowUpCircleIcon,
} from 'react-native-heroicons/outline';
import {
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from 'react-native-heroicons/solid';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import CardImageCarousel from '../../CardImageCarousel';
import { useNavigation } from '@react-navigation/native';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { toImageSource, formatRelativeTime } from '@/src/utils';
import type { ExperiencePostCardData } from '@/src/types/ExperienceCard';
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
import { AnimatedCounter } from '@/src/components/AnimatedCounter';
import { useTranslation } from '@/src/hooks/useTranslation';
import { usePostTranslation } from '@/src/hooks/usePostTranslation';


interface PostCardProps {
  data: ExperiencePostCardData;
  hideProduct?: boolean;
  isDetailMode?: boolean;
  /** When provided, card content tap calls this instead of navigating to PostDetailScreen (e.g. select-for-update flow) */
  onCardPress?: () => void;
  /** Hide user header (avatar, name, menu). Used when card is embedded as "Related Post" in update detail. */
  showHeader?: boolean;
  /** Hide action bar (like, comment, share, bookmark). Used when card is embedded as "Related Post" in update detail. */
  showActions?: boolean;
  onDelete?: (postId: string) => void;
}

// Map known content tag titles to translation keys
const CONTENT_TAG_TITLE_KEYS: Record<string, string> = {
  'Price and Shopping Experience': 'post:create.experience.step3.priceAndShopping',
  'Product and Usage Experience': 'post:create.experience.step3.productAndUsage',
};

export const ExperiencePostCard = ({ data, hideProduct = false, isDetailMode = false, onCardPress, showHeader = true, showActions = true, onDelete }: PostCardProps) => {
  const { colorMode } = useColorMode();
  const { t, i18n } = useTranslation();
  const isDark = colorMode === 'dark';

  // Translation hooks - content array'den text'leri birleştir
  const contentText = Array.isArray(data.content)
    ? data.content.map(item => item.text).join('\n\n')
    : '';
  const {
    translatedContent,
    isTranslating,
    showTranslation,
    toggleTranslation,
    shouldTranslate,
  } = usePostTranslation({
    postId: data.id,
    originalContent: contentText,
    enabled: isDetailMode,
  });

  // Translate content tag title (e.g. "Price and Shopping Experience" → TR)
  const translateTagTitle = useCallback((title: string) => {
    const key = CONTENT_TAG_TITLE_KEYS[title];
    if (key) return t(key);
    return title;
  }, [t]);

  // Translate usage context tags (e.g. "3-6 months", "Other", "Personal use" → TR)
  const translateTag = useCallback((tag: string) => {
    const key = `post:create.experience.step1.optionNames.${tag}`;
    const keyWithoutNs = `create.experience.step1.optionNames.${tag}`;
    const translated = t(key);
    // If translation key not found, t() may return key with or without namespace prefix
    if (translated === key || translated === keyWithoutNs) return tag;
    return translated;
  }, [t]);
  const navigation = useNavigation<any>();
  const { user } = useAppStore();
  const targetUserId = data.user.id;
  const isPostOwner = user?.id && targetUserId && user.id === targetUserId;
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  
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

  const handleShare = useCallback(() => {
    // Share işlemini her zaman aç - kullanıcı istediği kadar share edebilsin
    openBottomSheet(
      <ShareToTrustedBottomSheet
        postId={data.id}
        postContent={data.content?.[0]?.content ?? ''}
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
      params: { postData: data, type: 'experience' },
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
    { value: 'SPAM', label: t('common:report.categories.spam') },
    { value: 'HARASSMENT', label: t('common:report.categories.harassment') },
    { value: 'SCAM', label: t('common:report.categories.scam') },
    { value: 'INAPPROPRIATE_CONTENT', label: t('common:report.categories.inappropriate') },
    { value: 'FAKE_ACCOUNT', label: t('common:report.categories.fakeAccount') },
    { value: 'OTHER', label: t('common:report.categories.other') },
  ], [t]);

  const handleReport = React.useCallback(() => {
    if (!user?.id || !targetUserId) return;

    const username = data.user?.name || 'User';

    // Report category seçimi için alert
    Alert.alert(
      t('common:report.reportUserTitle'),
      t('common:report.reasonQuestion', { username }),
      [
        ...reportCategories.map((category) => ({
          text: category.label,
          onPress: () => {
            // Seçilen kategori ile raporla
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
                  Alert.alert(t('common:report.successTitle'), t('common:report.successMessage'));
                },
                onError: (error: any) => {
                  const errorMessage = error?.response?.data?.message || error?.message || t('post:report.errorDefault');
                  Alert.alert(t('common:report.errorTitle'), errorMessage);
                },
              }
            );
          },
        })),
        {
          text: t('common:buttons.cancel'),
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }, [user?.id, targetUserId, reportUser, reportCategories, data.user?.name, t]);

  // Post owner actions
  const handleUpdate = React.useCallback(() => {
    // CreateUpdatePostScreen'e yönlendir - experience post bilgileriyle
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'CreateUpdatePostScreen',
      params: {
        experiencePostId: data.id, // Experience post ID (update bu post'a bağlanacak)
        experiencePost: {
          id: data.id,
          content: data.content,
          images: data.images,
          product: {
            id: data.contextData?.id || '',
            name: data.contextData?.name || '',
            subName: data.contextData?.subName || '',
            image: data.contextData?.image,
          },
        },
        product: data.contextData ? {
          id: data.contextData.id,
          name: data.contextData.name,
          description: data.contextData.subName,
          image: data.contextData.image,
        } : undefined,
      },
    });
  }, [data]);

  const handleDelete = React.useCallback(() => {
    Alert.alert(
      t('post:delete.confirmTitle'),
      t('post:delete.confirmMessage'),
      [
        {
          text: t('common:buttons.cancel'),
          style: 'cancel',
        },
        {
          text: t('common:buttons.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePostMutation.mutateAsync(data.id);
              onDelete?.(data.id);
              Alert.alert(t('post:delete.successTitle'), t('post:delete.successMessage'));
            } catch (error: any) {
              Alert.alert(
                t('post:delete.errorTitle'),
                error.response?.data?.message || t('post:delete.errorMessage')
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
          label: t('post:menu.update'),
          icon: <PencilIcon width={20} height={20} color={iconColor} />,
          onPress: handleUpdate,
        },
        {
          label: t('post:menu.delete'),
          icon: <TrashIcon width={20} height={20} color="#FF3040" />,
          onPress: handleDelete,
          color: '#FF3040',
        },
      ];
    }
    return [
      {
        label: t('common:menu.viewProfile'),
        icon: <UserIcon width={20} height={20} color={iconColor} />,
        onPress: handleViewProfile,
      },
      {
        label: t('common:menu.report'),
        icon: <FlagIcon width={20} height={20} color="#FF3040" />,
        onPress: handleReport,
        color: '#FF3040',
      },
    ];
  }, [isDark, isPostOwner, t, handleUpdate, handleDelete, handleViewProfile, handleReport]);

  return (
    <View
      style={{
        backgroundColor: isDark ? '#000000' : '#FFFFFF',
        position: 'relative',
      }}
    >
      {/* Header - hidden when embedded as Related Post in update detail */}
      {showHeader && (
        <VStack px={12} py={8} borderWidth={1} borderTopRightRadius={5} borderTopLeftRadius={5} borderColor="#E9E9E9">
          <HStack alignItems="center" space="xs">
            {data.user && toImageSource(data.user.avatar) && (
              <Pressable onPress={handleViewProfile}>
                <Image
                  source={toImageSource(data.user.avatar)!}
                  alt={data.user?.name || 'User'}
                  mr={8}
                  width={48}
                  height={48}
                  borderRadius={100}
                />
              </Pressable>
            )}
            <Pressable flex={1} onPress={handleViewProfile}>
              <VStack
                flex={1}
                justifyContent="center"
              >
                {data.user?.action ? (
                  <HStack alignItems="center" space="xs" mb={1}>
                    <ArrowUpCircleIcon width={14} height={14} color={isDark ? '$textDark400' : '#C7C7C7'} />
                    <Text
                      color={isDark ? '$textDark400' : '#C7C7C7'}
                      fontSize={9}
                      fontWeight="$semibold"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                      flex={1}
                    >
                      {data.user.action}
                    </Text>
                  </HStack>
                ) : null}
                <HStack alignItems="center">
                  <Text
                    color={isDark ? '$textDark50' : '#000'}
                    fontSize='$sm'
                    fontWeight="$bold"
                  >
                    {data.user?.name || t('post:card.unknownUser')}
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
                    fontSize={11}
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
      )}

      {/* Product */}
      {
        !hideProduct && data.contextData && (
          <Box
            px={12}
            py={8}
            borderRightWidth={1}
            borderLeftWidth={1}
            borderColor="#E9E9E9"
            {...(!showHeader && { borderTopWidth: 1, borderTopLeftRadius: 5, borderTopRightRadius: 5 })}
          >
            <VStack space="xs">
              <ProductInfoCard
                size="small"
                type={data.contextType || ProductInfoType.PRODUCT}
                image={toImageSource(data.contextData.image)}
                title={data.contextData.name}
                subName={data.contextData.subName && !/^Status:\s*(tested|own)$/i.test(String(data.contextData.subName)) ? data.contextData.subName : undefined}
                ownershipLabel={data.contextData?.isOwned ? t('post:card.owned') : t('post:card.tried')}
                onPress={() => {
                if (!data.contextData?.id) return;

                const contextType = data.contextType || ProductInfoType.PRODUCT;
                const stage = contextType === ProductInfoType.SUB_CATEGORY ? 'SubCategories'
                  : contextType === ProductInfoType.PRODUCT_GROUP ? 'ProductGroup'
                  : 'Product';

                navigationService.navigate(ROOT_ROUTES.POST, {
                  screen: 'PostsScreen',
                  params: {
                    stage,
                    name: data.contextData.name,
                    productInfo: {
                      image: toImageSource(data.contextData.image),
                      title: data.contextData.name,
                      subName: data.contextData.subName,
                    },
                    ...(contextType === ProductInfoType.PRODUCT && {
                      selectedProduct: {
                        id: data.contextData.id,
                        name: data.contextData.name,
                        description: data.contextData.subName,
                        image: toImageSource(data.contextData.image),
                      },
                    }),
                    contextType,
                    contextId: data.contextData.id,
                    isOwned: data.contextData.isOwned,
                  },
                });
              }}
              />
            </VStack>
          </Box>
        )
      }


      {/* Content */}
      <Pressable onPress={() => {
        if (isDetailMode) return; // Detay modunda navigation yapma
        if (onCardPress) {
          onCardPress();
          return;
        }
        navigationService.navigate(ROOT_ROUTES.POST, {
          screen: 'PostDetailScreen',
          params: { postData: data, type: 'experience' }
        });
      }}>
        <VStack
          px={12}
          pb={8}
          pt={hideProduct ? 8 : 0}
          borderRightWidth={1}
          borderLeftWidth={1}
          borderBottomWidth={data.tags && data.tags.length > 0 ? 0 : 1}
          borderColor="#E9E9E9"
          {...(!showHeader && !data.contextData && { borderTopWidth: 1, borderTopLeftRadius: 5, borderTopRightRadius: 5 })}
          {...(!data.tags || data.tags.length === 0) && !data.images && { borderBottomLeftRadius: 5, borderBottomRightRadius: 5 }}
        >
          {Array.isArray(data.content) && data.content.length > 0 ? (
            data.content.map((item, index) => (
              <VStack key={index} py={10} space="xs">
                <HStack space="sm" alignItems="center">
                  {item.tag.icon === 'package' ? (
                    <CubeIcon width={18} height={18} color={isDark ? '#fff' : '#000'} />
                  ) : (
                    <TagIcon width={18} height={18} color={isDark ? '#fff' : '#000'} />
                  )}
                  <Text
                    color={isDark ? '$textDark50' : '#000'}
                    fontSize="$sm"
                    fontWeight="$bold"
                  >
                    {translateTagTitle(item.tag.title)}
                  </Text>
                </HStack>
                <Text
                  color={isDark ? '$textDark50' : '#343434'}
                  fontSize="$sm"
                  lineHeight={18}
                  ml={26}
                  numberOfLines={isDetailMode ? undefined : (data.images && data.images!.length > 0 ? 3 : 6)}
                >
                  {item.text}
                </Text>
                <HStack ml={26} mt={6} space="xs">
                  {item.rating.map((star, idx) => (
                    <StarIconSolid
                      key={idx}
                      width={16}
                      height={16}
                      color={star ? '#829905' : (isDark ? '#7E7E7E' : '#D4D4D4')}
                    />
                  ))}
                </HStack>
              </VStack>
            ))
          ) : null}
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
                  ? t('post:card.translate.translating')
                  : showTranslation
                  ? t('post:card.translate.hideTranslation')
                  : t('post:card.translate.translate')}
              </Text>
            </HStack>
          </Pressable>
        </Box>
      )}

      {/* Usage Context: Duration, Condition, Purpose - Owned/Tried sadece product (ProductInfoCard) içinde. */}
      {data.tags && data.tags.length > 0 && (
        <HStack
          px={12}
          py={5}
          borderRightWidth={1}
          borderLeftWidth={1}
          borderBottomWidth={(!data.images || data.images.length === 0) && !showActions ? 1 : 0}
          borderColor="#E9E9E9"
          {...((!data.images || data.images.length === 0) && !showActions && { borderBottomLeftRadius: 5, borderBottomRightRadius: 5 })}
          flexDirection="row"
          flexWrap="wrap"
          justifyContent="flex-start"
          alignItems="center"
          gap={8}
        >
          {data.tags.slice(0, 3).map((value, index) => {
            if (value == null || value === '') return null;
            return (
              <Box
                key={index}
                borderRadius="$full"
                px={10}
                py={4}
                bg={isDark ? 'rgba(255,255,255,0.15)' : '#FFFFFF'}
                borderWidth={1}
                borderColor="#E9E9E9"
              >
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={11}
                  fontWeight="$semibold"
                >
                  {translateTag(value)}
                </Text>
              </Box>
            );
          })}
        </HStack>
      )}

      {(() => {
        const validImages = data.images?.map(img => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img) || [];
        if (validImages.length === 0) return null;
        return (
          <Pressable
            onPress={() => {
              if (isDetailMode) return; // Detay modunda navigation yapma
              navigationService.navigate(ROOT_ROUTES.POST, {
                screen: 'PostDetailScreen',
                params: { postData: data, type: 'experience' }
              });
            }}
          >
            <VStack
              px={12}
              borderRightWidth={1}
              borderLeftWidth={1}
              borderBottomWidth={!showActions ? 1 : 0}
              borderColor="#E9E9E9"
              {...(!showActions && { borderBottomLeftRadius: 5, borderBottomRightRadius: 5 })}
            >
              <CardImageCarousel images={validImages} isDetailMode={isDetailMode} />
            </VStack>
          </Pressable>
        );
      })()}
      {/* Stats - hidden when embedded as Related Post in update detail */}
      {showActions && (
        <HStack px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderBottomWidth={1} borderBottomRightRadius={5} borderBottomLeftRadius={5} borderColor="#E9E9E9"
        >
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
      )}
    </View>
  );
};

export default ExperiencePostCard;
