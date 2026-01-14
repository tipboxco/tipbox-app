import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, ScrollView, Alert, FlatList, Dimensions, RefreshControl, Pressable as RNPressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, Pressable, HStack, VStack, Image, Modal, ModalBackdrop, ModalContent } from '@gluestack-ui/themed';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  interpolate,
  withTiming,
  useAnimatedScrollHandler,
  useAnimatedRef,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useUserProfile, useUserPosts, useUserReviews, useUserBenchmarks, useUserTipsAndTricks, useUserReplies, useAddToTrustList, useRemoveFromTrustList, useReportUser, profileKeys } from '../api/hooks';
import { useSendGift, useCreateSupportRequest, useSendDirectMessage } from '@/src/features/inbox/api/hooks';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { Share } from 'react-native';
import { useAppStore } from '@/src/store/appStore';
import { useQueryClient } from '@tanstack/react-query';
import { ProfileStackParamList } from '../navigation';
import { toImageSource, useSafeAreaValues, useBottomOffset } from '@/src/utils';
import { CardType } from '@/src/types/common';
import type { PostCardData } from '@/src/types/PostCard';
import type { ReviewCardData, ReviewCardContentItem } from '@/src/types/ReviewsCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { ProfilePost, ProfileReview } from '../types';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import PostCard from '@/src/components/PostCards/PostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import { LadderTab } from '../components/TabContents';
import {
  ArrowUpTrayIcon,
  FlagIcon,
  NoSymbolIcon,
  ChevronLeftIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  GiftIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  BellIcon,
  UserMinusIcon,
  UserPlusIcon,
} from 'react-native-heroicons/outline';
import { FeedSkeleton } from '@/src/components/Skeletons';
import { ContextMenuReanimated } from '@/src/components/PostCards/PostCard/ContextMenuReanimated';
import BadgeBottomSheet from '@/src/features/events/components/BadgeBottomSheet';
import type { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import type { Badge } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

const TABS = [
  { key: 'feed',        title: 'Feed' },
  { key: 'reviews',     title: 'Reviews' },
  { key: 'benchmarks',  title: 'Benchmarks' },
  { key: 'tips',        title: 'Tips & Tricks' },
  { key: 'replies',     title: 'Questions' },
  { key: 'ladders',     title: 'Ladders' },
] as const;

type TabKey = typeof TABS[number]['key'];

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

  // images array'i boşsa veya görseller yüklenemediyse default görsel ekle
  const mappedImages = post.images
    ?.map((img) => toImageSource(img))
    .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
  const images = mappedImages.length > 0 ? mappedImages : [defaultPostImage];

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

const mapExperienceToCardData = (review: ProfileReview): ReviewCardData | null => {
  if (!review?.id || !review?.user?.id) {
    return null;
  }
  
  const avatarSource = review.user?.avatar
    ? toImageSource(review.user.avatar)!
      : require('@/assets/avatar/default-useravatar.png');
  
  const productImage = review.contextData?.image
    ? toImageSource(review.contextData.image)
    : undefined;

  const content: ReviewCardContentItem[] = review.content?.map((item) => ({
    tag: {
      icon: 'tag',
      title: item?.title || '',
    },
    text: item?.content || '',
    rating: Array(5)
      .fill(false)
      .map((_, index) => index < (item?.rating || 0)),
  })) ?? [];

  return {
    id: review.id,
    user: {
      id: review.user.id,
      name: review.user.name || 'Unknown',
      title: review.user.title || '',
      avatar: avatarSource,
      action: 'wrote a review',
    },
    contextData: {
      id: review.contextData?.id || '',
      name: review.contextData?.name || '',
      subName: review.contextData?.subName || '',
      image: productImage,
      isOwned: review.contextData?.isOwned,
    },
    content,
    tags: review.tags?.slice(0, 3) ?? [],
    images:
      review.images
        ?.map((img) => toImageSource(img))
        .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [],
    stats: review.stats,
    createdAt: review.createdAt,
  };
};

const mapBenchmarkToCardData = (item: BenchmarkApiItem): BenchmarkCardData | null => {
  if (!item?.id || !item?.user?.id) {
    return null;
  }
  
  const avatarSource = toImageSource(item.user.avatar)!;
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
  
  const avatarSource = toImageSource(item?.user?.avatar)!;
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
    createdAt: item.createdAt,
  };
};

