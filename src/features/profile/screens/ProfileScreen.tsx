import React, { useState, useMemo, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ActivityIndicator, StyleSheet, ScrollView, Alert, Dimensions, RefreshControl, Pressable as RNPressable, View, Modal as RNModal, Text as RNText, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, Pressable, HStack, VStack, Image, Modal, ModalBackdrop, ModalContent, Divider } from '@gluestack-ui/themed';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
} from 'react-native-reanimated';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useUserProfile, useUserPosts, useUserReviews, useUserBenchmarks, useUserTipsAndTricks, useUserReplies, useAddToTrustList, useRemoveFromTrustList, useReportUser, useMuteUser, useUnmuteUser, profileKeys } from '../api/hooks';
import { useSendGift, useCreateSupportRequest, useSendDirectMessage } from '@/src/features/inbox/api/hooks';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { navigateToSharedScreenWithPruning } from '@/src/utils/navigation/sharedScreenNavigation';
import { Keyboard, Platform } from 'react-native';
import { useAppStore } from '@/src/store/appStore';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@gluestack-ui/themed';
import { showCustomToast } from '@/src/components/CustomToast';
import { ProfileStackParamList } from '../navigation';
import { toImageSource, useSafeAreaValues, useBottomOffset, isSameImageSource } from '@/src/utils';
import { SendTipsModal } from '../components/SendTipsModal';
import { CardType, ProductInfoType } from '@/src/types/common';
import type { PostCardData } from '@/src/types/PostCard';
import type { ExperiencePostCardData, ExperiencePostCardContentItem, ExperiencePostApiContentBlock } from '@/src/types/ExperienceCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { UpdateCardData } from '@/src/types/UpdateCard';
import type { ProfilePost, ProfileReview, UserProfile } from '../types';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import PostCard from '@/src/components/PostCards/PostCard';
import UpdatePostCard from '@/src/components/PostCards/UpdatePostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import CollectionsTab from '@/src/features/events/components/TabContents/CollectionsTab';
import {
  FlagIcon,
  NoSymbolIcon,
  ChevronLeftIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  GiftIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  BellIcon,
  BellSlashIcon,
  UserMinusIcon,
  UserPlusIcon,
  PlusIcon,
  CheckBadgeIcon,
} from 'react-native-heroicons/outline';
import { FeedSkeleton } from '@/src/components/Skeletons';
import BadgeBottomSheet from '@/src/features/events/components/BadgeBottomSheet';
import type { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import type { Badge } from '../types';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { AnimatedTabBar } from '../components/AnimatedTabBar';
import { useFullScreenImage } from '@/src/hooks/useFullScreenImage';
import { FullScreenImageViewer } from '@/src/components/FullScreenImageViewer';
// PagerView removed - using single FlatList with touch-based swipe for tab switching

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TAB_KEYS = ['feed', 'reviews', 'benchmarks', 'tips', 'replies', 'badge', 'collections'] as const;

// Tab title translation key mapping
const TAB_TITLE_KEYS: Record<string, string> = {
  feed: 'tabs.feed',
  reviews: 'tabs.reviews',
  benchmarks: 'tabs.benchmarks',
  tips: 'tabs.tipsAndTricks',
  replies: 'tabs.replies',
  badge: 'tabs.badge',
  collections: 'tabs.collections',
};

type TabKey = typeof TAB_KEYS[number];

type ProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;

// Mapping functions (FeedTab'tan alındı)
const mapPostToCardData = (post: ProfilePost): PostCardData | null => {
  if (!post?.id || !post?.user?.id) {
    return null;
  }
  
  const contextImage = post?.contextData?.image
    ? toImageSource(post.contextData.image)
    : undefined;

  const contentString = Array.isArray(post?.content)
    ? post.content.map((item) => item?.content || '').join(' ')
    : (post?.content || '');

  const defaultPostImage = require('@/assets/defaultImages/default-post.png');
  const avatarSource = toImageSource(post.user?.avatar) || require('@/assets/avatar/default-useravatar.png');

  // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
  const mappedImages = post.images
    ?.map((img) => toImageSource(img))
    .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
  const images = mappedImages;

  return {
    id: post.id,
    user: {
      id: post.user.id,
      name: post.user.name || '',
      title: post.user.title || '',
      avatar: avatarSource,
    },
    content: contentString,
    images,
    stats: {
      likes: post.stats.likes,
      comments: post.stats.comments || 0,
      shares: post.stats.shares,
      bookmarks: post.stats.bookmarks,
    },
    createdAt: post.createdAt,
    contextType: post?.contextType,
    contextData: post?.contextData
      ? {
          id: post.contextData.id,
          name: post.contextData.name || '',
          subName: post.contextData.subName || '',
          image: contextImage || post.contextData?.image || require('@/assets/defaultImages/default-post.png'),
          isOwned: post.contextData.isOwned,
        }
      : undefined,
  };
};

const mapExperienceToCardData = (review: ProfileReview): ExperiencePostCardData | null => {
  if (!review?.id || !review?.user?.id) {
    return null;
  }
  
  const avatarSource = review.user?.avatar
    ? toImageSource(review.user.avatar)!
      : require('@/assets/avatar/default-useravatar.png');
  
  // API bazen product bazen contextData döner - ikisini de kontrol et
  // Reviews endpoint bazen contextData.product nested yapısı döner
  const productData = review.product || (review.contextData as any)?.product || review.contextData;
  const productImage = productData?.image
    ? toImageSource(productData.image)
    : undefined;

  const contentBlocks = review.experienceContent ?? (Array.isArray(review.content) ? review.content : []);
  const content: ExperiencePostCardContentItem[] = contentBlocks.map((item: ExperiencePostApiContentBlock) => ({
    tag: {
      icon: (item?.title?.toLowerCase?.().includes('product') || item?.title?.toLowerCase?.().includes('usage')) ? 'package' as const : 'tag' as const,
      title: item?.title || '',
    },
    text: item?.content || '',
    rating: Array(5)
      .fill(false)
      .map((_, index) => index < (item?.rating ?? 0)),
  }));

  return {
    id: review.id,
    user: {
      id: review.user.id,
      name: review.user.name || 'Unknown',
      title: review.user.title || '',
      avatar: avatarSource,
      action: i18n.t('post:card.addedToInventory'),
    },
    contextData: {
      id: productData?.id || '',
      name: productData?.name || '',
      subName: productData?.subName || '',
      image: productImage,
      isOwned: productData?.isOwned,
    },
    content,
    tags: review.tags?.slice(0, 3) ?? [],
    images: (() => {
      const mapped = review.images
        ?.map((img) => toImageSource(img))
        .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
      return mapped.filter((img) => !isSameImageSource(img, productImage));
    })(),
    stats: review.stats,
    createdAt: review.createdAt,
  };
};

const mapBenchmarkToCardData = (item: BenchmarkApiItem): BenchmarkCardData | null => {
  if (!item?.id || !item?.user?.id) {
    return null;
  }
  
  const avatarSource = toImageSource(item.user.avatar) || require('@/assets/avatar/default-useravatar.png');
  const products: BenchmarkProduct[] = (item?.products || [])
    .filter((p) => p?.id) // Filter out invalid products
    .map((p) => ({
      id: p.id || '',
      name: p?.name || '',
      subName: p?.subName || '',
      image: toImageSource(p?.image) || require('@/assets/inventory/product_01.png'),
      isOwned: p?.isOwned || false,
      choice: p?.choice || false,
    }));

  return {
    id: item.id,
    user: {
      id: item.user.id,
      name: item.user.name,
      title: item.user.title,
      avatar: avatarSource,
    },
    products,
    content: item.content,
    stats: item.stats,
    createdAt: item.createdAt,
  };
};

const mapTipsToCardData = (item: TipsApiItem): TipsCardData | null => {
  if (!item?.contextData?.id) {
    return null;
  }
  
  const avatarSource = toImageSource(item?.user?.avatar) || require('@/assets/avatar/default-useravatar.png');
  const contextImage = toImageSource(item.contextData?.image) || require('@/assets/inventory/product_01.png');
  const product: TipsProduct = {
    id: item.contextData.id,
    name: item.contextData.name || '',
    subName: item.contextData.subName || '',
    image: contextImage,
  };
  const category: TipsCategory = {
    id: item.contextData.id,
    name: item.contextData.name || '',
    subCategory: item.contextData.subName || '',
    image: contextImage,
    product,
  };

  return {
    id: item.id,
    user: {
      id: item.user.id,
      name: item.user.name,
      title: item.user.title,
      avatar: avatarSource,
    },
    category,
    content: item.content,
    images: item.images
      ?.map((img) => toImageSource(img))
      .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource),
    stats: item.stats,
    tag: item.tag,
    benefitCategory: item.benefitCategory,
    createdAt: item.createdAt,
  };
};

const mapQuestionToCardData = (item: QuestionApiItem): QuestionCardData | null => {
  if (!item?.id || !item?.user?.id) {
    return null;
  }

  const avatarSource = toImageSource(item?.user?.avatar) || require('@/assets/avatar/default-useravatar.png');
  // contextData boş obje ({}) olabilir veya id içermeyebilir - handle et
  const contextId = item.contextData?.id || '';
  const contextName = item.contextData?.name || '';
  const contextSubName = item.contextData?.subName || '';
  const contextImage = toImageSource(item.contextData?.image) || require('@/assets/inventory/product_01.png');
  const product: QuestionCardProduct = {
    id: contextId,
    name: contextName,
    subName: contextSubName,
    image: contextImage,
  };
  const category: QuestionCardCategory = {
    id: contextId,
    name: contextName,
    subCategory: contextSubName,
    image: contextImage,
    product,
  };

  // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
  const mappedImages = item.images
    ?.map((img) => toImageSource(img))
    .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
  const images = mappedImages;

  return {
    id: item.id,
    user: {
      id: item.user.id,
      name: item.user.name,
      title: item.user.title,
      avatar: avatarSource,
    },
    category,
    content: item.content,
    isBoosted: item.isBoosted,
    boostedUntil: item.boostedUntil,
    boostPrice: item.boostPrice,
    images,
    stats: item.stats,
    createdAt: item.createdAt,
  };
};

