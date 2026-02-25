import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { VStack, Text, Box, Pressable, HStack, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { BrandStackParamList } from '../BrandNavigator';
import { Header } from '@/src/components/Header';
import { ExperiencePostCard } from '@/src/components/PostCards/ExperiencePostCard';
import NewsCard from '../components/NewsCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import PostCard from '@/src/components/PostCards/PostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import { useSafeAreaValues, toImageSource, useBottomOffset, formatRelativeTime, isSameImageSource } from '@/src/utils';
import { navigationService } from '@/src/services/NavigationService';
import { 
  useBrandProductDetail, 
  useBrandProductFeed, 
  useBrandProductReviews, 
  useBrandProductBenchmarks, 
  useBrandProductTips, 
  useBrandProductQuestions, 
  useBrandProductNews
} from '../api/hooks';
import type { BrandFeedPost } from '../types';
import type { ExperiencePostCardData, ExperiencePostCardContentItem } from '@/src/types/ExperienceCard';
import type { BenchmarkCardData } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { PostCardData } from '@/src/types/PostCard';
import type { FeedApiItem } from '@/src/features/feed/api/feedApi';
import type { ProfilePost } from '@/src/features/profile/types';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import { CardType } from '@/src/types/common';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  withTiming,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

const TABS = [
  { key: 'feed', title: 'Feed' },
  { key: 'reviews', title: 'Reviews' },
  { key: 'benchmarks', title: 'Benchmarks' },
  { key: 'tips', title: 'Tips & Tricks' },
  { key: 'questions', title: 'Questions' },
  { key: 'news', title: 'News' },
] as const;

type TabKey = typeof TABS[number]['key'];

type BrandProductDetailScreenNavigationProp = NativeStackNavigationProp<BrandStackParamList, 'BrandProductDetailScreen'>;
type BrandProductDetailScreenRouteProp = RouteProp<BrandStackParamList, 'BrandProductDetailScreen'>;

// Mapping functions
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

const mapExperienceToCardData = (item: BrandFeedPost): ExperiencePostCardData | null => {
  if (item.type !== 'experience') {
    return null;
  }
  
  const postData = item.data as import('@/src/types/ExperienceCard').ExperiencePostApiItem;

  if (!postData || !postData.user) return null;
  const rawProduct = (postData as any).contextData?.product ?? postData.contextData ?? (postData as any).product;
  if (!rawProduct) return null;

  const avatarSource = toImageSource(postData.user.avatar)!;
  const productImage = rawProduct?.image ? toImageSource(rawProduct.image) : undefined;
  const defaultPostImage = require('@/assets/defaultImages/default-post.png');

  const contentBlocks = postData.experienceContent ?? (Array.isArray(postData.content) ? postData.content : []);
  const content: ExperiencePostCardContentItem[] = Array.isArray(contentBlocks)
    ? contentBlocks
        .filter((contentItem) => contentItem != null)
        .map((contentItem) => {
          const ratingVal = contentItem?.rating ?? 0;
          const stars = ratingVal <= 5 ? Math.min(5, Math.max(0, Math.round(ratingVal))) : Math.floor(ratingVal / 20);
          return {
            tag: {
              icon: (contentItem?.title?.toLowerCase?.().includes('product') || contentItem?.title?.toLowerCase?.().includes('usage')) ? 'package' as const : 'tag' as const,
              title: contentItem?.title || '',
            },
            text: contentItem?.content || '',
            rating: Array(5).fill(false).map((_, index) => index < stars),
          };
        })
    : [];

  const subNameRaw = rawProduct?.subName ?? '';
  const subName = subNameRaw && !/^Status:\s*(tested|own)$/i.test(String(subNameRaw)) ? subNameRaw : '';
  const tags = Array.isArray(postData.tags) ? postData.tags : [];

  return {
    id: postData.id,
    user: {
      id: postData.user.id,
      name: postData.user.name,
      title: postData.user.title,
      avatar: avatarSource,
      action: (postData.status === 'own' || rawProduct?.isOwned) ? 'Added new product and experiences to inventory!' : undefined,
    },
    contextData: {
      id: rawProduct?.id || '',
      name: rawProduct?.name || '',
      subName,
      image: productImage ?? defaultPostImage,
      isOwned: postData.status === 'own' || rawProduct?.isOwned,
    },
    content,
    tags,
    images: (() => {
      const mapped = postData.images
        ?.map((img: string) => toImageSource(img))
        .filter((imgSource: any): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
      return mapped.filter((img: any) => !isSameImageSource(img, productImage ?? defaultPostImage));
    })(),
    stats: postData.stats,
    createdAt: postData.createdAt,
  };
};

const mapBenchmarkToCardData = (item: BrandFeedPost): BenchmarkCardData | null => {
  if (item.type !== 'benchmark') {
    return null;
  }
  
  const postData = item.data as BenchmarkApiItem;
  const avatarSource = toImageSource(postData.user.avatar)!;

  const products: import('@/src/types/BenchmarkCard').BenchmarkProduct[] = (postData.products || []).map((p) => ({
    id: p.id,
    name: p.name,
    subName: p.subName,
    image: toImageSource(p.image)!,
    isOwned: p.isOwned,
    choice: p.choice,
  }));

  return {
    id: postData.id,
    user: {
      id: postData.user.id,
      name: postData.user.name,
      title: postData.user.title,
      avatar: avatarSource,
    },
    products,
    content: postData.content || '',
    stats: postData.stats,
    createdAt: postData.createdAt,
  };
};

const mapTipsToCardData = (item: FeedApiItem | BrandFeedPost): TipsCardData | null => {
  // FeedApiItem veya BrandFeedPost formatı kontrolü
  if (!('type' in item) || item.type !== 'tipsAndTricks') {
    return null;
  }
  
  const postData = 'data' in item ? (item.data as TipsApiItem) : ((item as any).data as TipsApiItem);
  
  // Data validation - contextData veya product kontrolü
  if (!postData) {
    return null;
  }
  
  // Backend'den contextData veya product gelebilir
  const contextData = postData.contextData || (postData as any).product;
  if (!contextData || !contextData.id) {
    if (__DEV__) {
      console.log('[mapTipsToCardData] Missing contextData or product:', postData);
    }
    return null;
  }
  
  const avatarSource = toImageSource(postData?.user?.avatar) || require('@/assets/avatar/default-useravatar.png');
  const contextImage = toImageSource(contextData?.image) || require('@/assets/inventory/product_01.png');
  
  const product: TipsProduct = {
    id: contextData.id,
    name: contextData.name || '',
    subName: contextData.subName || '',
    image: contextImage,
  };
  const category: TipsCategory = {
    id: contextData.id,
    name: contextData.name || '',
    subCategory: contextData.subName || '',
    image: contextImage,
    product,
  };

  const defaultPostImage = require('@/assets/defaultImages/default-post.png');
  const mappedImages = postData.images
    ?.map((img: string) => toImageSource(img))
    .filter((imgSource: any): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
  const images = mappedImages.length > 0 ? mappedImages : [defaultPostImage];

  return {
    id: postData.id,
    user: {
      id: postData.user.id,
      name: postData.user.name,
      title: postData.user.title,
      avatar: avatarSource,
    },
    category,
    content: typeof postData.content === 'string' ? postData.content : (postData.content || ''),
    images,
    stats: postData.stats,
    tag: postData.tag || '',
    createdAt: postData.createdAt,
  };
};

const mapQuestionToCardData = (item: FeedApiItem | BrandFeedPost): QuestionCardData | null => {
  // FeedApiItem veya BrandFeedPost formatı kontrolü
  if (!('type' in item) || item.type !== 'question') {
    return null;
  }
  
  const postData = 'data' in item ? (item.data as QuestionApiItem) : ((item as any).data as QuestionApiItem);
  
  // Data validation
  if (!postData) {
    if (__DEV__) {
      console.log('[mapQuestionToCardData] Missing postData');
    }
    return null;
  }
  
  if (!postData.contextData || !postData.contextData.id) {
    if (__DEV__) {
      console.log('[mapQuestionToCardData] Missing contextData:', postData);
    }
    return null;
  }
  
  if (!postData.user || !postData.user.id) {
    if (__DEV__) {
      console.log('[mapQuestionToCardData] Missing user:', postData);
    }
    return null;
  }
  
  const avatarSource = toImageSource(postData?.user?.avatar) || require('@/assets/avatar/default-useravatar.png');
  const contextImage = toImageSource(postData.contextData?.image) || require('@/assets/inventory/product_01.png');
  
  const product: QuestionCardProduct = {
    id: postData.contextData.id,
    name: postData.contextData.name || '',
    subName: postData.contextData.subName || '',
    image: contextImage,
  };
  const category: QuestionCardCategory = {
    id: postData.contextData.id,
    name: postData.contextData.name || '',
    subCategory: postData.contextData.subName || '',
    image: contextImage,
    product,
  };

  const defaultPostImage = require('@/assets/defaultImages/default-post.png');
  const mappedImages = postData.images
    ?.map((img: string) => toImageSource(img))
    .filter((imgSource: any): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
  const images = mappedImages.length > 0 ? mappedImages : [defaultPostImage];

  return {
    id: postData.id,
    user: {
      id: postData.user.id,
      name: postData.user.name || '',
      title: postData.user.title || '',
      avatar: avatarSource,
    },
    category,
    content: typeof postData.content === 'string' ? postData.content : (postData.content || ''),
    isBoosted: postData.isBoosted || false,
    images,
    stats: postData.stats || { likes: 0, comments: 0, shares: 0, bookmarks: 0 },
    createdAt: postData.createdAt,
  };
};

type MappedPost = 
  | { type: 'post'; id: string; data: PostCardData }
  | { type: 'experience'; id: string; data: ExperiencePostCardData }
  | { type: 'benchmark'; id: string; data: BenchmarkCardData }
  | { type: 'tips'; id: string; data: TipsCardData }
  | { type: 'question'; id: string; data: QuestionCardData };

interface TabPageProps {
  tabKey: TabKey;
  brandId: string;
  productId: string;
  isDark: boolean;
  bottomPadding: number;
}

interface TabsBarProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  isDark: boolean;
  progress: ReturnType<typeof useSharedValue<number>>;
  tabContainerRef: React.RefObject<any>;
  onTabContainerLayout: (width: number) => void;
}

const TabsBar: React.FC<TabsBarProps> = React.memo(({ activeTab, onChangeTab, isDark, progress, tabContainerRef, onTabContainerLayout }) => {
  const activeColor = isDark ? '#FFFFFF' : '#000000';
  const inactiveColor = '#A3A3A3';
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const [tabWidths, setTabWidths] = useState<number[]>([]);
  const [tabPositions, setTabPositions] = useState<number[]>([]);
  const tabRefs = useRef<{ [key: string]: any }>({});
  const scrollViewOffset = useSharedValue(0);
  
  const handleScrollViewScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollViewOffset.value = event.contentOffset.x;
    },
  });
  
  const getTabWidth = useCallback((index: number) => {
    if (tabWidths[index]) {
      return tabWidths[index];
    }
    return 80;
  }, [tabWidths]);
  
  const activeTabIndex = TABS.findIndex(tab => tab.key === activeTab);
  const activeTabWidth = activeTabIndex >= 0 ? getTabWidth(activeTabIndex) : 80;
  
  const tabStyles = TABS.map((_, index) => {
    return useAnimatedStyle(() => {
      const color = interpolateColor(
        progress.value,
        [index - 0.5, index, index + 0.5],
        [inactiveColor, activeColor, inactiveColor]
      );
      return { color };
    }, [isDark]);
  });

  const getTabStyle = (index: number) => {
    return tabStyles[index] || tabStyles[0];
  };

  const tabWidthsShared = useSharedValue<number[]>([]);
  const tabPositionsShared = useSharedValue<number[]>([]);
  
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
  
  const indicatorStyle = useAnimatedStyle(() => {
    'worklet';
    const currentIndex = Math.floor(progress.value);
    const nextIndex = Math.min(Math.ceil(progress.value), TABS.length - 1);
    const offset = progress.value - currentIndex;
    
    const widths = tabWidthsShared.value;
    const positions = tabPositionsShared.value;
    
    if (widths.length === 0 || positions.length === 0) {
      return { transform: [{ translateX: 0 }], width: 0 };
    }
    
    const currentWidth = widths[currentIndex] || 80;
    const nextWidth = widths[nextIndex] || currentWidth;
    const currentPosition = positions[currentIndex] || 0;
    const nextPosition = positions[nextIndex] || currentPosition;
    
    const baseTranslateX = currentPosition + (nextPosition - currentPosition) * offset;
    const baseWidth = currentWidth + (nextWidth - currentWidth) * offset;
    const indicatorWidthAnimated = baseWidth * 0.8;
    
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
}, (prevProps, nextProps) => {
  return prevProps.activeTab === nextProps.activeTab && 
         prevProps.isDark === nextProps.isDark;
});

const TabPage: React.FC<TabPageProps> = React.memo(({ tabKey, brandId, productId, isDark, bottomPadding }) => {
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation();

  // API hooks for each tab - Lazy loading: Sadece aktif tab'ın query'si enabled
  // İlk açılışta sadece Feed yüklenecek, diğer tab'lara geçildiğinde o tab'ın verisi çekilecek
  const feedQuery = useBrandProductFeed(brandId, productId, 20, tabKey === 'feed');
  const reviewsQuery = useBrandProductReviews(brandId, productId, 20, tabKey === 'reviews');
  const benchmarksQuery = useBrandProductBenchmarks(brandId, productId, 20, tabKey === 'benchmarks');
  const tipsQuery = useBrandProductTips(brandId, productId, 20, tabKey === 'tips');
  const questionsQuery = useBrandProductQuestions(brandId, productId, 20, tabKey === 'questions');
  const newsQuery = useBrandProductNews(brandId, productId, 20, tabKey === 'news');
  
  const activeTabQuery = useMemo(() => {
    switch (tabKey) {
      case 'feed': return feedQuery;
      case 'reviews': return reviewsQuery;
      case 'benchmarks': return benchmarksQuery;
      case 'tips': return tipsQuery;
      case 'questions': return questionsQuery;
      case 'news': return newsQuery;
      default: return feedQuery;
    }
  }, [tabKey, feedQuery, reviewsQuery, benchmarksQuery, tipsQuery, questionsQuery, newsQuery]);
  
  // Mapping cache - aynı item'ları tekrar map etmemek için
  const mappingCacheRef = useRef<Map<string, MappedPost | { type: 'news'; id: string; data: any }>>(new Map());
  
  const mappedPosts = useMemo(() => {
    if (tabKey === 'news') {
      const queryData = newsQuery.data as any;
      
      if (!queryData?.pages) {
        return [];
      }
      
      const allNews = queryData.pages.flatMap((page: any) => page?.items ?? []) ?? [];
      
      const mappedNews = allNews.map((item: any) => {
        // Cache check
        const cached = mappingCacheRef.current.get(item.id);
        if (cached && cached.type === 'news') {
          return cached;
        }
        
        const mapped = {
        type: 'news' as const,
        id: item.id,
        data: item,
        };
        
        mappingCacheRef.current.set(item.id, mapped);
        return mapped;
      });
      
      return mappedNews;
    }
    
    const queryData = activeTabQuery.data as any;
    if (!queryData?.pages) {
      return [];
    }
    
    // Tüm tab'lar için BrandFeedPost formatı geliyor (/brands/{brandId}/products/{productId}/... endpoint'lerinden)
    // Backend'den items array'i olarak geliyor
    const allItems = queryData.pages.flatMap((page: any) => page?.items ?? page?.posts ?? []) ?? [];
    
    const validItems = allItems.filter((item: any) => item?.id || item?.data?.id);
    const uniqueItems = validItems.filter((item: any, index: number, self: any[]) => {
      const id = item?.id || item?.data?.id;
      return index === self.findIndex((t: any) => (t?.id || t?.data?.id) === id);
    });
    
    const mapped: MappedPost[] = [];
    
    for (const item of uniqueItems) {
      const itemId = item?.id || item?.data?.id;
      
      // Cache check
      const cached = mappingCacheRef.current.get(itemId);
      if (cached && cached.type !== 'news') {
        mapped.push(cached as MappedPost);
        continue;
      }
      
      let mappedItem: MappedPost | null = null;
      
      // BrandFeedPost formatı (tüm tab'lar için)
      if ('type' in item && 'data' in item) {
        const brandPost = item as BrandFeedPost;
        
        switch (brandPost.type) {
          case 'experience':
            const experienceData = mapExperienceToCardData(brandPost);
            if (experienceData) {
              mappedItem = { type: 'experience', id: experienceData.id, data: experienceData };
            }
            break;
          case 'benchmark':
            const benchmarkData = mapBenchmarkToCardData(brandPost);
            if (benchmarkData) {
              mappedItem = { type: 'benchmark', id: benchmarkData.id, data: benchmarkData };
            }
            break;
          case 'tipsAndTricks':
            const tipsData = mapTipsToCardData(brandPost);
            if (tipsData) {
              mappedItem = { type: 'tips', id: tipsData.id, data: tipsData };
            }
            break;
          case 'question':
            const questionData = mapQuestionToCardData(brandPost);
            if (questionData) {
              mappedItem = { type: 'question', id: questionData.id, data: questionData };
            }
            break;
          case 'post':
            // Free post için
            const postData = mapPostToCardData(brandPost.data as ProfilePost);
            if (postData) {
              mappedItem = { type: 'post', id: postData.id, data: postData };
            }
            break;
        }
      }
      
      if (mappedItem) {
        mappingCacheRef.current.set(itemId, mappedItem);
        mapped.push(mappedItem);
      }
    }
    
    return mapped;
  }, [activeTabQuery.data, tabKey, newsQuery.data]);
  
  // Pull to refresh - Sadece aktif tab'ı yeniden yükle
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await activeTabQuery.refetch();
    } catch (error) {
      if (__DEV__) {
        console.error('[BrandProductDetailScreen] Refresh error:', error);
    }
    } finally {
      setRefreshing(false);
    }
  }, [activeTabQuery]);
  
  const ListFooterComponent = useMemo(() => {
    if (!activeTabQuery.isFetchingNextPage) return null;
    return (
      <Box py={20} alignItems="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }, [activeTabQuery.isFetchingNextPage, isDark]);
  
  const ListEmptyComponent = useMemo(() => {
    if (activeTabQuery.isLoading && !((activeTabQuery.data as any)?.pages?.[0])) {
      return (
        <Box py={20} alignItems="center">
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        </Box>
      );
    }
    return (
      <Box py={20} alignItems="center">
        <Text color={isDark ? '$textLight400' : '$textDark400'} fontSize="$sm">
          {tabKey === 'news' ? 'No news found yet.' : 'No content found yet.'}
        </Text>
      </Box>
    );
  }, [activeTabQuery.isLoading, activeTabQuery.data, tabKey, isDark]);
  
  const renderPostCard = useCallback((postData: MappedPost | { type: 'news'; id: string; data: any }) => {
    if (postData.type === 'news') {
      // Date formatını relative time'a çevir (örn: "2h", "3d")
      const formattedDate = postData.data?.date ? formatRelativeTime(postData.data.date) : '';
      
      // Image fallback - boş string veya null ise default image kullan
      const newsImage = postData.data?.image && postData.data.image.trim() !== ''
        ? toImageSource(postData.data.image)
        : require('@/assets/defaultImages/default-post.png');
      
      return (
        <NewsCard
          key={postData.id}
          id={postData.data?.id || postData.id}
          title={postData.data?.title || ''}
          description={postData.data?.description || ''}
          source={postData.data?.source || 'Unknown'}
          date={formattedDate}
          image={newsImage}
          onPress={() => {
            // RootNavigator'dan NewsDetailScreen'e navigate et (full screen için)
            navigationService.navigate('News', { 
              screen: 'NewsDetailScreen', 
              params: { 
                newsId: postData.data?.id || postData.id,
                brandId: brandId,
                productId: productId,
              } 
            });
          }}
        />
      );
    }
    
    switch (postData.type) {
      case 'experience':
        return <ExperiencePostCard key={postData.id} data={postData.data} />;
      case 'benchmark':
        return <BenchmarkPostCard key={postData.id} data={postData.data} />;
      case 'tips':
        return <TipsAndTricksPostCard key={postData.id} data={postData.data} />;
      case 'question':
        return <QuestionPostCard key={postData.id} data={postData.data} />;
      case 'post':
      default:
        return <PostCard key={postData.id} data={postData.data} />;
    }
  }, [brandId, productId]);
  
  const renderItem = useCallback(({ item }: { item: MappedPost | { type: 'news'; id: string; data: any } }) => {
    return (
          <Box px={16}>
            {renderPostCard(item)}
          </Box>
    );
  }, [renderPostCard]);
  
  const keyExtractor = useCallback((item: MappedPost | { type: 'news'; id: string; data: any }) => {
    return item.id;
  }, []);
  
  const contentContainerStyle = useMemo(() => ({
    paddingBottom: bottomPadding,
  }), [bottomPadding]);
  
  const isLoadingMoreRef = useRef(false);
  const handleLoadMore = useCallback(() => {
    if (isLoadingMoreRef.current || !activeTabQuery.hasNextPage || activeTabQuery.isFetchingNextPage) {
      return;
    }
    isLoadingMoreRef.current = true;
    activeTabQuery.fetchNextPage().finally(() => {
      setTimeout(() => {
        isLoadingMoreRef.current = false;
      }, 500);
    });
  }, [activeTabQuery]);
  
  // Tek bir FlatList - tüm tab'lar için (news dahil)
  // renderPostCard zaten tüm tipleri handle ediyor (news, experience, benchmark, tips, question, post)
  return (
    <FlatList
      ref={flatListRef}
      data={mappedPosts}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={isDark ? '#FFFFFF' : '#000000'}
          colors={['#000000']}
        />
      }
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={true}
      // PERFORMANCE OPTIMIZATIONS
      removeClippedSubviews={true}
      initialNumToRender={3}
      maxToRenderPerBatch={3}
      windowSize={5}
      updateCellsBatchingPeriod={50}
      getItemLayout={undefined} // Dynamic height için undefined
    />
  );
}, (prevProps, nextProps) => {
  // Sadece tabKey değiştiğinde veya brandId/productId değiştiğinde re-render
  return prevProps.tabKey === nextProps.tabKey &&
         prevProps.brandId === nextProps.brandId &&
         prevProps.productId === nextProps.productId &&
         prevProps.isDark === nextProps.isDark &&
         prevProps.bottomPadding === nextProps.bottomPadding;
});

const BrandProductDetailScreen: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<BrandProductDetailScreenNavigationProp>();
    const route = useRoute<BrandProductDetailScreenRouteProp>();
    const bottomPadding = useBottomOffset({ includeTabBar: false, extraPadding: 16 });

  const { brandId, productId, productName: initialProductName, productImage: initialProductImage } = route.params;

  // API hooks - Brand product detail
  const { data: productDetail, isLoading: isLoadingProduct } = useBrandProductDetail(brandId, productId);
    
    // Seçilen product bilgisi (navigation'dan gelen veya API'den gelen)
    const displayProductName = productDetail?.name || initialProductName || '';
    const displayProductImage = productDetail?.image 
        ? toImageSource(productDetail.image) 
        : (initialProductImage || require('@/assets/events/card-icon.png'));

    // Active tab state
    const [activeTab, setActiveTab] = useState<TabKey>('feed');
    const pagerRef = useRef<PagerView>(null);
    const tabContainerRef = useRef<any>(null);
    const progress = useSharedValue(0);
    
    const getTabIndex = useCallback((tabKey: TabKey) => {
        return TABS.findIndex(tab => tab.key === tabKey);
    }, []);
    
    const handleTabChange = useCallback((tabKey: TabKey) => {
        const index = getTabIndex(tabKey);
        if (index !== -1 && pagerRef.current) {
            pagerRef.current.setPage(index);
        }
    }, [getTabIndex]);
    
    const handlePageScroll = useCallback(
        (e: any) => {
            'worklet';
            const { position, offset } = e.nativeEvent;
            progress.value = position + offset;
        },
        [progress]
    );

    const handlePageSelected = useCallback(
        (e: any) => {
            const position = e.nativeEvent.position;
            progress.value = withTiming(position, { duration: 0 });
            
            const tabKey = TABS[position]?.key;
            if (tabKey) {
                setActiveTab(tabKey);
            }
        },
        [progress]
    );
    
    const handleTabContainerLayout = useCallback((width: number) => {
        // Tab container width'i state'e kaydet (gerekirse)
    }, []);

    return (
        <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}>
            <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
                {/* Header */}
                <Header
                    title="Product Details"
                    showBackButton={true}
                    onBackPress={() => navigation.goBack()}
                />

        {/* Product Name */}
                    <Box px="$3" pt="$2" pb="$2">
                        {(displayProductName || initialProductName) && (
                            <Box
                                bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                                borderWidth={1}
                                borderColor="#E9E9E9"
                                borderRadius={10}
                                px="$2.5"
                                py="$2"
                            >
                                <HStack space="sm" alignItems="center">
                                    {displayProductImage && (
                                        <Box
                                            width={44}
                                            height={44}
                                            borderRadius={8}
                                            overflow="hidden"
                                            bg="#F6F6F6"
                                        >
                                            <Image
                                                source={displayProductImage}
                                                alt={displayProductName}
                                                style={{ width: 44, height: 44 }}
                                                resizeMode="cover"
                                            />
                                        </Box>
                                    )}
                                    <Box flex={1}>
                                        <Text
                                            color={isDark ? '#FFFFFF' : '#000000'}
                                            fontSize="$sm"
                                            fontWeight="$semibold"
                                            numberOfLines={2}
                                        >
                                            {displayProductName}
                                        </Text>
                                    </Box>
                                </HStack>
                            </Box>
                        )}
                    </Box>

                {/* Tab Bar */}
                <TabsBar 
                    activeTab={activeTab} 
                    onChangeTab={handleTabChange} 
                    isDark={isDark}
                    progress={progress}
                    tabContainerRef={tabContainerRef}
                    onTabContainerLayout={handleTabContainerLayout}
                />

        {/* PagerView - Lazy loading: Sadece aktif ve komşu tab'lar render edilir */}
                <AnimatedPagerView
                    ref={pagerRef}
                    style={{ flex: 1 }}
                    initialPage={0}
                    onPageScroll={handlePageScroll}
                    onPageSelected={handlePageSelected}
          offscreenPageLimit={1}
                >
                    {TABS.map((tab) => (
            <Box key={tab.key} flex={1} collapsable={false}>
                            <TabPage
                                tabKey={tab.key}
                brandId={brandId}
                                productId={productId}
                                isDark={isDark}
                                bottomPadding={bottomPadding}
                            />
                        </Box>
                    ))}
                </AnimatedPagerView>
            </VStack>
        </SafeAreaView>
    );
};

export default BrandProductDetailScreen;