const mapQuestionToCardData = (item: QuestionApiItem): QuestionCardData | null => {
  if (!item?.contextData?.id) {
    return null;
  }
  
  const avatarSource = toImageSource(item?.user?.avatar)!;
  const contextImage = toImageSource(item.contextData?.image) || require('@/assets/inventory/product_01.png');
  const product: QuestionCardProduct = {
    id: item.contextData.id,
    name: item.contextData.name || '',
    subName: item.contextData.subName || '',
    image: contextImage,
  };
  const category: QuestionCardCategory = {
    id: item.contextData.id,
    name: item.contextData.name || '',
    subCategory: item.contextData.subName || '',
    image: contextImage,
    product,
  };

  // images array'i boşsa veya görseller yüklenemediyse default görsel ekle
  const defaultPostImage = require('@/assets/defaultImages/default-post.png');
  const mappedImages = item.images
    ?.map((img) => toImageSource(img))
    .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
  const images = mappedImages.length > 0 ? mappedImages : [defaultPostImage];

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
    images,
    stats: item.stats,
    createdAt: item.createdAt,
  };
};

// Mapped post type
type MappedPost = 
  | { type: 'post'; id: string; data: PostCardData }
  | { type: 'experience'; id: string; data: ReviewCardData }
  | { type: 'benchmark'; id: string; data: BenchmarkCardData }
  | { type: 'tips'; id: string; data: TipsCardData }
  | { type: 'question'; id: string; data: QuestionCardData };

// Tab page props
interface TabPageProps {
  tabKey: TabKey;
  targetUserId: string;
  isDark: boolean;
  bottomPadding: number;
  listHeaderComponent?: React.ReactElement | null;
  onRefresh?: () => void;
  refreshing?: boolean;
}

// TabsBar Component - NotificationsScreen'deki gibi
interface TabsBarProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  isDark: boolean;
  progress: ReturnType<typeof useSharedValue<number>>;
  tabContainerRef: React.RefObject<any>;
  onTabContainerLayout: (width: number) => void;
}