/** Map /users/{id}/reviews API update item to UpdateCardData (contextData.product, relatedPost.experienceContent) */
const mapUpdateToCardData = (item: any): UpdateCardData => {
  const defaultPostImage = require('@/assets/defaultImages/default-post.png');
  const avatarSource = toImageSource(item.user?.avatar) || require('@/assets/avatar/default-useravatar.png');
  let productInfoType = ProductInfoType.PRODUCT;
  if (item.contextType === 'product_group') productInfoType = ProductInfoType.PRODUCT_GROUP;
  else if (item.contextType === 'sub_category') productInfoType = ProductInfoType.SUB_CATEGORY;

  const productFromContext = item.contextData?.product ?? item.contextData;
  const rp = item.relatedPost;

  const productForCard = (p: any) => ({
    id: p?.id ?? '',
    name: p?.name ?? '',
    subName: p?.subName ?? '',
    image: toImageSource(p?.image) ?? defaultPostImage,
    isOwned: p?.isOwned ?? false,
  });

  if (!rp) {
    return {
      id: item.id,
      user: { id: item.user?.id ?? '', name: item.user?.name ?? '', title: item.user?.title ?? '', avatar: avatarSource },
      stats: item.stats ?? { likes: 0, comments: 0, shares: 0, bookmarks: 0 },
      createdAt: item.createdAt ?? '',
      contextType: productInfoType,
      product: productFromContext ? productForCard(productFromContext) : { id: '', name: '', subName: '', image: defaultPostImage, isOwned: false },
      content: typeof item.content === 'string' ? item.content : '',
      images: Array.isArray(item.images) ? item.images.map((img: any) => toImageSource(img)).filter(Boolean) : [],
      relatedPost: undefined,
    };
  }

  const experienceContent = rp.experienceContent ?? (Array.isArray(rp.content) ? rp.content : []);
  const relatedPostContent = experienceContent.map((block: any) => {
    const ratingVal = typeof block?.rating === 'number' ? Math.min(5, Math.max(0, block.rating)) : 0;
    const ratingArray: number[] = Array(5).fill(0);
    for (let i = 0; i < ratingVal; i++) ratingArray[i] = 1;
    return {
      tag: {
        icon: (block?.title?.toLowerCase?.().includes('product') || block?.title?.toLowerCase?.().includes('usage')) ? 'package' : 'tag',
        title: block?.title ?? '',
      },
      text: block?.content ?? '',
      rating: ratingArray,
    };
  });

  const mappedImages = Array.isArray(item.images) ? item.images.map((img: any) => toImageSource(img)).filter((x: any): x is NonNullable<typeof x> => !!x) : [];
  const relatedPostImages = Array.isArray(rp.images) ? rp.images.map((img: any) => toImageSource(img)).filter((x: any): x is NonNullable<typeof x> => !!x) : [];

  return {
    id: item.id,
    user: { id: item.user?.id ?? '', name: item.user?.name ?? '', title: item.user?.title ?? '', avatar: avatarSource },
    stats: item.stats ?? { likes: 0, comments: 0, shares: 0, bookmarks: 0 },
    createdAt: item.createdAt ?? '',
    contextType: productInfoType,
    product: productForCard(rp.product ?? productFromContext),
    content: typeof item.content === 'string' ? item.content : '',
    images: mappedImages,
    relatedPost: {
      id: rp.id ?? item.id,
      product: productForCard(rp.product),
      content: relatedPostContent,
      tags: Array.isArray(rp.tags) ? rp.tags : [],
      images: relatedPostImages,
    },
  };
};

// Mapped post type
type MappedPost =
  | { type: 'post'; id: string; data: PostCardData }
  | { type: 'update'; id: string; data: UpdateCardData }
  | { type: 'experience'; id: string; data: ExperiencePostCardData }
  | { type: 'benchmark'; id: string; data: BenchmarkCardData }
  | { type: 'tips'; id: string; data: TipsCardData }
  | { type: 'question'; id: string; data: QuestionCardData };

// Badge filter keys
const BADGE_FILTER_KEYS = ['allBadges', 'eventBadges', 'collections'] as const;

// ─── Memoized Action Buttons (isolates trust/mute mutation state from parent) ───
interface ProfileActionButtonsHandle {
  handleMuteToggle: () => void;
}

interface ProfileActionButtonsProps {
  targetUserId: string;
  isOwnProfile: boolean;
  isTrusted: boolean;
  isMuted: boolean;
  userName: string;
  onEdit: () => void;
  onSendTips: () => void;
  on1on1: () => void;
  onDM: () => void;
}

const ProfileActionButtons = React.memo(forwardRef<ProfileActionButtonsHandle, ProfileActionButtonsProps>(({
  targetUserId,
  isOwnProfile,
  isTrusted,
  isMuted,
  userName,
  onEdit,
  onSendTips,
  on1on1,
  onDM,
}, ref) => {
  const { t } = useTranslation('profile');
  const toast = useToast();
  const userId = useAppStore(state => state.user?.id);

  const { mutate: trustUser, isPending: isTrusting } = useAddToTrustList();
  const { mutate: untrustUser, isPending: isUntrusting } = useRemoveFromTrustList();
  const { mutate: muteUser, isPending: isMuting } = useMuteUser();
  const { mutate: unmuteUser, isPending: isUnmuting } = useUnmuteUser();

  const handleTrust = useCallback(() => {
    if (!targetUserId) return;
    if (isTrusted) {
      untrustUser(targetUserId);
    } else {
      trustUser(targetUserId);
    }
  }, [targetUserId, isTrusted, trustUser, untrustUser]);

  const handleMuteToggle = useCallback(() => {
    if (!userId || !targetUserId) return;
    if (isMuting || isUnmuting) return;

    if (isMuted) {
      unmuteUser(
        { userId, targetUserId },
        {
          onSuccess: () => {
            showCustomToast(toast, {
              title: t('toast.unmuted'),
              description: t('toast.unmutedDescription', { name: userName }),
              action: 'success',
            });
          },
          onError: () => {
            showCustomToast(toast, {
              title: t('toast.error'),
              description: t('toast.errorUnmuting'),
              action: 'error',
            });
          },
        }
      );
    } else {
      muteUser(
        { userId, targetUserId },
        {
          onSuccess: () => {
            showCustomToast(toast, {
              title: t('toast.muted'),
              description: t('toast.mutedDescription', { name: userName }),
              action: 'info',
            });
          },
          onError: () => {
            showCustomToast(toast, {
              title: t('toast.error'),
              description: t('toast.errorMuting'),
              action: 'error',
            });
          },
        }
      );
    }
  }, [userId, targetUserId, isMuted, muteUser, unmuteUser, isMuting, isUnmuting, toast, userName, t]);

  useImperativeHandle(ref, () => ({ handleMuteToggle }), [handleMuteToggle]);

  if (isOwnProfile) {
    return (
      <HStack space="sm" alignItems="center" flexShrink={0} mt={60}>
        <Pressable
          bg="#F7F7F7"
          borderRadius={200}
          borderWidth={1}
          borderColor="#E9E9E9"
          px={12}
          py={8}
          flexDirection="row"
          alignItems="center"
          gap={6}
          onPress={onEdit}
        >
          <PencilIcon size={14} color="#000" />
          <Text color="#000" fontSize={10} fontWeight="$semibold">
            {t('actions.edit')}
          </Text>
        </Pressable>
      </HStack>
    );
  }

  return (
    <HStack space="sm" alignItems="center" flexShrink={0} mt={60}>
      <Pressable
        w={34} h={34} bg="#F7F7F7" borderRadius={200} borderWidth={1} borderColor="#E9E9E9"
        justifyContent="center" alignItems="center" onPress={onSendTips}
      >
        <GiftIcon size={16} color="#000" />
      </Pressable>
      <Pressable
        w={34} h={34} bg="#F7F7F7" borderRadius={200} borderWidth={1} borderColor="#E9E9E9"
        justifyContent="center" alignItems="center" onPress={on1on1}
      >
        <PhoneIcon size={16} color="#000" />
      </Pressable>
      <Pressable
        w={34} h={34} bg="#F7F7F7" borderRadius={200} borderWidth={1} borderColor="#E9E9E9"
        justifyContent="center" alignItems="center" onPress={onDM}
      >
        <ChatBubbleLeftIcon size={16} color="#000" />
      </Pressable>
      <Pressable
        w={34} h={34} bg="#F7F7F7" borderRadius={200} borderWidth={1} borderColor="#E9E9E9"
        justifyContent="center" alignItems="center"
        onPress={handleMuteToggle}
        disabled={isMuting || isUnmuting}
        opacity={(isMuting || isUnmuting) ? 0.6 : 1}
      >
        {isMuted ? (
          <Box position="relative" justifyContent="center" alignItems="center">
            <BellIcon size={16} color="#000" />
            <Box position="absolute" width={20} height={1} bg="#000" style={{ transform: [{ rotate: '-45deg' }] }} />
          </Box>
        ) : (
          <BellIcon size={16} color="#000" />
        )}
      </Pressable>
      <Pressable
        bg="#F7F7F7" borderRadius={200} borderWidth={1} borderColor="#E9E9E9"
        px={14} py={10} flexDirection="row" alignItems="center" gap={2}
        onPress={handleTrust}
        disabled={isTrusting || isUntrusting}
        opacity={(isTrusting || isUntrusting) ? 0.6 : 1}
      >
        {isTrusted ? <UserMinusIcon size={16} color="#000" /> : <UserPlusIcon size={16} color="#000" />}
        <Text color="#000" fontSize={10} fontWeight="$semibold">
          {isTrusting ? t('actions.adding') : isUntrusting ? t('actions.removing') : (isTrusted ? t('actions.unTrust') : t('actions.trust'))}
        </Text>
      </Pressable>
    </HStack>
  );
}));
type BadgeFilterKey = typeof BADGE_FILTER_KEYS[number];

