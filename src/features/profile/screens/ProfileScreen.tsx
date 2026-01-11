import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, ScrollView, Alert, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, Pressable, HStack, VStack, Image } from '@gluestack-ui/themed';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  withTiming,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useUserProfile, useUserPosts, useUserReviews, useUserBenchmarks, useUserTipsAndTricks, useUserReplies, useAddToTrustList, useRemoveFromTrustList, useReportUser } from '../api/hooks';
import { useSendGift, useCreateSupportRequest, useSendDirectMessage } from '@/src/features/inbox/api/hooks';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { Share } from 'react-native';
import { useAppStore } from '@/src/store/appStore';
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
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FeedSkeleton } from '@/src/components/Skeletons';

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
}

// TabsBar Component
interface TabsBarProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  isDark: boolean;
  progress: ReturnType<typeof useSharedValue<number>>;
  tabContainerRef: React.RefObject<any>;
  onTabContainerLayout: (width: number) => void;
  tabsScrollOffset: number; // Content scroll'dan gelen offset
}

const TabsBar: React.FC<TabsBarProps> = ({ activeTab, onChangeTab, isDark, progress, tabContainerRef, onTabContainerLayout, tabsScrollOffset }) => {
  const activeColor = isDark ? '#FFFFFF' : '#000000';
  const inactiveColor = '#A3A3A3';
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Tab genişliği: ekran genişliği / 4 (başlangıçta görünen tab sayısı)
  const tabWidth = SCREEN_WIDTH / 4;
  
  // Tabs scroll offset değiştiğinde ScrollView'i güncelle
  useEffect(() => {
    if (scrollViewRef.current && tabsScrollOffset > 0) {
      scrollViewRef.current.scrollTo({
        x: tabsScrollOffset,
        animated: true,
      });
    } else if (scrollViewRef.current && tabsScrollOffset === 0) {
      scrollViewRef.current.scrollTo({
        x: 0,
        animated: true,
      });
    }
  }, [tabsScrollOffset]);
  
  // Progress'e göre scroll enabled kontrolü
  const [isScrollEnabledState, setIsScrollEnabledState] = useState(false);
  
  useAnimatedReaction(
    () => progress.value,
    (value) => {
      'worklet';
      const enabled = value >= 3;
      runOnJS(setIsScrollEnabledState)(enabled);
    },
    []
  );
  
  // Her tab için animasyonlu stil - NotificationsScreen'deki gibi
  const tab0Style = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [-0.5, 0, 0.5],
      [activeColor, activeColor, inactiveColor]
    );
    return { color };
  }, [isDark]);
  
  const tab1Style = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0.5, 1, 1.5],
      [inactiveColor, activeColor, inactiveColor]
    );
    return { color };
  }, [isDark]);
  
  const tab2Style = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [1.5, 2, 2.5],
      [inactiveColor, activeColor, inactiveColor]
    );
    return { color };
  }, [isDark]);
  
  const tab3Style = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [2.5, 3, 3.5],
      [inactiveColor, activeColor, inactiveColor]
    );
    return { color };
  }, [isDark]);
  
  const tab4Style = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [3.5, 4, 4.5],
      [inactiveColor, activeColor, inactiveColor]
    );
    return { color };
  }, [isDark]);
  
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


  // Indicator position animation
  const indicatorWidth = tabWidth * 0.8;
  
  const indicatorStyle = useAnimatedStyle(() => {
    const baseTranslateX = progress.value * tabWidth + (tabWidth - indicatorWidth) / 2;
    const translateX = baseTranslateX + tabsScrollOffset;
    return {
      transform: [{ translateX }],
    };
  }, [tabWidth, indicatorWidth, tabsScrollOffset]);

  return (
    <Box
      mb={16}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      borderBottomWidth={StyleSheet.hairlineWidth}
      borderBottomColor={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
      position="relative"
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        scrollEventThrottle={16}
        scrollEnabled={isScrollEnabledState}
      >
        <HStack
          ref={tabContainerRef}
          space="xs"
          py={12}
          position="relative"
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            onTabContainerLayout(width);
          }}
          style={{ position: 'relative' }}
        >
          {TABS.map((tab, index) => {
            const tabStyle = getTabStyle(index);
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => onChangeTab(tab.key)}
                alignItems="center"
                justifyContent="center"
                pb="$1"
                position="relative"
                width={tabWidth}
                style={{ minWidth: tabWidth }}
              >
                <Animated.Text
                  style={[
                    {
                      textAlign: 'center',
                      fontSize: 12,
                      fontWeight: isActive ? 'bold' : 'normal',
                    },
                    tabStyle,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {tab.title}
                </Animated.Text>
              </Pressable>
            );
          })}
        </HStack>
      </ScrollView>
      
      {/* Animated Indicator */}
      {tabWidth > 0 && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 0,
              left: 16,
              width: indicatorWidth,
              height: 2,
              backgroundColor: isDark ? '#FFFFFF' : '#000000',
            },
            indicatorStyle,
          ]}
        />
      )}
    </Box>
  );
};