const TabsBar: React.FC<TabsBarProps> = ({ activeTab, onChangeTab, isDark, progress, tabContainerRef, onTabContainerLayout }) => {
  const activeColor = isDark ? '#FFFFFF' : '#000000';
  const inactiveColor = '#A3A3A3';
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  
  // Her tab için genişlik ve pozisyon state'i (metin genişliğine göre)
  const [tabWidths, setTabWidths] = useState<number[]>([]);
  const [tabPositions, setTabPositions] = useState<number[]>([]);
  const tabRefs = useRef<{ [key: string]: any }>({});
  
  // ScrollView scroll pozisyonunu takip et (indicator için)
  const scrollViewOffset = useSharedValue(0);
  
  // ScrollView scroll handler
  const handleScrollViewScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollViewOffset.value = event.contentOffset.x;
    },
  });
  
  // Tab genişliği hesaplama - aktif tab'ın genişliğini kullan
  const getTabWidth = useCallback((index: number) => {
    if (tabWidths[index]) {
      return tabWidths[index];
    }
    return 80; // Default genişlik
  }, [tabWidths]);
  
  // Aktif tab'ın genişliği (indicator için)
  const activeTabIndex = TABS.findIndex(tab => tab.key === activeTab);
  const activeTabWidth = activeTabIndex >= 0 ? getTabWidth(activeTabIndex) : 80;
  
  // Her tab için animasyonlu stil - NotificationsScreen'deki gibi
  // Tab 0 (Feed)
  const tab0Style = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [-0.5, 0, 0.5],
      [activeColor, activeColor, inactiveColor]
    );
    return { color };
  }, [isDark]);

  // Tab 1 (Reviews)
  const tab1Style = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0.5, 1, 1.5],
      [inactiveColor, activeColor, inactiveColor]
    );
    return { color };
  }, [isDark]);

  // Tab 2 (Benchmarks)
  const tab2Style = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [1.5, 2, 2.5],
      [inactiveColor, activeColor, inactiveColor]
    );
    return { color };
  }, [isDark]);

  // Tab 3 (Tips & Tricks)
  const tab3Style = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [2.5, 3, 3.5],
      [inactiveColor, activeColor, inactiveColor]
    );
    return { color };
  }, [isDark]);

  // Tab 4 (Questions)
  const tab4Style = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [3.5, 4, 4.5],
      [inactiveColor, activeColor, inactiveColor]
    );
    return { color };
  }, [isDark]);

  // Tab 5 (Ladders)
  const tab5Style = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [4.5, 5, 5.5],
      [inactiveColor, activeColor, activeColor]
    );
    return { color };
  }, [isDark]);

  const getTabStyle = (index: number) => {
    switch (index) {
      case 0: return tab0Style;
      case 1: return tab1Style;
      case 2: return tab2Style;
      case 3: return tab3Style;
      case 4: return tab4Style;
      case 5: return tab5Style;
      default: return tab0Style;
    }
  };


  // Tab genişliklerini ve pozisyonlarını shared value olarak tut (worklet context için)
  const tabWidthsShared = useSharedValue<number[]>([]);
  const tabPositionsShared = useSharedValue<number[]>([]);
  
  // Tab genişlikleri ve pozisyonları güncellendiğinde shared value'yu güncelle
  useEffect(() => {
    if (tabWidths.length === TABS.length) {
      tabWidthsShared.value = tabWidths;
    }
  }, [tabWidths]);
  
  useEffect(() => {
    if (tabPositions.length === TABS.length) {
      tabPositionsShared.value = tabPositions;
    }
  }, [tabPositions]);
  
  // Indicator position animation - scroll offset'i dikkate al
  // Indicator genişliği aktif tab'ın genişliğine göre
  const indicatorStyle = useAnimatedStyle(() => {
    'worklet';
    const currentIndex = Math.floor(progress.value);
    const nextIndex = Math.min(Math.ceil(progress.value), TABS.length - 1);
    const offset = progress.value - currentIndex;
    
    // Tab genişliklerini ve pozisyonlarını al
    const widths = tabWidthsShared.value;
    const positions = tabPositionsShared.value;
    
    if (widths.length === 0 || positions.length === 0) {
      return { transform: [{ translateX: 0 }], width: 0 };
    }
    
    // Mevcut ve sonraki tab'ın genişliklerini ve pozisyonlarını al
    const currentWidth = widths[currentIndex] || 80;
    const nextWidth = widths[nextIndex] || currentWidth;
    const currentPosition = positions[currentIndex] || 0;
    const nextPosition = positions[nextIndex] || currentPosition;
    
    // Smooth geçiş için interpolate
    const baseTranslateX = currentPosition + (nextPosition - currentPosition) * offset;
    const baseWidth = currentWidth + (nextWidth - currentWidth) * offset;
    const indicatorWidthAnimated = baseWidth * 0.8;
    
    // Indicator'ı tab'ın ortasına hizala (ScrollView scroll offset'ini dikkate al)
    const translateX = baseTranslateX + (baseWidth - indicatorWidthAnimated) / 2 - scrollViewOffset.value;
    
    return {
      transform: [{ translateX }],
      width: indicatorWidthAnimated,
    };
  });

  return (
    <Box
      mb={16}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      borderBottomWidth={StyleSheet.hairlineWidth}
      borderBottomColor={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
      position="relative"
    >
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: 16,
        }}
        scrollEventThrottle={16}
        onScroll={handleScrollViewScroll}
        scrollEnabled={true}
        bounces={false}
      >
        <HStack
          ref={tabContainerRef}
          borderBottomWidth={1}
          borderColor="#E9E9E9"
          p={0}
          mb="$2"
          position="relative"
          space="md"
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            onTabContainerLayout(width);
          }}
        >
          {TABS.map((tab, index) => {
            const tabStyle = getTabStyle(index);
            return (
              <Pressable
                key={tab.key}
                ref={(ref) => {
                  if (ref) {
                    tabRefs.current[tab.key] = ref;
                  }
                }}
                onPress={() => onChangeTab(tab.key)}
                alignItems="center"
                py="$1"
                px="$2"
                onLayout={(event) => {
                  const { width, x } = event.nativeEvent.layout;
                  setTabWidths((prev) => {
                    const newWidths = [...prev];
                    newWidths[index] = width;
                    return newWidths;
                  });
                  setTabPositions((prev) => {
                    const newPositions = [...prev];
                    // X pozisyonu HStack içindeki relative pozisyon
                    // ScrollView padding (16px) zaten indicator'ın left'inde var
                    newPositions[index] = x;
                    return newPositions;
                  });
                }}
              >
                <VStack alignItems="center" space="xs">
                  <Animated.Text
                    style={[
                      {
                        fontSize: 12,
                        fontWeight: 'bold',
                      },
                      tabStyle,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {tab.title}
                  </Animated.Text>
                </VStack>
              </Pressable>
            );
          })}

          {/* Animated Indicator */}
          {activeTabWidth > 0 && tabPositions.length === TABS.length && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  height: 2,
                  backgroundColor: isDark ? '#FFFFFF' : '#000000',
                },
                indicatorStyle,
              ]}
            />
          )}
        </HStack>
      </Animated.ScrollView>
    </Box>
  );
};