// Tab content props
interface TabContentProps {
  tabKey: TabKey;
  targetUserId: string;
  isDark: boolean;
  onQueryRef?: (tabKey: TabKey, query: any) => void;
  isActive?: boolean; // Sadece aktif tab API çağrısı yapmalı
  profileBadges?: Badge[];
  onBadgePress?: (badge: Badge) => void;
  bottomPadding?: number;
}

// TabsBar Component - Basitleştirilmiş versiyon (sadece tab seçimi)
interface TabsBarProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  isDark: boolean;
}

const TabsBar: React.FC<TabsBarProps> = ({ activeTab, onChangeTab, isDark }) => {
  const activeColor = isDark ? '#FFFFFF' : '#000000';
  const inactiveColor = '#A3A3A3';

  return (
    <Box
      mb={0}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      borderBottomWidth={StyleSheet.hairlineWidth}
      borderBottomColor={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: 16,
        }}
        scrollEnabled={true}
        bounces={false}
      >
        <HStack
          borderBottomWidth={1}
          borderColor="#E9E9E9"
          p={0}
          mb={0}
          position="relative"
          space="md"
        >
          {TABS.map((tab, index) => {
            const isActive = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => onChangeTab(tab.key)}
                alignItems="center"
                py="$1"
                px="$2"
              >
                <VStack alignItems="center" space="xs">
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: isActive ? activeColor : inactiveColor,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {tab.title}
                  </Text>
                </VStack>
                {/* Active indicator */}
                {isActive && (
                  <Box
                    position="absolute"
                    bottom={0}
                    left="50%"
                    height={2}
                    width={40}
                    backgroundColor={isDark ? '#FFFFFF' : '#000000'}
                    style={{
                      transform: [{ translateX: -15 }],
                    }}
                  />
                )}
              </Pressable>
            );
          })}
        </HStack>
      </ScrollView>
    </Box>
  );
};