// Tab Page Component - Her tab için ayrı bir sayfa
const TabPage: React.FC<TabPageProps> = ({ tabKey, targetUserId, isDark, bottomPadding }) => {

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
      >
        <LadderTab />
      </ScrollView>
    );
  }
  
  // ScrollView için scroll handler - load more için
  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && activeTabQuery.hasNextPage && !activeTabQuery.isFetchingNextPage) {
      handleLoadMore();
    }
  }, [activeTabQuery, handleLoadMore]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      onScroll={handleScroll}
      scrollEventThrottle={400}
      nestedScrollEnabled={true}
    >
      {activeTabQuery.isLoading && !((activeTabQuery.data as any)?.pages?.[0]) ? (
        <FeedSkeleton count={3} />
      ) : mappedPosts.length === 0 ? (
        <Box py={20} alignItems="center">
          <Text color={isDark ? '$textLight400' : '$textDark400'} fontSize="$sm">
            No content found yet.
          </Text>
        </Box>
      ) : (
        <>
          {mappedPosts.map((item) => (
            <Box key={item.id} px={16}>
              {renderPostCard(item)}
            </Box>
          ))}
          {activeTabQuery.isFetchingNextPage && (
            <Box py={20} alignItems="center">
              <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
          )}
        </>
      )}
    </ScrollView>
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
  const insets = useSafeAreaInsets();
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  
  // Bottom padding for FlatList content
  const bottomPadding = useBottomOffset({ includeTabBar: false, extraPadding: 16 });
  
  // Route params'tan userId al, yoksa store'daki user.id'yi kullan
  const routeUserId = route.params?.userId;
  const targetUserId = routeUserId || user?.id;
  
  // Profile API hook
  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useUserProfile(targetUserId);
  
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
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<TabKey>('feed');
  const contentFlatListRef = useRef<FlatList>(null);
  const tabContainerRef = useRef<any>(null);
  
  // 🎯 CORE: Shared progress value for tab animations
  const progress = useSharedValue(0);
  
  // Tab genişliği: ekran genişliği / 4
  const tabWidth = SCREEN_WIDTH / 4;
  
  // Tab index'i bul
  const getTabIndex = useCallback((tabKey: TabKey) => {
    return TABS.findIndex(tab => tab.key === tabKey);
  }, []);
  
  // Tab değiştiğinde Content FlatList'i scroll et
  const handleTabChange = useCallback((tabKey: TabKey) => {
    const index = getTabIndex(tabKey);
    if (index !== -1 && contentFlatListRef.current) {
      contentFlatListRef.current.scrollToOffset({
        offset: index * SCREEN_WIDTH,
        animated: true,
      });
      setActiveTab(tabKey);
    }
  }, [getTabIndex]);
  
  // Tabs scroll offset state - Content scroll'a göre güncellenecek
  const [tabsScrollOffset, setTabsScrollOffset] = useState(0);
  
  // Content FlatList scroll handler - realtime progress güncelleme
  const handleContentScroll = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const currentIndex = offsetX / SCREEN_WIDTH;
      progress.value = currentIndex;
      
      // Tab 3'e gelindiğinde tabs'ı 1 tab width sola kaydır
      if (currentIndex >= 3) {
        // Tab 3+: 1 tab width sola kay
        setTabsScrollOffset(1 * tabWidth);
      } else {
        // Tab 0-2: Başa dön
        setTabsScrollOffset(0);
      }
    },
    [progress, tabWidth]
  );

  // Content FlatList scroll end handler - snap sonrası sync
  const handleContentScrollEnd = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SCREEN_WIDTH);
      progress.value = withTiming(index, { duration: 0 });
      setActiveTab(TABS[index].key);
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
      closeBottomSheet();
    } catch (error) {
      console.error('[ProfileScreen] Share error:', error);
    }
  }, [userProfile, targetUserId, closeBottomSheet]);

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
            closeBottomSheet();
          },
        },
      ]
    );
  }, [user?.id, targetUserId, reportUser, closeBottomSheet]);

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
            closeBottomSheet();
            // Navigate back after blocking
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  }, [targetUserId, navigation, closeBottomSheet]);

  // BUG FIX: handleOpenActionSheet tanımlanmalı - ActionSheet bottom sheet aç
  const handleOpenActionSheet = useCallback(() => {
    if (isOwnProfile || !userProfile) return;

    const actionSheetContent = (
      <VStack bg={isDark ? '$backgroundDark900' : '$white'} pb={20}>
        {/* Share */}
        <Pressable
          onPress={() => {
            handleShare();
            closeBottomSheet();
          }}
          px={20}
          py={16}
        >
          <HStack alignItems="center" space="md">
            <ArrowUpTrayIcon size={20} color={isDark ? '#FFFFFF' : '#000000'} />
            <Text
              color={isDark ? '$textLight0' : '$textDark950'}
              fontSize="$md"
              fontWeight="$medium"
            >
              Paylaş
            </Text>
          </HStack>
        </Pressable>

        {/* Report */}
        <Pressable
          onPress={() => {
            closeBottomSheet();
            handleReport();
          }}
          px={20}
          py={16}
        >
          <HStack alignItems="center" space="md">
            <FlagIcon size={20} color={isDark ? '#FFFFFF' : '#000000'} />
            <Text
              color={isDark ? '$textLight0' : '$textDark950'}
              fontSize="$md"
              fontWeight="$medium"
            >
              Raporla
            </Text>
          </HStack>
        </Pressable>

        {/* Block */}
        <Pressable
          onPress={() => {
            closeBottomSheet();
            handleBlock();
          }}
          px={20}
          py={16}
        >
          <HStack alignItems="center" space="md">
            <NoSymbolIcon size={20} color="#FF3040" />
            <Text
              color="#FF3040"
              fontSize="$md"
              fontWeight="$medium"
            >
              Engelle
            </Text>
          </HStack>
        </Pressable>
      </VStack>
    );

    openBottomSheet(actionSheetContent, {
      enablePanDownToClose: true,
      enableDynamicSizing: true,
      paddingBottom: insets.bottom + 8,
    });
  }, [isOwnProfile, userProfile, isDark, handleShare, handleReport, handleBlock, openBottomSheet, closeBottomSheet, insets.bottom]);
  
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
          
          {/* Banner Controls */}
          <Box
            position="absolute"
            top={36}
            left={0}
            right={0}
            flexDirection="row"
            justifyContent="space-between"
            alignItems="flex-start"
            px={16}
            pointerEvents="box-none"
            zIndex={2000}
          >
            <Pressable
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  rootNavigation.navigate('Main' as never);
                }
              }}
              style={{ zIndex: 2000 }}
            >
              <ChevronLeftIcon size={24} color="#fff" />
            </Pressable>

            <Pressable
              onPress={() => {
                if (isOwnProfile) {
                  rootNavigation.navigate('Settings' as never);
                } else {
                  handleOpenActionSheet();
                }
              }}
              style={{ zIndex: 2000 }}
            >
              <EllipsisVerticalIcon size={24} color="#fff" />
            </Pressable>
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
                    w={30}
                    h={30}
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    justifyContent="center"
                    alignItems="center"
                    onPress={handleSendTIPS}
                  >
                    <GiftIcon size={14} color="#000" />
                  </Pressable>
                  
                  <Pressable
                    w={30}
                    h={30}
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    justifyContent="center"
                    alignItems="center"
                    onPress={handle1on1Request}
                  >
                    <PhoneIcon size={14} color="#000" />
                  </Pressable>
                  
                  <Pressable
                    w={30}
                    h={30}
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    justifyContent="center"
                    alignItems="center"
                    onPress={handleDM}
                  >
                    <ChatBubbleLeftIcon size={14} color="#000" />
                  </Pressable>
                  
                  <Pressable
                    w={30}
                    h={30}
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
                    <BellIcon size={14} color="#000" />
                  </Pressable>
                  
                  <Pressable
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    px={12}
                    py={8}
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
                      <UserMinusIcon size={14} color="#000" />
                    ) : (
                      <UserPlusIcon size={14} color="#000" />
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
            fontSize={14}
            fontWeight="$bold"
          >
            {profile.name}
          </Text>

          {profile.biography && (
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize={10}
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
              fontSize={10}
              fontWeight="$bold"
            >
              {profile.stats.posts}
            </Text>
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize={10}
            >
              Posts
            </Text>
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize={10}
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
                  fontSize={10}
                  fontWeight="$bold"
                >
                  {profile.stats.trust}
                </Text>
                <Text
                  color={isDark ? '$textDark400' : '$textLight600'}
                  fontSize={10}
                >
                  Trust
                </Text>
              </HStack>
            </Pressable>
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize={10}
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
                  fontSize={10}
                  fontWeight="$bold"
                >
                  {profile.stats.truster > 999 ? `${Math.floor(profile.stats.truster / 1000)}K` : profile.stats.truster}
                </Text>
                <Text
                  color={isDark ? '$textDark400' : '$textLight600'}
                  fontSize={10}
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
                fontSize={10}
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
              <HStack space="md" justifyContent="space-between">
                {[0, 1, 2, 3].map((index) => (
                  <VStack key={index} space="xs" alignItems="center" flex={1}>
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
                <HStack space="md" justifyContent="space-between">
                  {profile.badges.slice(0, 4).map((badge) => (
                    <VStack key={badge.id} space="xs" alignItems="center">
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
                        fontSize={8}
                        fontWeight="$bold"
                        textAlign="center"
                      >
                        {badge.title}
                      </Text>
                    </VStack>
                  ))}
                </HStack>
                <Pressable
                  onPress={() => {
                    navigation.navigate('Collections');
                  }}
                >
                  <Text
                    color={isDark ? '$textDark400' : '$textLight600'}
                    fontSize={10}
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
  }, [userProfile, isDark, isOwnProfile, targetUserId, trustUser, untrustUser, isTrusting, isUntrusting, rootNavigation, user, navigation, handleShare, handleOpenActionSheet]);
  
  // Profile header'ı memoize et - CRITICAL: Early return'lerden ÖNCE çağrılmalı (Rules of Hooks)
  // userProfile undefined olsa bile hook çağrılmalı (Rules of Hooks)
  const profileHeader = useMemo(() => {
    return renderProfileHeader(activeTab, handleTabChange, isProfileLoading);
  }, [renderProfileHeader, activeTab, handleTabChange, isProfileLoading]);
  
  if (isProfileLoading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        </Box>
      </SafeAreaView>
    );
  }
  
  if (profileError || !userProfile) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} justifyContent="center" alignItems="center" px={20}>
          <Text color="#CE4A4A" fontSize="$sm">
            {profileError?.message || 'Profil yüklenirken bir hata oluştu'}
          </Text>
        </Box>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Sabit Üst Kısım: Banner + Profile Info + Tabs Bar */}
        {profileHeader}
        <TabsBar 
          activeTab={activeTab} 
          onChangeTab={handleTabChange} 
          isDark={isDark}
          progress={progress}
          tabContainerRef={tabContainerRef}
          onTabContainerLayout={handleTabContainerLayout}
          tabsScrollOffset={tabsScrollOffset}
        />
        
        {/* Scrollable İçerik: Tab Sayfaları */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
          nestedScrollEnabled={true}
          scrollEventThrottle={16}
        >
          {/* Yatay Kaydırılabilir İçerik: FlatList ile */}
          <Box style={{ minHeight: Dimensions.get('window').height * 0.5 }}>
            <FlatList
              ref={contentFlatListRef}
              data={TABS}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={handleContentScroll}
              onMomentumScrollEnd={handleContentScrollEnd}
              keyExtractor={(item) => item.key}
              getItemLayout={(data, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              renderItem={({ item }) => (
                <Box width={SCREEN_WIDTH} flex={1}>
                  <TabPage
                    tabKey={item.key}
                    targetUserId={targetUserId || ''}
                    isDark={isDark}
                    bottomPadding={0}
                  />
                </Box>
              )}
              removeClippedSubviews={false}
              windowSize={5}
              maxToRenderPerBatch={2}
              initialNumToRender={2}
            />
          </Box>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

export default ProfileScreen;