// Tab Page Component - Her tab için ayrı bir sayfa
const TabPage: React.FC<TabPageProps> = ({ tabKey, targetUserId, isDark, bottomPadding, listHeaderComponent, onRefresh, refreshing }) => {
  // Scroll position state - en üstteyken pull-to-refresh'i engellemek için
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // API hooks for each tab
  const feedQuery = useUserPosts(targetUserId, 5, { enabled: tabKey === 'feed' });
  const reviewsQuery = useUserReviews(targetUserId, 5, { enabled: tabKey === 'reviews' });
  const benchmarksQuery = useUserBenchmarks(targetUserId, 5, { enabled: tabKey === 'benchmarks' });
  const tipsQuery = useUserTipsAndTricks(targetUserId, 5, { enabled: tabKey === 'tips' });
  const repliesQuery = useUserReplies(targetUserId, 5, { enabled: tabKey === 'replies' });
  
  // Get active tab query
  const activeTabQuery = useMemo(() => {
    switch (tabKey) {
      case 'feed': return feedQuery;
      case 'reviews': return reviewsQuery;
      case 'benchmarks': return benchmarksQuery;
      case 'tips': return tipsQuery;
      case 'replies': return repliesQuery;
      default: return feedQuery;
    }
  }, [tabKey, feedQuery, reviewsQuery, benchmarksQuery, tipsQuery, repliesQuery]) as typeof feedQuery;
  
  // Flatten and map posts based on active tab
  const mappedPosts = useMemo(() => {
    if (tabKey === 'ladders') return [];
    
    const queryData = activeTabQuery.data as any;
    if (!queryData?.pages) return [];
    
    const allItems = queryData.pages.flatMap((page: any) => page?.items ?? []) ?? [];
    const validItems = allItems.filter((item: any) => item?.id);
    const uniqueItems = validItems.filter((item: any, index: number, self: any[]) => 
      index === self.findIndex((t: any) => t?.id === item?.id)
    );
    
    const mapped: MappedPost[] = [];
    
    for (const item of uniqueItems) {
      let mappedItem: MappedPost | null = null;
      
      switch (item.type) {
        case CardType.EXPERIENCE:
          if (item?.contextData && Array.isArray(item?.content)) {
            const experienceData = mapExperienceToCardData(item as ProfileReview);
            if (experienceData) {
              mappedItem = { type: 'experience', id: item.id, data: experienceData };
            }
          }
          break;
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
        case CardType.QUESTION:
          if (item?.contextData?.id && 'isBoosted' in item) {
            const questionData = mapQuestionToCardData(item as QuestionApiItem);
            if (questionData) {
              mappedItem = { type: 'question', id: item.id, data: questionData };
            }
          }
          break;
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
  }, [activeTabQuery.data, tabKey]);
  
  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (activeTabQuery.hasNextPage && !activeTabQuery.isFetchingNextPage) {
      activeTabQuery.fetchNextPage();
    }
  }, [activeTabQuery]);

  // Handle scroll - scroll position'ı track et
  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setScrollOffset(offsetY);
    // ARCHITECTURE FIX: En üstte olup olmadığını kontrol et (küçük bir threshold ile)
    // 5px threshold - küçük scroll hatalarını göz ardı et
    setIsAtTop(offsetY <= 5);
  }, []);

  // Handle refresh - sadece en üstte değilse refresh yap
  const handleRefresh = useCallback(() => {
    // ARCHITECTURE FIX: En üstteyken (isAtTop === true) pull-to-refresh'i engelle
    // Kullanıcı zaten en üstte olduğu için görünecek bir şey yok
    // Sadece aşağı scroll edilmişse (isAtTop === false) refresh yap
    if (!isAtTop && onRefresh) {
      onRefresh();
    }
  }, [isAtTop, onRefresh]);
  
  // Render post card
  const renderPostCard = useCallback((postData: MappedPost) => {
    switch (postData.type) {
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
  
  // Render LadderTab
  if (tabKey === 'ladders') {
    return (
      <Box flex={1}>
        <LadderTab />
      </Box>
    );
  }

  // Dikey FlatList kullan - her tab kendi scroll'unu yönetir
  return (
    <FlatList
      ref={flatListRef}
      data={mappedPosts}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={listHeaderComponent}
      ListEmptyComponent={
        activeTabQuery.isLoading && !((activeTabQuery.data as any)?.pages?.[0]) ? (
          <FeedSkeleton count={3} />
        ) : (
          <Box py={20} alignItems="center">
            <Text color={isDark ? '$textLight400' : '$textDark400'} fontSize="$sm">
              No content found yet.
            </Text>
          </Box>
        )
      }
      renderItem={({ item }) => (
        <Box px={16}>
          {renderPostCard(item)}
        </Box>
      )}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        activeTabQuery.isFetchingNextPage ? (
          <Box py={20} alignItems="center">
            <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
          </Box>
        ) : null
      }
      contentContainerStyle={{
        paddingBottom: bottomPadding,
      }}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing || false}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#FFFFFF' : '#000000'}
            colors={isDark ? ['#FFFFFF'] : ['#000000']}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={true}
      scrollEnabled={true}
      nestedScrollEnabled={false}
      bounces={false}
      alwaysBounceVertical={false}
    />
  );
};