// Tab Content Component
const TabContent: React.FC<TabContentProps> = ({
  tabKey,
  targetUserId,
  isDark,
  onQueryRef,
  isActive = true,
  profileBadges = [],
  onBadgePress,
  bottomPadding = 0
}) => {
  const { t } = useTranslation('profile');
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilterKey>('allBadges');
  // API hooks for each tab
  // FEED TAB FIX: Feed tab için TÜM query'leri enable et (posts, reviews, benchmarks, tips, replies)
  // Diğer tab'lar için sadece kendi query'lerini enable et
  const feedQuery = useUserPosts(targetUserId, 5, { enabled: isActive && tabKey === 'feed' && !!targetUserId });
  const reviewsQuery = useUserReviews(targetUserId, 5, { enabled: isActive && (tabKey === 'feed' || tabKey === 'reviews') && !!targetUserId });
  const benchmarksQuery = useUserBenchmarks(targetUserId, 5, { enabled: isActive && (tabKey === 'feed' || tabKey === 'benchmarks') && !!targetUserId });
  const tipsQuery = useUserTipsAndTricks(targetUserId, 5, { enabled: isActive && (tabKey === 'feed' || tabKey === 'tips') && !!targetUserId });
  const repliesQuery = useUserReplies(targetUserId, 5, { enabled: isActive && (tabKey === 'feed' || tabKey === 'replies') && !!targetUserId });

  // Get active tab query
  const activeTabQuery = useMemo(() => {
    switch (tabKey) {
      case 'feed': return feedQuery; // Feed tab için feedQuery'yi döndür (diğer query'ler mappedPosts'ta birleştirilecek)
      case 'reviews': return reviewsQuery;
      case 'benchmarks': return benchmarksQuery;
      case 'tips': return tipsQuery;
      case 'replies': return repliesQuery;
      default: return feedQuery;
    }
  }, [tabKey, feedQuery, reviewsQuery, benchmarksQuery, tipsQuery, repliesQuery]) as typeof feedQuery;
  
  // Query ref'ini parent'a gönder
  useEffect(() => {
    if (onQueryRef && activeTabQuery) {
      onQueryRef(tabKey, activeTabQuery);
    }
  }, [tabKey, activeTabQuery, onQueryRef]);

  // Filter badges based on selected filter
  const filteredBadges = useMemo(() => {
    if (tabKey !== 'badge') return [];
    if (badgeFilter === 'allBadges') return profileBadges;
    if (badgeFilter === 'eventBadges') return profileBadges.filter((b) => b.type === 'event');
    if (badgeFilter === 'collections') return profileBadges.filter((b) => b.type === 'collection');
    return profileBadges;
  }, [tabKey, profileBadges, badgeFilter]);

  // Flatten and map posts based on active tab
  const mappedPosts = useMemo(() => {
    if (tabKey === 'badge' || tabKey === 'collections') return [];

    // FEED TAB FIX: Feed tab için TÜM query'lerin sonuçlarını birleştir
    let allItems: any[] = [];

    if (tabKey === 'feed') {
      // Feed tab: TÜM query sonuçlarını birleştir
      const feedData = feedQuery.data as any;
      const reviewsData = reviewsQuery.data as any;
      const benchmarksData = benchmarksQuery.data as any;
      const tipsData = tipsQuery.data as any;
      const repliesData = repliesQuery.data as any;

      // Her query'nin items'larını flat'le ve birleştir
      const feedItems = feedData?.pages?.flatMap((page: any) => page?.items ?? []) ?? [];
      const reviewItems = reviewsData?.pages?.flatMap((page: any) => page?.items ?? []) ?? [];
      const benchmarkItems = benchmarksData?.pages?.flatMap((page: any) => page?.items ?? []) ?? [];
      const tipsItems = tipsData?.pages?.flatMap((page: any) => page?.items ?? []) ?? [];
      const repliesItems = repliesData?.pages?.flatMap((page: any) => page?.items ?? []) ?? [];

      // Tüm item'ları birleştir
      allItems = [
        ...feedItems,
        ...reviewItems,
        ...benchmarkItems,
        ...tipsItems,
        ...repliesItems,
      ];
    } else {
      // Diğer tab'lar: Sadece aktif tab'ın query'sini kullan
      const queryData = activeTabQuery.data as any;
      if (!queryData?.pages) return [];
      allItems = queryData.pages.flatMap((page: any) => page?.items ?? []) ?? [];
    }

    // Geçerli item'ları filtrele (id olan item'lar)
    const validItems = allItems.filter((item: any) => item?.id);

    // Benzersiz item'ları al (duplicate'leri kaldır)
    const uniqueItems = validItems.filter((item: any, index: number, self: any[]) =>
      index === self.findIndex((t: any) => t?.id === item?.id)
    );

    const mapped: MappedPost[] = [];

    for (const item of uniqueItems) {
      let mappedItem: MappedPost | null = null;

      switch (item.type) {
        case CardType.UPDATE:
          const updateData = mapUpdateToCardData(item);
          mappedItem = { type: 'update', id: item.id, data: updateData };
          break;
        case CardType.EXPERIENCE: {
          // Feed endpoint: product + experienceContent + string content
          // Reviews endpoint: contextData + array content
          // Her iki formatı da kabul et
          const hasExperienceData = item?.experienceContent || item?.product || item?.contextData || Array.isArray(item?.content);
          if (hasExperienceData) {
            const experienceData = mapExperienceToCardData(item as ProfileReview);
            if (experienceData) {
              mappedItem = { type: 'experience', id: item.id, data: experienceData };
            }
          }
          break;
        }
        case CardType.BENCHMARK:
          const benchmarkData = mapBenchmarkToCardData(item as BenchmarkApiItem);
          if (benchmarkData) {
            mappedItem = { type: 'benchmark', id: item.id, data: benchmarkData };
          }
          break;
        case CardType.TIPS_AND_TRICKS:
          if (item?.contextData?.id) {
            const tipsData = mapTipsToCardData(item as TipsApiItem);
            if (tipsData) {
              mappedItem = { type: 'tips', id: item.id, data: tipsData };
            }
          }
          break;
        case CardType.QUESTION: {
          // contextData boş obje ({}) olabilir, isBoosted opsiyonel
          const questionData = mapQuestionToCardData(item as QuestionApiItem);
          if (questionData) {
            mappedItem = { type: 'question', id: item.id, data: questionData };
          }
          break;
        }
        case CardType.POST:
        default:
          const postData = mapPostToCardData(item as ProfilePost);
          if (postData) {
            mappedItem = { type: 'post', id: item.id, data: postData };
          }
          break;
      }

      if (mappedItem) {
        mapped.push(mappedItem);
      }
    }

    return mapped;
  }, [tabKey, feedQuery.data, reviewsQuery.data, benchmarksQuery.data, tipsQuery.data, repliesQuery.data, activeTabQuery.data]);
  
  // Render post card
  const renderPostCard = useCallback((postData: MappedPost) => {
    switch (postData.type) {
      case 'update':
        return <UpdatePostCard data={postData.data} />;
      case 'experience':
        return <ExperiencePostCard data={postData.data} />;
      case 'benchmark':
        return <BenchmarkPostCard data={postData.data} />;
      case 'tips':
        return <TipsAndTricksPostCard data={postData.data} />;
      case 'question':
        return <QuestionPostCard data={postData.data} />;
      case 'post':
      default:
        return <PostCard data={postData.data} />;
    }
  }, []);

  // Render Badge Tab
  if (tabKey === 'badge') {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: bottomPadding,
          flexGrow: 0, // İçerik kadar büyüsün, boşluk eklemesin
        }}
      >
        <Box px={16} pt={8}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <HStack space="sm" alignItems="center">
              {BADGE_FILTER_KEYS.map((filterKey) => {
                const isActive = badgeFilter === filterKey;
                return (
                  <Pressable
                    key={filterKey}
                    onPress={() => setBadgeFilter(filterKey)}
                    bg={isActive ? (isDark ? '#333' : '#E9E9E9') : (isDark ? '#1A1A1A' : '#FFF')}
                    borderWidth={1}
                    borderColor={isDark ? '#444' : '#E9E9E9'}
                    borderRadius={8}
                    px="$3"
                    py="$2"
                  >
                    <Text
                      fontSize="$sm"
                      fontWeight="$semibold"
                      color={isActive ? (isDark ? '#FFF' : '#000') : (isDark ? '#999' : '#666')}
                    >
                      {t(`badges.${filterKey}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>
          </ScrollView>
          {filteredBadges.length === 0 ? (
            <Box py={32} alignItems="center">
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
                {t('emptyStates.noBadgesYet')}
              </Text>
            </Box>
          ) : (
            <Box flexDirection="row" flexWrap="wrap" justifyContent="center" alignItems="center">
              {filteredBadges.map((badge) => (
                <Pressable
                  key={badge.id}
                  onPress={() => onBadgePress?.(badge)}
                  width={114}
                  height={130}
                  mb={12}
                  alignItems="center"
                  justifyContent="center"
                  bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                  borderWidth={1}
                  borderColor={isDark ? '#333' : '#E9E9E9'}
                  borderRadius={5}
                  p="$2"
                >
                  <Box w={70} h={70} alignItems="center" justifyContent="center" overflow="hidden">
                    <Image
                      source={toImageSource(badge.image) || require('@/assets/defaultImages/default-badge.png')}
                      alt={badge.title}
                      style={{ width: 56, height: 56 }}
                      resizeMode="contain"
                    />
                  </Box>
                  <Text
                    mt="$1"
                    fontSize="$2xs"
                    fontWeight="$semibold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                    textAlign="center"
                    numberOfLines={2}
                  >
                    {badge.title}
                  </Text>
                </Pressable>
              ))}
            </Box>
          )}
        </Box>
      </ScrollView>
    );
  }

  // Render Collections Tab
  if (tabKey === 'collections') {
    return (
      <CollectionsTab userId={targetUserId} />
    );
  }

  // Loading state
  // FEED TAB FIX: Feed tab için TÜM query'lerin loading durumunu kontrol et
  const isLoading = tabKey === 'feed'
    ? (feedQuery.isLoading || reviewsQuery.isLoading || benchmarksQuery.isLoading || tipsQuery.isLoading || repliesQuery.isLoading) &&
      !(feedQuery.data as any)?.pages?.[0] &&
      !(reviewsQuery.data as any)?.pages?.[0] &&
      !(benchmarksQuery.data as any)?.pages?.[0] &&
      !(tipsQuery.data as any)?.pages?.[0] &&
      !(repliesQuery.data as any)?.pages?.[0]
    : activeTabQuery.isLoading && !((activeTabQuery.data as any)?.pages?.[0]);

  if (isLoading) {
    return (
      <Box py={20}>
        <FeedSkeleton count={3} />
      </Box>
    );
  }

  // Empty state
  if (mappedPosts.length === 0) {
    return (
      <Box py={20} alignItems="center">
        <Text color={isDark ? '$textLight400' : '$textDark400'} fontSize="$sm">
          No content found yet.
        </Text>
      </Box>
    );
  }

  // Render posts
  // FEED TAB FIX: Feed tab için TÜM query'lerin fetchingNextPage durumunu kontrol et
  const isFetchingNextPage = tabKey === 'feed'
    ? feedQuery.isFetchingNextPage || reviewsQuery.isFetchingNextPage || benchmarksQuery.isFetchingNextPage || tipsQuery.isFetchingNextPage || repliesQuery.isFetchingNextPage
    : activeTabQuery.isFetchingNextPage;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      bounces={true}
      contentContainerStyle={{
        paddingBottom: bottomPadding,
        flexGrow: 0, // İçerik kadar büyüsün, boşluk eklemesin
      }}
    >
      <Box px={16} pt={8}>
        {mappedPosts.map((item) => (
          <Box key={item.id} mb={16}>
            {renderPostCard(item)}
          </Box>
        ))}
        {isFetchingNextPage && (
          <Box py={20} alignItems="center">
            <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
          </Box>
        )}
      </Box>
    </ScrollView>
  );
};

const ProfileScreen = ({ route }: ProfileScreenProps) => {
  // Guard: useFocusEffect çift tetiklenmeyi önle
  const lastFocusRefetchRef = useRef<number>(0);

  const { t } = useTranslation('profile');

  // Translated tabs
  const TABS = useMemo(() => TAB_KEYS.map(key => ({
    key,
    title: t(TAB_TITLE_KEYS[key]),
  })), [t]);

  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { visible: fullScreenVisible, imageSource: fullScreenSource, openImage, closeImage } = useFullScreenImage();
  // PERFORMANCE FIX: Sadece user.id'yi select et - tüm user objesi yerine
  const userId = useAppStore(state => state.user?.id);
  const user = useAppStore(state => state.user);
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const rootNavigation = useNavigation<any>();
  const safeAreaTop = useSafeAreaValues('top');
  const safeAreaBottom = useSafeAreaValues('bottom');
  
  // Bottom padding for FlatList content
  const bottomPadding = useBottomOffset({ includeTabBar: false, extraPadding: 16 });
  
  // Route params'tan userId al, yoksa store'daki user.id'yi kullan
  // CRITICAL FIX: userId validasyonu - boş string veya geçersiz değer kontrolü
  const routeUserId = route.params?.userId;
  const rawTargetUserId = routeUserId || user?.id;
  
  // userId geçerli mi kontrol et (undefined, null, boş string kontrolü)
  const targetUserId = rawTargetUserId && 
    typeof rawTargetUserId === 'string' && 
    rawTargetUserId.trim().length > 0 
    ? rawTargetUserId.trim() 
    : undefined;
  
  // Query client for manual refetch
  const queryClient = useQueryClient();
  
  // Profile API hook
  const profileQueryResult = useUserProfile(targetUserId);
  const userProfile = profileQueryResult.data as UserProfile | undefined;
  const isProfileLoading = profileQueryResult.isLoading;
  const profileError = profileQueryResult.error;
  const refetchProfile = profileQueryResult.refetch;
  
  // PERFORMANCE FIX: Trust/Truster sayıları userProfile.stats'tan alınır
  // Liste verilerine burada ihtiyaç yok - sadece Trust_TrusterListScreen'de fetch edilir
  // Bu sayede ProfileScreen'de gereksiz API istekleri önlenir
  
  // Pull to refresh state
  const [refreshing, setRefreshing] = useState(false);
  
  // Badge modal state
  const [selectedBadge, setSelectedBadge] = useState<SeeAllReward | null>(null);

  // Send TIPS modal state
  const [isSendTipsModalVisible, setIsSendTipsModalVisible] = useState(false);
  
  // ARCHITECTURE FIX: Ekran focus olduğunda mevcut kullanıcının tüm profil verilerini refetch et
  // Yeni gönderi oluşturulduktan sonra ProfileScreen'e dönüldüğünde yeni gönderi görünsün
  useFocusEffect(
    useCallback(() => {
      // Sadece kendi profilimizdeysek (targetUserId === user?.id) refetch et
      if (targetUserId && user?.id && targetUserId === user.id) {
        // GUARD: 3 saniye içinde tekrar tetiklenmeyi önle (double-fire prevention)
        const now = Date.now();
        if (now - lastFocusRefetchRef.current < 3000) {
          return;
        }
        lastFocusRefetchRef.current = now;

        // invalidateQueries refetchActive: true ile zaten otomatik refetch yapar
        // Ayrı refetchQueries çağırmaya gerek yok - bu double-fetch'i önler
        Promise.all([
          queryClient.invalidateQueries({
            queryKey: profileKeys.profile(targetUserId),
            exact: false
          }),
          queryClient.invalidateQueries({
            queryKey: profileKeys.userPosts(targetUserId),
            exact: false
          }),
          queryClient.invalidateQueries({
            queryKey: profileKeys.userReviews(targetUserId),
            exact: false
          }),
          queryClient.invalidateQueries({
            queryKey: profileKeys.userBenchmarks(targetUserId),
            exact: false
          }),
          queryClient.invalidateQueries({
            queryKey: profileKeys.userTipsAndTricks(targetUserId),
            exact: false
          }),
          queryClient.invalidateQueries({
            queryKey: profileKeys.userReplies(targetUserId),
            exact: false
          }),
        ]).catch(() => {
          // Silently handle refetch errors
        });
      }
    }, [targetUserId, user?.id, queryClient])
  );
  
  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    if (!targetUserId) return;
    setRefreshing(true);
    try {
      // Tüm profil verilerini backend'den yeniden çek
      await Promise.all([
        // Profile bilgilerini refresh et
        refetchProfile(),
        // Tüm tab query'lerini refresh et
        queryClient.refetchQueries({
          queryKey: profileKeys.userPosts(targetUserId),
          exact: false,
        }),
        queryClient.refetchQueries({
          queryKey: profileKeys.userReviews(targetUserId),
          exact: false,
        }),
        queryClient.refetchQueries({
          queryKey: profileKeys.userBenchmarks(targetUserId),
          exact: false,
        }),
        queryClient.refetchQueries({
          queryKey: profileKeys.userTipsAndTricks(targetUserId),
          exact: false,
        }),
        queryClient.refetchQueries({
          queryKey: profileKeys.userReplies(targetUserId),
          exact: false,
        }),
      ]);
    } catch (error) {
      // Error handled silently
    } finally {
      setRefreshing(false);
    }
  }, [targetUserId, refetchProfile, queryClient]);
  
  
  // Inbox mutations
  const sendGiftMutation = useSendGift();
  const createSupportRequestMutation = useCreateSupportRequest();
  const sendDirectMessageMutation = useSendDirectMessage();
  
  // Report mutation
  const { mutate: reportUser, isPending: isReporting } = useReportUser();
  
  // Mute/Unmute: Hooks moved to ProfileActionButtons to prevent parent re-renders
  // Menu modal uses actionButtonsRef.current?.handleMuteToggle()
  
  // Toast hook
  const toast = useToast();
  
  // Kullanıcının kendi profiline bakıp bakmadığını kontrol et
  const isOwnProfile = user?.id === targetUserId;
  
  // Context menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const triggerViewRef = useRef<View>(null);
  const triggerPositionRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<TabKey>('feed');
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilterKey>('allBadges');
  const tabBarRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const actionButtonsRef = useRef<ProfileActionButtonsHandle>(null);
  const headerHeightRef = useRef(0);

  // Tab değişiminde FlatList'i content başlangıcına scroll et
  const scrollToContent = useCallback(() => {
    if (flatListRef.current && headerHeightRef.current > 0) {
      flatListRef.current.scrollToOffset({
        offset: headerHeightRef.current,
        animated: false,
      });
    }
  }, []);

  // Tab değişimi - tabBarRef üzerinden direkt güncelle, ListHeaderComponent re-render olmaz
  const handleTabChange = useCallback((tabKey: TabKey) => {
    setActiveTab(tabKey);
    if (tabBarRef.current) {
      tabBarRef.current.setActiveTab(tabKey);
    }
    scrollToContent();
  }, [scrollToContent]);


  // Instagram Model: Query hooks (aktif tab bazlı)
  const feedQuery = useUserPosts(targetUserId, 10, {
    enabled: activeTab === 'feed' && !!targetUserId
  });
  const reviewsQuery = useUserReviews(targetUserId, 10, {
    enabled: (activeTab === 'feed' || activeTab === 'reviews') && !!targetUserId
  });
  const benchmarksQuery = useUserBenchmarks(targetUserId, 10, {
    enabled: (activeTab === 'feed' || activeTab === 'benchmarks') && !!targetUserId
  });
  const tipsQuery = useUserTipsAndTricks(targetUserId, 10, {
    enabled: (activeTab === 'feed' || activeTab === 'tips') && !!targetUserId
  });
  const repliesQuery = useUserReplies(targetUserId, 10, {
    enabled: (activeTab === 'feed' || activeTab === 'replies') && !!targetUserId
  });

  // Instagram Model: Active tab query
  const activeTabQuery = useMemo(() => {
    switch (activeTab) {
      case 'feed': return feedQuery;
      case 'reviews': return reviewsQuery;
      case 'benchmarks': return benchmarksQuery;
      case 'tips': return tipsQuery;
      case 'replies': return repliesQuery;
      default: return feedQuery;
    }
  }, [activeTab, feedQuery, reviewsQuery, benchmarksQuery, tipsQuery, repliesQuery]);


  // Instagram Model: Mapped posts for FlatList
  const mappedPosts = useMemo(() => {
    if (activeTab === 'badge' || activeTab === 'collections') return [];

    let allItems: any[] = [];

    if (activeTab === 'feed') {
      // Feed: Aggregate all queries
      const feedItems = (feedQuery.data as any)?.pages?.flatMap((p: any) => p?.items ?? []) ?? [];
      const reviewItems = (reviewsQuery.data as any)?.pages?.flatMap((p: any) => p?.items ?? []) ?? [];
      const benchmarkItems = (benchmarksQuery.data as any)?.pages?.flatMap((p: any) => p?.items ?? []) ?? [];
      const tipsItems = (tipsQuery.data as any)?.pages?.flatMap((p: any) => p?.items ?? []) ?? [];
      const repliesItems = (repliesQuery.data as any)?.pages?.flatMap((p: any) => p?.items ?? []) ?? [];

      allItems = [...feedItems, ...reviewItems, ...benchmarkItems, ...tipsItems, ...repliesItems];
    } else {
      // Other tabs: Only active tab query
      const queryData = activeTabQuery.data as any;
      allItems = queryData?.pages?.flatMap((p: any) => p?.items ?? []) ?? [];
    }

    // Filter valid items
    const validItems = allItems.filter((item: any) => item?.id);
    const uniqueItems = validItems.filter((item: any, index: number, self: any[]) =>
      index === self.findIndex((t: any) => t?.id === item?.id)
    );

    const mapped: MappedPost[] = [];

    for (const item of uniqueItems) {
      let mappedItem: MappedPost | null = null;

      switch (item.type) {
        case CardType.UPDATE:
          mappedItem = { type: 'update', id: item.id, data: mapUpdateToCardData(item) };
          break;
        case CardType.EXPERIENCE: {
          // Feed endpoint: product + experienceContent + string content
          // Reviews endpoint: contextData + array content
          const hasExperienceData = item?.experienceContent || item?.product || item?.contextData || Array.isArray(item?.content);
          if (hasExperienceData) {
            const data = mapExperienceToCardData(item as ProfileReview);
            if (data) mappedItem = { type: 'experience', id: item.id, data };
          }
          break;
        }
        case CardType.BENCHMARK: {
          const benchData = mapBenchmarkToCardData(item as BenchmarkApiItem);
          if (benchData) mappedItem = { type: 'benchmark', id: item.id, data: benchData };
          break;
        }
        case CardType.TIPS_AND_TRICKS:
          if (item?.contextData?.id) {
            const tipsData = mapTipsToCardData(item as TipsApiItem);
            if (tipsData) mappedItem = { type: 'tips', id: item.id, data: tipsData };
          }
          break;
        case CardType.QUESTION: {
          // contextData boş obje ({}) olabilir, isBoosted opsiyonel
          const qData = mapQuestionToCardData(item as QuestionApiItem);
          if (qData) mappedItem = { type: 'question', id: item.id, data: qData };
          break;
        }
        case CardType.POST:
        default:
          const postData = mapPostToCardData(item as ProfilePost);
          if (postData) mappedItem = { type: 'post', id: item.id, data: postData };
          break;
      }

      if (mappedItem) mapped.push(mappedItem);
    }

    return mapped;
  }, [activeTab, feedQuery.data, reviewsQuery.data, benchmarksQuery.data, tipsQuery.data, repliesQuery.data, activeTabQuery.data]);

  // Instagram Model: Render post card
  const renderPostCard = useCallback((post: MappedPost) => {
    switch (post.type) {
      case 'update': return <UpdatePostCard data={post.data} />;
      case 'experience': return <ExperiencePostCard data={post.data} />;
      case 'benchmark': return <BenchmarkPostCard data={post.data} />;
      case 'tips': return <TipsAndTricksPostCard data={post.data} />;
      case 'question': return <QuestionPostCard data={post.data} />;
      case 'post':
      default: return <PostCard data={post.data} />;
    }
  }, []);

  // Instagram Model: FlatList renderItem
  const renderItem: ListRenderItem<MappedPost> = useCallback(({ item }) => (
    <Box px={16} mb={16}>
      {renderPostCard(item)}
    </Box>
  ), [renderPostCard]);

  // Instagram Model: FlatList keyExtractor
  const keyExtractor = useCallback((item: MappedPost) => item.id, []);

  // Instagram Model: FlatList ListEmptyComponent
  const ListEmptyComponent = useCallback(() => {
    // Badge tab: Show badge grid
    if (activeTab === 'badge') {
      const allBadges = userProfile?.badges || [];

      // No badges at all - show clean empty state
      if (allBadges.length === 0) {
        return (
          <Box py={40} alignItems="center" px={20}>
            <RNText style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#FFFFFF' : '#000000', textAlign: 'center' }}>
              No Badges Earned Yet
            </RNText>
            <RNText style={{ fontSize: 14, color: '#999999', textAlign: 'center', marginTop: 8 }}>
              This user hasn't earned any badges yet.
            </RNText>
          </Box>
        );
      }

      // Has badges - show filters + grid
      const filteredBadges = (() => {
        if (badgeFilter === 'allBadges') return allBadges;
        if (badgeFilter === 'eventBadges') return allBadges.filter((b) => b.type === 'event');
        if (badgeFilter === 'collections') return allBadges.filter((b) => b.type === 'collection');
        return allBadges;
      })();

      return (
        <Box px={16} pt={8}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
            nestedScrollEnabled={true}
            directionalLockEnabled={true}
          >
            <HStack space="xs" alignItems="center">
              {BADGE_FILTER_KEYS.map((filterKey) => {
                const isActive = badgeFilter === filterKey;
                return (
                  <RNPressable
                    key={filterKey}
                    onPress={() => setBadgeFilter(filterKey)}
                    style={{
                      backgroundColor: isActive ? '#F1F1F1' : 'transparent',
                      borderWidth: 1,
                      borderColor: '#EFEFEF',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 3,
                      marginRight: 6,
                      minHeight: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <RNText style={{ fontSize: 12, fontWeight: '600', color: '#000000' }}>
                      {t(`badges.${filterKey}`)}
                    </RNText>
                  </RNPressable>
                );
              })}
            </HStack>
          </ScrollView>
          {filteredBadges.length === 0 ? (
            <Box py={32} alignItems="center">
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
                {t('emptyStates.noBadgesYet')}
              </Text>
            </Box>
          ) : (
            <Box flexDirection="row" flexWrap="wrap" justifyContent="center" alignItems="center">
              {filteredBadges.map((badge) => (
                <Pressable
                  key={badge.id}
                  onPress={() => handleBadgePress?.(badge)}
                  width={114}
                  height={130}
                  mb={12}
                  alignItems="center"
                  justifyContent="center"
                  bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                  borderWidth={1}
                  borderColor={isDark ? '#333' : '#E9E9E9'}
                  borderRadius={5}
                  p="$2"
                >
                  <Box w={70} h={70} alignItems="center" justifyContent="center" overflow="hidden">
                    <Image
                      source={toImageSource(badge.image) || require('@/assets/defaultImages/default-badge.png')}
                      alt={badge.title}
                      style={{ width: 56, height: 56 }}
                      resizeMode="contain"
                    />
                  </Box>
                  <Text
                    mt="$1"
                    fontSize="$2xs"
                    fontWeight="$semibold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                    textAlign="center"
                    numberOfLines={2}
                  >
                    {badge.title}
                  </Text>
                </Pressable>
              ))}
            </Box>
          )}
        </Box>
      );
    }

    // Collections tab: Show CollectionsTab component
    if (activeTab === 'collections') {
      return <CollectionsTab userId={targetUserId} />;
    }

    // Loading state
    if (activeTabQuery.isLoading) {
      return (
        <Box py={20}>
          <FeedSkeleton count={3} />
        </Box>
      );
    }

    // Empty posts - tab'a göre özel mesaj
    const emptyStateKey = ['feed', 'reviews', 'benchmarks', 'tips', 'replies'].includes(activeTab) ? activeTab : 'default';
    const emptyState = {
      title: t(`emptyStates.${emptyStateKey}.title`),
      subtitle: t(`emptyStates.${emptyStateKey}.subtitle`),
    };

    return (
      <Box py={40} alignItems="center" px={20}>
        <RNText style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#FFFFFF' : '#000000', textAlign: 'center' }}>
          {emptyState.title}
        </RNText>
        <RNText style={{ fontSize: 14, color: '#999999', textAlign: 'center', marginTop: 8 }}>
          {emptyState.subtitle}
        </RNText>
      </Box>
    );
  }, [activeTab, badgeFilter, userProfile?.badges, isDark, activeTabQuery.isLoading, handleBadgePress, targetUserId]);

  // Instagram Model: FlatList ListFooterComponent
  const ListFooterComponent = useCallback(() => {
    if (activeTab === 'badge' || activeTab === 'collections') return null;
    if (!activeTabQuery.isFetchingNextPage) return null;
    return (
      <Box py={20} alignItems="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }, [activeTab, activeTabQuery.isFetchingNextPage, isDark]);

  // Handle Send TIPS - API call
  const handleSendTips = useCallback((amount: number) => {
    if (!user?.id || !targetUserId) {
      Alert.alert(t('alerts.errorTitle'), t('alerts.errorUserInfo'));
      return;
    }

    // Send gift mutation
    sendGiftMutation.mutate(
      {
        senderUserId: user.id,
        recipientUserId: targetUserId,
        amount: amount,
        message: 'TIPS sent from profile',
        timestamp: new Date().toISOString(),
      },
      {
        onSuccess: (response) => {
          console.log('[ProfileScreen] ✅ TIPS sent successfully:', response);
          showCustomToast(toast, {
            title: t('toast.tipsSent'),
            description: t('toast.tipsSentDescription', { amount }),
            action: 'success',
          });
        },
        onError: (error: any) => {
          console.error('[ProfileScreen] ❌ TIPS send failed:', error);
          const errorMessage = error.response?.data?.message || error.message || t('errors.errorSendingTips');
          Alert.alert(t('alerts.errorTitle'), errorMessage);
        },
      }
    );
  }, [user?.id, targetUserId, sendGiftMutation, toast]);

  // Action button handlers
  const handleSendTIPS = useCallback(() => {
    if (!user?.id || !targetUserId) return;
    setIsSendTipsModalVisible(true);
  }, [user?.id, targetUserId]);

  const handle1on1Request = useCallback(() => {
    if (!user?.id || !targetUserId) return;
    // MessageDetail screen'ine navigate et (1-on-1 request için)
    navigateToSharedScreenWithPruning(ROOT_ROUTES.MESSAGE_DETAIL, {
      messageId: targetUserId,
      threadId: targetUserId,
      recipientUserId: targetUserId,
    });
  }, [user?.id, targetUserId]);

  const handleDM = useCallback(() => {
    if (!user?.id || !targetUserId || !userProfile) return;
    // MessageDetail screen'ine navigate et
    navigateToSharedScreenWithPruning(ROOT_ROUTES.MESSAGE_DETAIL, {
      messageId: targetUserId,
      threadId: targetUserId,
      recipientUserId: targetUserId,
      senderName: userProfile.name || 'Unknown',
      senderTitle: userProfile.titles && userProfile.titles.length > 0 ? userProfile.titles[0] : '',
      senderAvatar: userProfile.avatar ? (toImageSource(userProfile.avatar) || require('@/assets/avatar/default-useravatar.png')) : require('@/assets/avatar/default-useravatar.png'),
    });
  }, [user?.id, targetUserId, userProfile]);


  const handleReport = useCallback(() => {
    if (!user?.id || !targetUserId) return;
    
    Alert.alert(
      t('menu.reportTitle'),
      t('menu.reportMessage'),
      [
        {
          text: t('actions.cancel'),
          style: 'cancel',
        },
        {
          text: t('actions.report'),
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
    Alert.alert(
      t('menu.blockTitle'),
      t('menu.blockMessage'),
      [
        {
          text: t('actions.cancel'),
          style: 'cancel',
        },
        {
          text: t('actions.block'),
          style: 'destructive',
          onPress: () => {
            // TODO: Block user API endpoint eklendiğinde buraya entegre edilecek
            // Navigate back after blocking
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  }, [targetUserId, navigation]);

  // CRITICAL FIX: onLayout ile pozisyonu sürekli güncelle
  // FlatList scroll edildiğinde pozisyon değişir, onLayout her değişiklikte çağrılır
  const handleTriggerLayout = useCallback(() => {
    if (triggerViewRef.current) {
      // measureInWindow: Window koordinatları (ekranın en üst soluna göre, scroll dahil)
      triggerViewRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          triggerPositionRef.current = { x, y, width, height };
          if (__DEV__) {
            console.log('📍 [ProfileScreen] onLayout - measureInWindow:', {
              x,
              y,
              width,
              height,
              reference: 'Window coordinates (top-left of screen, scroll included)',
            });
          }
        }
      });
    }
  }, []);

  // Calculate menu position - event koordinatlarını öncelikli kullan
  const handleMenuOpen = useCallback((event?: any) => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const menuWidth = 200;
    const menuHeight = 200; // Approximate height based on menu items
    
    const calculatePosition = (x: number, y: number, width: number, height: number, source: string) => {
      // Menu'yu trigger button'ın sağında konumlandır
      let left = x + width - menuWidth - 20;
      let top = y + height + 8;
      
      if (__DEV__) {
        console.log(`📐 [ProfileScreen] Position calculation (${source}):`, {
          triggerPosition: { x, y, width, height },
          calculatedMenuPosition: { left, top },
          screenDimensions: { screenWidth, screenHeight },
          menuDimensions: { menuWidth, menuHeight },
        });
      }
      
      // Ekran sınırları kontrolü
      if (left < 12) {
        left = 12;
      }
      if (left + menuWidth > screenWidth - 12) {
        left = screenWidth - menuWidth - 12;
      }
      if (top < 12) {
        top = 12;
      }
      if (top + menuHeight > screenHeight - 12) {
        // Eğer altında yer yoksa, üstünde göster
        top = y - menuHeight - 8;
        if (top < 12) {
          top = 12;
        }
      }
      
      return { top, left };
    };

    // ÖNCELİK 1: Event'ten gelen koordinatları kullan (en güvenilir)
    if (event?.nativeEvent?.pageX !== undefined && event?.nativeEvent?.pageY !== undefined) {
      const pageX = event.nativeEvent.pageX;
      const pageY = event.nativeEvent.pageY;
      
      // Trigger button'ın yaklaşık boyutları (24x24 icon + padding)
      const triggerWidth = 44;
      const triggerHeight = 44;
      
      // Event koordinatları button'ın merkezine yakın, sağ üst köşesini hesapla
      const triggerX = pageX - triggerWidth / 2;
      const triggerY = pageY - triggerHeight / 2;
      
      const position = calculatePosition(triggerX, triggerY, triggerWidth, triggerHeight, 'event-coordinates');
      setMenuPosition(position);
      setIsMenuOpen(true);
      return;
    }

    // ÖNCELİK 2: Stored position'ı kullan (onLayout'dan gelen)
    if (triggerPositionRef.current) {
      const stored = triggerPositionRef.current;
      if (__DEV__) {
        console.log('💾 [ProfileScreen] Using stored position from onLayout:', stored);
      }
      const position = calculatePosition(stored.x, stored.y, stored.width, stored.height, 'stored');
      if (__DEV__) {
        console.log('✅ [ProfileScreen] Final menu position (stored):', {
          top: position.top,
          left: position.left,
          reference: 'Modal uses position: absolute with top/left (relative to window/screen)',
        });
      }
      setMenuPosition(position);
      setIsMenuOpen(true);
      return;
    }

    // ÖNCELİK 3: measureInWindow ile ölç (ref varsa)
    const InteractionManager = require('react-native').InteractionManager;
    InteractionManager.runAfterInteractions(() => {
      if (triggerViewRef.current) {
        triggerViewRef.current.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0 && x >= 0 && y >= 0) {
            // Stored position'ı güncelle
            triggerPositionRef.current = { x, y, width, height };
            const position = calculatePosition(x, y, width, height, 'measureInWindow');
            setMenuPosition(position);
            setIsMenuOpen(true);
          } else {
            // Invalid position - fallback kullan
            setMenuPosition({ top: 50, left: screenWidth - 212 });
            setIsMenuOpen(true);
          }
        });
      } else {
        // Ref yok - fallback kullan
        setMenuPosition({ top: 50, left: screenWidth - 212 });
        setIsMenuOpen(true);
      }
    });
  }, []);


  // Map Badge to SeeAllReward format for BadgeBottomSheet
  const mapBadgeToSeeAllReward = useCallback((badge: Badge): SeeAllReward => {
    const imageSource = badge.image ? toImageSource(badge.image) : require('@/assets/defaultImages/default-badge.png');
    
    return {
      id: badge.id,
      title: badge.title,
      image: imageSource,
      description: `You earned the "${badge.title}" badge!`,
      category: 'achievement',
      isUnlocked: true, // Profile'da gösterilen badge'ler zaten kazanılmış
      completed: 1,
      task: 1,
    };
  }, []);

  // Handle badge press - open modal
  const handleBadgePress = useCallback((badge: Badge) => {
    const badgeData = mapBadgeToSeeAllReward(badge);
    setSelectedBadge(badgeData);
  }, [mapBadgeToSeeAllReward]);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setSelectedBadge(null);
  }, []);

  
  // ListHeaderComponent: Banner + Profile Info
  const renderProfileHeader = useCallback((isLoading: boolean): React.ReactElement | null => {
    if (!userProfile && !isLoading) return null;
    if (!userProfile) return null;
    
    // TypeScript için: userProfile bu noktada kesinlikle tanımlı
    const profile = userProfile;
    
    // Avatar: Her zaman görüntülenen profilin (userProfile) avatar'ı kullanılır.
    // Başkasının profilinde store (giriş yapan kullanıcı) avatar'ı asla kullanılmaz.
    const profileAvatarRaw = typeof userProfile?.avatar === 'string' ? userProfile.avatar.trim() : userProfile?.avatar;
    let avatarSource: any = null;
    if (profileAvatarRaw) {
      const profileAvatar = toImageSource(profileAvatarRaw);
      if (profileAvatar) {
        avatarSource = profileAvatar;
      }
    }
    if (!avatarSource && isOwnProfile && user?.avatar) {
      // Sadece kendi profilimizde: API'de avatar yoksa store'dan al
      const storeAvatar = toImageSource(user.avatar);
      if (storeAvatar) {
        avatarSource = storeAvatar;
      }
    }
    
    return (
      <Box bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Banner */}
        <Box
          h={180}
          overflow="hidden"
          position="relative"
        >
          <RNPressable onLongPress={() => {
            const bannerSource = toImageSource(profile.bannerUrl);
            if (bannerSource) openImage(bannerSource);
          }}>
            <Image
              source={toImageSource(profile.bannerUrl) || require('@/assets/banner/banner_01.png')}
              alt="Profile Banner"
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </RNPressable>
          {/* Overlay */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(0, 0, 0, 0.5)"
          />
          
          {/* Banner Controls */}
          <Box
            position="absolute"
            top={50}
            left={0}
            right={0}
            flexDirection="row"
            justifyContent="space-between"
            alignItems="flex-start"
            px={16}
            zIndex={2000}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  rootNavigation.navigate('Main' as never);
                }
              }}
            >
              <ChevronLeftIcon size={24} color="#fff" />
            </Pressable>

            {isOwnProfile ? (
              <Pressable
                onPress={() => {
                  navigationService.navigate(ROOT_ROUTES.SETTINGS);
                }}
              >
                <EllipsisVerticalIcon size={24} color="#fff" />
              </Pressable>
            ) : (
              <View 
                ref={triggerViewRef}
                collapsable={false}
                style={{ position: 'relative', zIndex: 2001 }}
                onLayout={handleTriggerLayout}
              >
                <Pressable onPress={(event) => handleMenuOpen(event)}>
                  <EllipsisVerticalIcon size={24} color="#fff" />
                </Pressable>
              </View>
            )}
          </Box>
        </Box>

        {/* Profile Image and Action Buttons Row */}
        <Box px={15} mt={-45}>
          <HStack alignItems="flex-start" justifyContent="space-between" space="md">
            {/* Profile Image */}
            <RNPressable onLongPress={() => {
              if (avatarSource) openImage(avatarSource);
            }}>
              <Box
                borderRadius={100}
                overflow="hidden"
                w={100}
                h={100}
                borderWidth={4}
                borderColor="$white"
                flexShrink={0}
                position="relative"
                bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
              >
                {/* Default avatar - her zaman arka planda */}
                <Image
                  source={require('@/assets/avatar/default-useravatar.png')}
                  alt="Default Avatar"
                  position="absolute"
                  w="100%"
                  h="100%"
                  resizeMode="cover"
                />
                {/* Kullanıcı avatar'ı - varsa üstte göster */}
                {/* CRITICAL FIX: DrawerContent ile aynı mantık - önce userProfile, sonra user store */}
                {avatarSource && (
                  <Image
                    source={avatarSource}
                    alt={profile.name}
                    position="absolute"
                    w="100%"
                    h="100%"
                    resizeMode="cover"
                  />
                )}
              </Box>
            </RNPressable>

            {/* Action Buttons - isolated in React.memo to prevent parent re-renders */}
            <ProfileActionButtons
              ref={actionButtonsRef}
              targetUserId={targetUserId!}
              isOwnProfile={isOwnProfile}
              isTrusted={!!profile.isTrusted}
              isMuted={!!profile.isMuted}
              userName={profile.name || ''}
              onEdit={() => navigation.navigate('ProfileEdit')}
              onSendTips={handleSendTIPS}
              on1on1={handle1on1Request}
              onDM={handleDM}
            />
          </HStack>
        </Box>

        {/* Profile Info */}
        <Box px={15} mt={10}>
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            fontSize={18}
            fontWeight="$bold"
          >
            {profile.name}
          </Text>

          {profile.biography && (
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize="$sm"
              lineHeight={18}
              mt={2}
            >
              {profile.biography}
            </Text>
          )}

          {/* Stats */}
          <HStack space="xs" mt={10}>
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize="$xs"
              fontWeight="$bold"
            >
              {profile.stats?.posts ?? 0}
            </Text>
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize="$xs"
            >
              {t('stats.posts')}
            </Text>
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize="$xs"
            >
              {" "}•{" "}
            </Text>
            <Pressable
              onPress={() => {
                if (targetUserId) {
                  navigation.navigate('TrustList', {
                    userId: targetUserId,
                    initialTab: 'trust',
                  });
                }
              }}
            >
              <HStack alignItems="center" space="xs">
                <Text
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontSize="$xs"
                  fontWeight="$bold"
                >
                  {userProfile?.stats?.trust ?? 0}
                </Text>
                <Text
                  color={isDark ? '$textDark400' : '$textLight600'}
                  fontSize="$xs"
                >
                  {t('stats.trust')}
                </Text>
              </HStack>
            </Pressable>
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize="$xs"
            >
              {" "}•{" "}
            </Text>
            <Pressable
              onPress={() => {
                if (targetUserId) {
                  navigation.navigate('TrustList', {
                    userId: targetUserId,
                    initialTab: 'truster',
                  });
                }
              }}
            >
              <HStack alignItems="center" space="xs">
                <Text
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontSize="$xs"
                  fontWeight="$bold"
                >
                  {(userProfile?.stats?.truster ?? 0) > 999 ? `${Math.floor((userProfile?.stats?.truster ?? 0) / 1000)}K` : (userProfile?.stats?.truster ?? 0)}
                </Text>
                <Text
                  color={isDark ? '$textDark400' : '$textLight600'}
                  fontSize="$xs"
                >
                  {t('stats.truster')}
                </Text>
              </HStack>
            </Pressable>
          </HStack>

          {/* User Titles */}
          {profile.titles && profile.titles.length > 0 && (
            <HStack alignItems="center" space="xs" mt={8}>
              <CheckBadgeIcon size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text
                color={isDark ? '$textDark400' : '$textLight500'}
                fontSize="$xs"
                numberOfLines={1}
              >
                {profile.titles.join(' - ')}
              </Text>
            </HStack>
          )}
        </Box>

        {/* Inventory Header - Her zaman göster (kendi ve başkasının profili için) */}
        <Box mt={20} px={15} zIndex={1}>
          <Box
            w="100%"
            h={34}
            position="relative"
            overflow="hidden"
            borderRadius={4}
          >
            <Image
              source={require('@/assets/button/button_background_01.png')}
              alt="Button Background"
              position="absolute"
              w="100%"
              h="100%"
              resizeMode="cover"
            />
            <Pressable
              position="absolute"
              w="100%"
              h="100%"
              justifyContent="center"
              alignItems="center"
              zIndex={2}
              onPress={() => {
                navigation.navigate('InventoryList', {
                  userId: profile.id,
                });
              }}
            >
              <Text
                color="$white"
                fontSize="$xs"
                fontWeight="$semibold"
                textAlign="center"
              >
                {t('profileScreen.inventory', { name: profile.name })}
              </Text>
            </Pressable>
          </Box>
        </Box>

        {/* Badge Items - hide for other users with no badges */}
        {isOwnProfile || (profile.badges && profile.badges.length > 0) ? (
          isProfileLoading ? (
            <Box mt={6} px={15} pb={16}>
              <Box
                borderRadius={5}
                p={14}
                h={130}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 16 }}
                >
                  {[0, 1, 2, 3].map((index) => (
                    <VStack key={index} space="xs" alignItems="center">
                      <Box
                        w={70}
                        h={70}
                        borderRadius={5}
                        bg={isDark ? '#404040' : '#E9E9E9'}
                      />
                      <Box
                        w={50}
                        h={10}
                        borderRadius={3}
                        bg={isDark ? '#404040' : '#E9E9E9'}
                      />
                    </VStack>
                  ))}
                </ScrollView>
                <Box
                  w={120}
                  h={12}
                  borderRadius={3}
                  bg={isDark ? '#404040' : '#E9E9E9'}
                  alignSelf="center"
                  mt="$4"
                />
              </Box>
            </Box>
          ) : (
            <Box mt={6} px={15} pb={8}>
              <Box
                borderRadius={5}
                p={profile.badges && profile.badges.length > 0 ? 14 : 8}
              >
                {profile.badges && profile.badges.length > 0 ? (
                  <HStack justifyContent="space-between">
                    {profile.badges.slice(0, 4).map((badge) => (
                      <Pressable
                        key={badge.id}
                        onPress={() => handleBadgePress(badge)}
                        flex={1}
                        alignItems="center"
                      >
                        <VStack space="xs" alignItems="center">
                          <Box
                            w={64}
                            h={64}
                            borderRadius={12}
                            borderWidth={0}
                            overflow="hidden"
                            justifyContent="center"
                            alignItems="center"
                          >
                            <Image
                              source={toImageSource(badge.image) || require('@/assets/defaultImages/default-badge.png')}
                              alt={badge.title}
                              w={56}
                              h={56}
                              resizeMode="contain"
                            />
                          </Box>
                          <Text
                            color={isDark ? '$textDark400' : '#000000'}
                            fontSize={10}
                            fontWeight="$bold"
                            textAlign="center"
                            numberOfLines={2}
                            lineHeight={13}
                            px={2}
                          >
                            {badge.title}
                          </Text>
                        </VStack>
                      </Pressable>
                    ))}
                    {/* Own profile: fill remaining slots with dashed placeholders */}
                    {isOwnProfile && profile.badges.length < 4 &&
                      Array.from({ length: 4 - Math.min(profile.badges.length, 4) }).map((_, index) => (
                        <Pressable
                          key={`empty-${index}`}
                          onPress={() => navigation.navigate('EditHighlightBadges')}
                          flex={1}
                          alignItems="center"
                        >
                          <VStack space="xs" alignItems="center">
                            <Box
                              w={64}
                              h={64}
                              borderRadius={12}
                              borderWidth={2}
                              borderColor={isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}
                              borderStyle="dashed"
                              justifyContent="center"
                              alignItems="center"
                              bg={isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'}
                            >
                              <PlusIcon
                                size={24}
                                color={isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.25)'}
                                strokeWidth={1.5}
                              />
                            </Box>
                            <Text fontSize={10} lineHeight={13}>{' '}</Text>
                          </VStack>
                        </Pressable>
                      ))
                    }
                  </HStack>
                ) : (
                  <Box flex={1} height={64}>
                    {/* 4 dashed badge placeholders */}
                    <HStack justifyContent="space-between">
                      {[1, 2, 3, 4].map((index) => (
                        <Pressable
                          key={index}
                          onPress={isOwnProfile ? () => navigation.navigate('EditHighlightBadges') : undefined}
                          flex={1}
                          alignItems="center"
                        >
                          <Box
                            w={64}
                            h={64}
                            borderRadius={12}
                            borderWidth={2}
                            borderColor={isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}
                            borderStyle="dashed"
                            justifyContent="center"
                            alignItems="center"
                            bg={isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'}
                          >
                            <PlusIcon
                              size={24}
                              color={isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.25)'}
                              strokeWidth={1.5}
                            />
                          </Box>
                        </Pressable>
                      ))}
                    </HStack>
                  </Box>
                )}
                {isOwnProfile && (
                  <Pressable
                    onPress={() => {
                      navigation.navigate('EditHighlightBadges');
                    }}
                  >
                    <Text
                      color={isDark ? '$textDark400' : '$textLight600'}
                      fontSize={10}
                      textAlign="center"
                      mt="$4"
                      fontWeight="$semibold"
                    >
                      {t('editHighlightBadges.title')}
                    </Text>
                  </Pressable>
                )}
              </Box>
            </Box>
          )
        ) : null}
      </Box>
    );
  }, [userProfile, isDark, isOwnProfile, targetUserId, rootNavigation, user, navigation, handleReport, handleBlock, handleBadgePress, openImage, handleSendTIPS, handle1on1Request, handleDM]);
  
  // Profile header'ı memoize et - CRITICAL: Early return'lerden ÖNCE çağrılmalı (Rules of Hooks)
  // userProfile undefined olsa bile hook çağrılmalı (Rules of Hooks)
  const profileHeader = useMemo(() => {
    return renderProfileHeader(isProfileLoading);
  }, [renderProfileHeader, isProfileLoading]);

  // ListHeaderComponent (Profile + Tab Bar) - activeTab bağımlılığı yok, re-render tetiklemez
  const ListHeaderComponent = useCallback(() => (
    <View
      onLayout={(e) => {
        headerHeightRef.current = e.nativeEvent.layout.height;
      }}
    >
      {profileHeader}
      <AnimatedTabBar
        ref={tabBarRef}
        tabs={TABS}
        onTabChange={handleTabChange}
        isDark={isDark}
      />
    </View>
  ), [profileHeader, handleTabChange, isDark]);

  // Loading state - profile yüklenirken loading indicator göster
  if (isProfileLoading && !userProfile) {
    return (
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }

  // Error state - profile yüklenemezse hata mesajı göster
  if (profileError || !userProfile) {
    return (
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} justifyContent="center" alignItems="center" px={20}>
        <Text color="#CE4A4A" fontSize="$sm">
          {profileError?.message || 'Profil yüklenirken bir hata oluştu'}
        </Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} width="100%">
      <StatusBar style="light" />

      {/* Single FlatList with touch-based swipe for tab switching */}
      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={mappedPosts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          ListFooterComponent={ListFooterComponent}
          onEndReached={() => {
            if (activeTab !== 'badge' && activeTab !== 'collections') {
              if (activeTabQuery.hasNextPage && !activeTabQuery.isFetchingNextPage) {
                activeTabQuery.fetchNextPage();
              }
            }
          }}
          onEndReachedThreshold={0.3}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          bounces={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          contentContainerStyle={{
            paddingBottom: bottomPadding,
          }}
        />
      </View>


      {/* Profile Menu Modal - React Native Modal */}
      {!isOwnProfile && (
        <RNModal
          visible={isMenuOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsMenuOpen(false)}
        >
          <RNPressable 
            style={styles.overlay} 
            onPress={() => setIsMenuOpen(false)} 
          >
            <View 
              style={[
                styles.menuContent, 
                { 
                  top: menuPosition.top, 
                  left: menuPosition.left,
                  backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: isDark ? '#333333' : '#E9E9E9',
                  shadowOpacity: isDark ? 0.3 : 0.1,
                }
              ]}
              onLayout={(event) => {
                const { x, y, width, height } = event.nativeEvent.layout;
                if (__DEV__) {
                  console.log('🎯 [ProfileScreen] Modal opened at position:', {
                    styleTop: menuPosition.top,
                    styleLeft: menuPosition.left,
                    actualLayout: { x, y, width, height },
                    screenWidth: Dimensions.get('window').width,
                    screenHeight: Dimensions.get('window').height,
                    reference: 'Modal View uses position: absolute (relative to window/screen)',
                  });
                }
              }}
            >
              <RNPressable 
                onPress={(e) => e.stopPropagation()}
                style={{ flex: 1 }}
              >
                <VStack px={8} pl={12} py={2} width="100%">
                  {/* Mute / Unmute */}
                  <Pressable
                    onPress={() => {
                      setIsMenuOpen(false);
                      actionButtonsRef.current?.handleMuteToggle();
                    }}
                    py={8}
                  >
                    <HStack alignItems="center" justifyContent="flex-start" space="xs">
                      {userProfile?.isMuted ? (
                        <Box position="relative" justifyContent="center" alignItems="center">
                          <BellIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                          <Box
                            position="absolute"
                            width={24}
                            height={1}
                            bg={isDark ? '#FFFFFF' : '#000000'}
                            style={{
                              transform: [{ rotate: '-45deg' }],
                            }}
                          />
                        </Box>
                      ) : (
                        <BellSlashIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                      )}
                      <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize="$sm"
                        fontWeight="$medium"
                      >
                        {userProfile?.isMuted ? t('actions.unmute') : t('actions.mute')}
                      </Text>
                    </HStack>
                  </Pressable>
                  <Divider 
                    bg={isDark ? '#333333' : '#E9E9E9'} 
                    mx={0}
                  />
                  {/* Report */}
                  <Pressable
                    onPress={() => {
                      setIsMenuOpen(false);
                      handleReport();
                    }}
                    py={8}
                  >
                    <HStack alignItems="center" justifyContent="flex-start" space="xs">
                      <FlagIcon width={20} height={20} color="#FF3040" />
                      <Text
                        color="#FF3040"
                        fontSize="$sm"
                        fontWeight="$medium"
                      >
                        {t('actions.report')}
                      </Text>
                    </HStack>
                  </Pressable>
                  <Divider
                    bg={isDark ? '#333333' : '#E9E9E9'}
                    mx={0}
                  />
                  {/* Block */}
                  <Pressable
                    onPress={() => {
                      setIsMenuOpen(false);
                      handleBlock();
                    }}
                    py={8}
                  >
                    <HStack alignItems="center" justifyContent="flex-start" space="xs">
                      <NoSymbolIcon width={20} height={20} color="#FF3040" />
                      <Text
                        color="#FF3040"
                        fontSize="$sm"
                        fontWeight="$medium"
                      >
                        {t('actions.block')}
                      </Text>
                    </HStack>
                  </Pressable>
                </VStack>
              </RNPressable>
            </View>
          </RNPressable>
        </RNModal>
      )}

      {/* Send TIPS Modal */}
      <SendTipsModal
        visible={isSendTipsModalVisible}
        recipientName={userProfile?.name || 'Unknown'}
        recipientAvatar={userProfile?.avatar ? (toImageSource(userProfile.avatar) || require('@/assets/avatar/default-useravatar.png')) : require('@/assets/avatar/default-useravatar.png')}
        currentBalance={user?.balance || 1000} // TODO: Get from wallet API
        onClose={() => setIsSendTipsModalVisible(false)}
        onSend={handleSendTips}
      />

      {/* Badge Detail Modal */}
      <Modal
        isOpen={!!selectedBadge}
        onClose={handleCloseModal}
        size="lg"
        closeOnOverlayClick={true}
      >
        <ModalBackdrop onPress={handleCloseModal} />
        {selectedBadge ? (
          <ModalContent
            bg={isDark ? '#1A1A1A' : '#FDFDFB'}
            borderRadius={20}
            marginHorizontal={24}
            marginBottom={safeAreaBottom + 24}
            maxHeight="80%"
          >
            <BadgeBottomSheet
              data={selectedBadge}
              onClose={handleCloseModal}
              hideFollowLadder={isOwnProfile}
              eventId="" // Profile badge'leri event'e bağlı değil
            />
          </ModalContent>
        ) : null}
      </Modal>

      <FullScreenImageViewer visible={fullScreenVisible} imageSource={fullScreenSource} onClose={closeImage} />
    </Box>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuContent: {
    position: 'absolute',
    width: 200,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    overflow: 'hidden',
  },
});