const ProfileScreen = ({ route }: ProfileScreenProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { user } = useAppStore();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const rootNavigation = useNavigation<any>();
  const safeAreaTop = useSafeAreaValues('top');
  const safeAreaBottom = useSafeAreaValues('bottom');
  
  // Bottom padding for FlatList content
  const bottomPadding = useBottomOffset({ includeTabBar: false, extraPadding: 16 });
  
  // Route params'tan userId al, yoksa store'daki user.id'yi kullan
  const routeUserId = route.params?.userId;
  const targetUserId = routeUserId || user?.id;
  
  // Query client for manual refetch
  const queryClient = useQueryClient();
  
  // Profile API hook
  const { data: userProfile, isLoading: isProfileLoading, error: profileError, refetch: refetchProfile } = useUserProfile(targetUserId);
  
  // Pull to refresh state
  const [refreshing, setRefreshing] = useState(false);
  
  // Focus'ta otomatik refresh state - yeni gönderi oluşturulduktan sonra ekrana yönlendirildiğinde gösterilecek
  const [isRefreshingOnFocus, setIsRefreshingOnFocus] = useState(false);
  
  // Badge modal state
  const [selectedBadge, setSelectedBadge] = useState<SeeAllReward | null>(null);
  
  // ARCHITECTURE FIX: Ekran focus olduğunda mevcut kullanıcının tüm profil verilerini refetch et
  // Yeni gönderi oluşturulduktan sonra ProfileScreen'e dönüldüğünde yeni gönderi görünsün
  useFocusEffect(
    useCallback(() => {
      // Sadece kendi profilimizdeysek (targetUserId === user?.id) refetch et
      if (targetUserId && user?.id && targetUserId === user.id) {
        // Activity indicator göster
        setIsRefreshingOnFocus(true);
        
        // Tüm profil verilerini invalidate et ve backend'den yeni veriyi çek
        // CreatePostScreen'lerde zaten invalidate yapılıyor ama burada da yapıyoruz
        // çünkü diğer yerlerden de ProfileScreen'e yönlendirilebilir
        Promise.all([
          // Cache'i invalidate et - yeni gönderi için cache'i temizle
          queryClient.invalidateQueries({ 
            queryKey: profileKeys.userPosts(targetUserId),
            exact: false 
          }),
          queryClient.invalidateQueries({ 
            queryKey: profileKeys.profile(targetUserId),
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
        ]).then(() => {
          // Cache invalidate edildikten sonra backend'den yeni veriyi çek
          return Promise.all([
            queryClient.refetchQueries({ 
              queryKey: profileKeys.userPosts(targetUserId),
              exact: false 
            }),
            queryClient.refetchQueries({ 
              queryKey: profileKeys.profile(targetUserId),
              exact: false 
            }),
            queryClient.refetchQueries({ 
              queryKey: profileKeys.userReviews(targetUserId),
              exact: false 
            }),
            queryClient.refetchQueries({ 
              queryKey: profileKeys.userBenchmarks(targetUserId),
              exact: false 
            }),
            queryClient.refetchQueries({ 
              queryKey: profileKeys.userTipsAndTricks(targetUserId),
              exact: false 
            }),
            queryClient.refetchQueries({ 
              queryKey: profileKeys.userReplies(targetUserId),
              exact: false 
            }),
          ]);
        }).then(() => {
          // Refetch tamamlandıktan sonra activity indicator'ı kapat
          setIsRefreshingOnFocus(false);
          console.log('[ProfileScreen] ✅ Focus refresh completed - yeni gönderi yüklendi');
        }).catch((error) => {
          console.error('[ProfileScreen] ❌ Focus refresh error:', error);
          setIsRefreshingOnFocus(false);
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
      
      console.log('[ProfileScreen] ✅ Pull to refresh completed');
    } catch (error) {
      console.error('[ProfileScreen] ❌ Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [targetUserId, refetchProfile, queryClient]);
  
  // Avatar URL kontrolü için log
  React.useEffect(() => {
    if (userProfile) {
      console.log('[ProfileScreen] User Profile Avatar:', {
        userId: userProfile.id,
        name: userProfile.name,
        avatar: userProfile.avatar,
        hasAvatar: !!userProfile.avatar,
        avatarLength: userProfile.avatar?.length || 0,
      });
    }
  }, [userProfile]);
  
  // Trust mutations
  const { mutate: trustUser, isPending: isTrusting } = useAddToTrustList();
  const { mutate: untrustUser, isPending: isUntrusting } = useRemoveFromTrustList();
  
  // Inbox mutations
  const sendGiftMutation = useSendGift();
  const createSupportRequestMutation = useCreateSupportRequest();
  const sendDirectMessageMutation = useSendDirectMessage();
  
  // Report mutation
  const { mutate: reportUser, isPending: isReporting } = useReportUser();
  
  // Kullanıcının kendi profiline bakıp bakmadığını kontrol et
  const isOwnProfile = user?.id === targetUserId;
  
  // Context menu state
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const contextMenuCloseRef = useRef<(() => void) | null>(null);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<TabKey>('feed');
  const pagerRef = useRef<PagerView>(null);
  const tabContainerRef = useRef<any>(null);
  
  // 🎯 CORE: Shared progress value for tab animations
  const progress = useSharedValue(0);
  
  // Tab index'i bul
  const getTabIndex = useCallback((tabKey: TabKey) => {
    return TABS.findIndex(tab => tab.key === tabKey);
  }, []);
  
  // Tab değiştiğinde PagerView'ı programatik olarak değiştir
  const handleTabChange = useCallback((tabKey: TabKey) => {
    const index = getTabIndex(tabKey);
    if (index !== -1 && pagerRef.current) {
      // PagerView'ı native animasyon ile değiştir
      pagerRef.current.setPage(index);
    }
  }, [getTabIndex]);
  
  // PagerView scroll handler - realtime progress güncelleme
  const handlePageScroll = useCallback(
    (e: any) => {
      'worklet';
      const { position, offset } = e.nativeEvent;
      progress.value = position + offset;
    },
    [progress]
  );

  // PagerView page selected handler - snap sonrası sync
  const handlePageSelected = useCallback(
    (e: any) => {
      const position = e.nativeEvent.position;
      progress.value = withTiming(position, { duration: 0 });
      
      // Active tab'ı güncelle (sadece snap tamamlandıktan sonra)
      const tabKey = TABS[position]?.key;
      if (tabKey) {
        setActiveTab(tabKey);
      }
    },
    [progress]
  );
  
  // Tab container width için callback
  const handleTabContainerLayout = useCallback((width: number) => {
    // Tab container width'i state'e kaydet (gerekirse)
  }, []);
  
  // Action button handlers
  const handleSendTIPS = useCallback(() => {
    if (!user?.id || !targetUserId) return;
    // MessageDetail screen'ine navigate et (TIPS gönderme için)
    navigationService.navigate(ROOT_ROUTES.MESSAGE_DETAIL, {
      messageId: targetUserId,
      threadId: targetUserId,
      recipientUserId: targetUserId,
    });
  }, [user?.id, targetUserId]);

  const handle1on1Request = useCallback(() => {
    if (!user?.id || !targetUserId) return;
    // MessageDetail screen'ine navigate et (1-on-1 request için)
    navigationService.navigate(ROOT_ROUTES.MESSAGE_DETAIL, {
      messageId: targetUserId,
      threadId: targetUserId,
      recipientUserId: targetUserId,
    });
  }, [user?.id, targetUserId]);

  const handleDM = useCallback(() => {
    if (!user?.id || !targetUserId) return;
    // MessageDetail screen'ine navigate et
    navigationService.navigate(ROOT_ROUTES.MESSAGE_DETAIL, {
      messageId: targetUserId,
      threadId: targetUserId,
      recipientUserId: targetUserId,
    });
  }, [user?.id, targetUserId]);

  const handleShare = useCallback(async () => {
    if (!userProfile) return;
    try {
      await Share.share({
        message: `Check out ${userProfile.name}'s profile on Tipbox!`,
        url: `tipboxapp://profile/user/${targetUserId}`,
      });
    } catch (error) {
      console.error('[ProfileScreen] Share error:', error);
    }
  }, [userProfile, targetUserId]);

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
                description: 'Kullanıcı raporlandı',
              },
            });
          },
        },
      ]
    );
  }, [user?.id, targetUserId, reportUser]);

  const handleBlock = useCallback(() => {
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
            console.log('[ProfileScreen] Block user:', targetUserId);
            // Navigate back after blocking
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  }, [targetUserId, navigation]);

  // Map Badge to SeeAllReward format for BadgeBottomSheet
  const mapBadgeToSeeAllReward = useCallback((badge: Badge): SeeAllReward => {
    const imageSource = badge.image ? toImageSource(badge.image) : require('@/assets/defaultImages/default-badge.png');
    
    return {
      id: badge.id,
      title: badge.title,
      image: imageSource,
      description: `"${badge.title}" rozetini kazandın!`,
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
  const renderProfileHeader = useCallback((activeTab: TabKey, onChangeTab: (tab: TabKey) => void, isLoading: boolean): React.ReactElement | null => {
    if (!userProfile && !isLoading) return null;
    if (!userProfile) return null;
    
    // TypeScript için: userProfile bu noktada kesinlikle tanımlı
    const profile = userProfile;
    
    return (
      <Box bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Banner */}
        <Box 
          h={140} 
          overflow="hidden" 
          position="relative"
        >
          <Image
            source={toImageSource(profile.bannerUrl) || require('@/assets/banner/banner_01.png')}
            alt="Profile Banner"
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          {/* Overlay */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(0, 0, 0, 0.5)"
          />
          
          {/* Pull to Refresh Loading Overlay - Banner'ın üstünde */}
          {(refreshing || isRefreshingOnFocus) && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="rgba(0, 0, 0, 0.3)"
              justifyContent="center"
              alignItems="center"
              zIndex={3000}
            >
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#FFFFFF'} />
            </Box>
          )}
          
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
              <Box position="relative" zIndex={2001}>
                <ContextMenuReanimated
                  menuItems={[
                    {
                      label: 'Paylaş',
                      icon: <ArrowUpTrayIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />,
                      onPress: handleShare,
                    },
                    {
                      label: 'Şikayet Et',
                      icon: <FlagIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />,
                      onPress: handleReport,
                    },
                    {
                      label: 'Engelle',
                      icon: <NoSymbolIcon width={20} height={20} color="#FF3040" />,
                      onPress: handleBlock,
                      color: '#FF3040',
                    },
                  ]}
                  onMenuStateChange={setIsContextMenuOpen}
                  onCloseRef={(closeFn) => {
                    contextMenuCloseRef.current = closeFn;
                  }}
                >
                  <EllipsisVerticalIcon size={24} color="#fff" />
                </ContextMenuReanimated>
              </Box>
            )}
          </Box>
        </Box>

        {/* Profile Image and Action Buttons Row */}
        <Box px={15} mt={-20}>
          <HStack alignItems="flex-start" justifyContent="space-between" space="md">
            {/* Profile Image */}
            <Box 
              borderRadius={100}
              overflow="hidden"
              w={68}
              h={68}
              borderWidth={2}
              borderColor="$white"
              flexShrink={0}
            >
              <Image
                source={toImageSource(profile.avatar) || require('@/assets/avatar/default-useravatar.png') }
                alt={profile.name}
                w="100%"
                h="100%"
              />
            </Box>

            {/* Action Buttons */}
            <HStack space="sm" alignItems="center" flexShrink={0} mt={32}>
              {isOwnProfile ? (
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
                  onPress={() => {
                    navigation.navigate('ProfileEdit');
                  }}
                >
                  <PencilIcon size={14} color="#000" />
                  <Text
                    color="#000"
                    fontSize={10}
                    fontWeight="$semibold"
                  >
                    Edit Profile
                  </Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    w={34}
                    h={34}
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    justifyContent="center"
                    alignItems="center"
                    onPress={handleSendTIPS}
                  >
                    <GiftIcon size={16} color="#000" />
                  </Pressable>
                  
                  <Pressable
                    w={34}
                    h={34}
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    justifyContent="center"
                    alignItems="center"
                    onPress={handle1on1Request}
                  >
                    <PhoneIcon size={16} color="#000" />
                  </Pressable>
                  
                  <Pressable
                    w={34}
                    h={34}
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    justifyContent="center"
                    alignItems="center"
                    onPress={handleDM}
                  >
                    <ChatBubbleLeftIcon size={16} color="#000" />
                  </Pressable>
                  
                  <Pressable
                    w={34}
                    h={34}
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    justifyContent="center"
                    alignItems="center"
                    onPress={() => {
                      console.log('[ProfileScreen] Notification pressed');
                    }}
                  >
                    <BellIcon size={16} color="#000" />
                  </Pressable>
                  
                  <Pressable
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    px={14}
                    py={10}
                    flexDirection="row"
                    alignItems="center"
                    gap={2}
                    onPress={() => {
                      if (!targetUserId) return;
                      if (profile.isTrusted) {
                        untrustUser(targetUserId);
                      } else {
                        trustUser(targetUserId);
                      }
                    }}
                    disabled={isTrusting || isUntrusting}
                    opacity={(isTrusting || isUntrusting) ? 0.6 : 1}
                  >
                    {profile.isTrusted ? (
                      <UserMinusIcon size={16} color="#000" />
                    ) : (
                      <UserPlusIcon size={16} color="#000" />
                    )}
                    <Text
                      color="#000"
                      fontSize={10}
                      fontWeight="$semibold"
                    >
                      {isTrusting ? "Ekleniyor..." : isUntrusting ? "Kaldırılıyor..." : (profile.isTrusted ? "Un Trust" : "Trust")}
                    </Text>
                  </Pressable>
                </>
              )}
            </HStack>
          </HStack>
        </Box>

        {/* Profile Info */}
        <Box px={15} mt={10}>
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            fontSize="$md"
            fontWeight="$bold"
          >
            {profile.name}
          </Text>

          {profile.biography && (
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize="$xs"
              lineHeight={15}
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
              {profile.stats.posts}
            </Text>
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize="$xs"
            >
              Posts
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
                  console.log('[ProfileScreen] Navigating to TrustList with userId:', targetUserId, 'initialTab: trust');
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
                  {profile.stats.trust}
                </Text>
                <Text
                  color={isDark ? '$textDark400' : '$textLight600'}
                  fontSize="$xs"
                >
                  Trust
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
                  console.log('[ProfileScreen] Navigating to TrustList with userId:', targetUserId, 'initialTab: truster');
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
                  {profile.stats.truster > 999 ? `${Math.floor(profile.stats.truster / 1000)}K` : profile.stats.truster}
                </Text>
                <Text
                  color={isDark ? '$textDark400' : '$textLight600'}
                  fontSize="$xs"
                >
                  Truster
                </Text>
              </HStack>
            </Pressable>
          </HStack>
        </Box>

        {/* Inventory Header */}
        <Box mt={20} px={15}>
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
                {profile.name}'s Inventory
              </Text>
            </Pressable>
          </Box>
        </Box>

        {/* Badge Items */}
        {isProfileLoading ? (
          <Box mt={6} px={15} pb={16}>
            <Box
              borderRadius={5}
              p={14}
              h={130}
            >
              <HStack space="md" justifyContent="flex-start">
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
              </HStack>
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
          profile.badges && profile.badges.length > 0 && (
            <Box mt={6} px={15} pb={16}>
              <Box
                borderRadius={5}
                p={14}
                h={130}
              >
                <HStack space="md" justifyContent="flex-start">
                  {profile.badges.slice(0, 4).map((badge) => (
                    <Pressable
                      key={badge.id}
                      onPress={() => handleBadgePress(badge)}
                    >
                      <VStack space="xs" alignItems="center">
                        <Box
                          w={70}
                          h={70}
                          borderRadius={5}
                          borderWidth={0}
                          overflow="hidden"
                          justifyContent="center"
                          alignItems="center"
                        >
                          <Image
                            source={toImageSource(badge.image) || require('@/assets/defaultImages/default-badge.png')}
                            alt={badge.title}
                            w={60}
                            h={60}
                            resizeMode="contain"
                          />
                        </Box>
                        <Text
                          color={isDark ? '$textDark400' : '#000000'}
                          fontSize="$2xs"
                          fontWeight="$bold"
                          textAlign="center"
                        >
                          {badge.title}
                        </Text>
                      </VStack>
                    </Pressable>
                  ))}
                </HStack>
                <Pressable
                  onPress={() => {
                    navigation.navigate('Collections');
                  }}
                >
                  <Text
                    color={isDark ? '$textDark400' : '$textLight600'}
                    fontSize="$xs"
                    textAlign="center"
                    mt="$4"
                    fontWeight="$regular"
                  >
                    See More Collections
                  </Text>
                </Pressable>
              </Box>
            </Box>
          )
        )}
      </Box>
    );
  }, [userProfile, isDark, isOwnProfile, targetUserId, trustUser, untrustUser, isTrusting, isUntrusting, rootNavigation, user, navigation, handleShare, handleReport, handleBlock, handleBadgePress, refreshing, isRefreshingOnFocus]);
  
  // Profile header'ı memoize et - CRITICAL: Early return'lerden ÖNCE çağrılmalı (Rules of Hooks)
  // userProfile undefined olsa bile hook çağrılmalı (Rules of Hooks)
  const profileHeader = useMemo(() => {
    return renderProfileHeader(activeTab, handleTabChange, isProfileLoading);
  }, [renderProfileHeader, activeTab, handleTabChange, isProfileLoading, refreshing]);
  
  if (isProfileLoading) {
    return (
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }
  
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
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <StatusBar style="light" />
      <VStack flex={1}>
        {/* Üst Kısım: Profile Header - SABIT (scroll edilmez) */}
        <Box>
          {profileHeader}
        </Box>

        {/* Tab Bar - SABIT (scroll edilmez) */}
        <TabsBar 
          activeTab={activeTab} 
          onChangeTab={handleTabChange} 
          isDark={isDark}
          progress={progress}
          tabContainerRef={tabContainerRef}
          onTabContainerLayout={handleTabContainerLayout}
        />

        {/* Alt Kısım: PagerView - Sadece FlatList'ler değişir */}
        <AnimatedPagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageScroll={handlePageScroll}
          onPageSelected={handlePageSelected}
        >
          {TABS.map((tab, index) => (
            <Box key={tab.key} flex={1}>
              <TabPage
                tabKey={tab.key}
                targetUserId={targetUserId || ''}
                isDark={isDark}
                bottomPadding={bottomPadding}
                listHeaderComponent={null}
                onRefresh={handleRefresh}
                refreshing={refreshing}
              />
            </Box>
          ))}
        </AnimatedPagerView>
      </VStack>

      {/* Context Menu Backdrop - Boş bir yere tıklandığında context menu'yu kapat */}
      {isContextMenuOpen && (
        <Pressable
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={2000}
          onPress={() => {
            if (contextMenuCloseRef.current) {
              contextMenuCloseRef.current();
            }
          }}
          style={{
            backgroundColor: 'transparent',
          }}
        />
      )}

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
            />
          </ModalContent>
        ) : null}
      </Modal>
    </Box>
  );
};

export default ProfileScreen;
