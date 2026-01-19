import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { VStack, Text, Box, Pressable, HStack, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import BrandProductInfoCard from '../components/BrandProductInfoCard';
import { ExperiencePostCard } from '@/src/components/PostCards/ExperiencePostCard';
import NewsCard from '../components/NewsCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import PostCard from '@/src/components/PostCards/PostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import { useSafeAreaValues, toImageSource, useBottomOffset } from '@/src/utils';
import { useAppStore } from '@/src/store/appStore';
import { useUserProfile } from '@/src/features/profile/api/hooks';
import { 
  useBrandProductDetail, 
  useBrandProductFeed, 
  useBrandProductReviews, 
  useBrandProductBenchmarks, 
  useBrandProductTips, 
  useBrandProductQuestions, 
  useBrandProductExperiences, 
  useBrandProductComparisons, 
  useBrandProductNews,
  useBrandStats,
  useBrandCatalog
} from '../api/hooks';
import type { BrandFeedPost } from '../types';
import type { ReviewCardData, ReviewCardContentItem } from '@/src/types/ReviewsCard';
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
  { key: 'experiences', title: 'Experiences' },
  { key: 'comparisons', title: 'Comparisons' },
  { key: 'news', title: 'News' },
] as const;

type TabKey = typeof TABS[number]['key'];

type BrandProductDetailScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandProductDetailScreen'>;
type BrandProductDetailScreenRouteProp = RouteProp<CatalogStackParamList, 'BrandProductDetailScreen'>;

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

const mapExperienceToCardData = (item: BrandFeedPost): ReviewCardData | null => {
  if (item.type !== 'experience') {
    return null;
  }
  
  const postData = item.data as import('@/src/types/ReviewsCard').ReviewApiItem;
  const avatarSource = toImageSource(postData.user.avatar)!;
  const productImage = postData.contextData?.image
    ? toImageSource(postData.contextData.image)
    : undefined;

  const content: ReviewCardContentItem[] = Array.isArray(postData.content) 
    ? postData.content.map((contentItem) => {
        const ratingValue = contentItem.rating || 0;
        const stars = Math.floor(ratingValue / 20);
        
        return {
          tag: {
            icon: 'tag' as const,
            title: contentItem.title || '',
          },
          text: contentItem.content || '',
          rating: Array(5)
            .fill(false)
            .map((_, index) => index < stars),
        };
      })
    : [];

  return {
    id: postData.id,
    user: {
      id: postData.user.id,
      name: postData.user.name,
      title: postData.user.title,
      avatar: avatarSource,
      action: 'wrote a review',
    },
    contextData: {
      id: postData.contextData?.id || '',
      name: postData.contextData?.name || '',
      subName: postData.contextData?.subName || '',
      image: productImage,
      isOwned: postData.contextData?.isOwned,
    },
    content,
    tags: postData.tags || [],
    images: postData.images
      ?.map((img: string) => toImageSource(img))
      .filter((imgSource: any): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [],
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
  if (!postData?.contextData?.id) {
    return null;
  }
  
  const avatarSource = toImageSource(postData?.user?.avatar)!;
  const contextImage = toImageSource(postData.contextData?.image) || require('@/assets/inventory/product_01.png');
  const product: TipsProduct = {
    id: postData.contextData.id,
    name: postData.contextData.name || '',
    subName: postData.contextData.subName || '',
    image: contextImage,
  };
  const category: TipsCategory = {
    id: postData.contextData.id,
    name: postData.contextData.name || '',
    subCategory: postData.contextData.subName || '',
    image: contextImage,
    product,
  };

  return {
    id: postData.id,
    user: {
      id: postData.user.id,
      name: postData.user.name,
      title: postData.user.title,
      avatar: avatarSource,
    },
    category,
    content: postData.content,
    images: postData.images
      ?.map((img) => toImageSource(img))
      .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource),
    stats: postData.stats,
    tag: postData.tag,
    createdAt: postData.createdAt,
  };
};

const mapQuestionToCardData = (item: FeedApiItem | BrandFeedPost): QuestionCardData | null => {
  // FeedApiItem veya BrandFeedPost formatı kontrolü
  if (!('type' in item) || item.type !== 'question') {
    return null;
  }
  
  const postData = 'data' in item ? (item.data as QuestionApiItem) : ((item as any).data as QuestionApiItem);
  if (!postData?.contextData?.id) {
    return null;
  }
  
  const avatarSource = toImageSource(postData?.user?.avatar)!;
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
      name: postData.user.name,
      title: postData.user.title,
      avatar: avatarSource,
    },
    category,
    content: postData.content,
    isBoosted: postData.isBoosted,
    images,
    stats: postData.stats,
    createdAt: postData.createdAt,
  };
};

type MappedPost = 
  | { type: 'post'; id: string; data: PostCardData }
  | { type: 'experience'; id: string; data: ReviewCardData }
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

const TabsBar: React.FC<TabsBarProps> = ({ activeTab, onChangeTab, isDark, progress, tabContainerRef, onTabContainerLayout }) => {
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
};

const TabPage: React.FC<TabPageProps> = ({ tabKey, brandId, productId, isDark, bottomPadding }) => {
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation();

  // API hooks for each tab - Brand product endpoint'leri kullanıyoruz
  const feedQuery = useBrandProductFeed(
    tabKey === 'feed' ? brandId : undefined, 
    tabKey === 'feed' ? productId : undefined, 
    20
  );
  const reviewsQuery = useBrandProductReviews(
    tabKey === 'reviews' ? brandId : undefined, 
    tabKey === 'reviews' ? productId : undefined, 
    20
  );
  const benchmarksQuery = useBrandProductBenchmarks(
    tabKey === 'benchmarks' ? brandId : undefined, 
    tabKey === 'benchmarks' ? productId : undefined, 
    20
  );
  const tipsQuery = useBrandProductTips(
    tabKey === 'tips' ? brandId : undefined, 
    tabKey === 'tips' ? productId : undefined, 
    20
  );
  const questionsQuery = useBrandProductQuestions(
    tabKey === 'questions' ? brandId : undefined, 
    tabKey === 'questions' ? productId : undefined, 
    20
  );
  const experiencesQuery = useBrandProductExperiences(
    tabKey === 'experiences' ? brandId : undefined, 
    tabKey === 'experiences' ? productId : undefined, 
    20
  );
  const comparisonsQuery = useBrandProductComparisons(
    tabKey === 'comparisons' ? brandId : undefined, 
    tabKey === 'comparisons' ? productId : undefined, 
    20
  );
  const newsQuery = useBrandProductNews(
    tabKey === 'news' ? brandId : undefined, 
    tabKey === 'news' ? productId : undefined, 
    20
  );
  
  const activeTabQuery = useMemo(() => {
    switch (tabKey) {
      case 'feed': return feedQuery;
      case 'reviews': return reviewsQuery;
      case 'benchmarks': return benchmarksQuery;
      case 'tips': return tipsQuery;
      case 'questions': return questionsQuery;
      case 'experiences': return experiencesQuery;
      case 'comparisons': return comparisonsQuery;
      case 'news': return newsQuery;
      default: return feedQuery;
    }
  }, [tabKey, feedQuery, reviewsQuery, benchmarksQuery, tipsQuery, questionsQuery, experiencesQuery, comparisonsQuery, newsQuery]);
  
  const mappedPosts = useMemo(() => {
    if (tabKey === 'news') {
      // News için özel mapping
      const queryData = newsQuery.data as any;
      if (!queryData?.pages) return [];
      
      const allNews = queryData.pages.flatMap((page: any) => page?.items ?? []) ?? [];
      return allNews.map((item: any) => ({
        type: 'news' as const,
        id: item.id,
        data: item,
      }));
    }
    
    const queryData = activeTabQuery.data as any;
    if (!queryData?.pages) return [];
    
    // Tüm tab'lar için BrandFeedPost formatı geliyor (/brands/{brandId}/products/{productId}/... endpoint'lerinden)
    const allItems = queryData.pages.flatMap((page: any) => page?.posts ?? []) ?? [];
    
    const validItems = allItems.filter((item: any) => item?.id || item?.data?.id);
    const uniqueItems = validItems.filter((item: any, index: number, self: any[]) => {
      const id = item?.id || item?.data?.id;
      return index === self.findIndex((t: any) => (t?.id || t?.data?.id) === id);
    });
    
    const mapped: MappedPost[] = [];
    
    for (const item of uniqueItems) {
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
        mapped.push(mappedItem);
      }
    }
    
    return mapped;
  }, [activeTabQuery.data, tabKey, newsQuery.data]);
  
  const handleLoadMore = useCallback(() => {
    if (activeTabQuery.hasNextPage && !activeTabQuery.isFetchingNextPage) {
      activeTabQuery.fetchNextPage();
    }
  }, [activeTabQuery]);
  
  const renderPostCard = useCallback((postData: MappedPost | { type: 'news'; id: string; data: any }) => {
    if (postData.type === 'news') {
      return (
        <NewsCard
          key={postData.id}
          id={postData.data.id}
          title={postData.data.title}
          description={postData.data.description}
          source={postData.data.source}
          date={postData.data.date}
          image={toImageSource(postData.data.image)}
          onPress={() => (navigation as any).navigate('NewsDetailScreen', { newsId: postData.data.id })}
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
  }, [navigation]);
  
  if (tabKey === 'news') {
    const newsItems = mappedPosts as any[];
    return (
      <FlatList
        ref={flatListRef}
        data={newsItems}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          newsQuery.isLoading && !((newsQuery.data as any)?.pages?.[0]) ? (
            <Box py={20} alignItems="center">
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
          ) : (
            <Box py={20} alignItems="center">
              <Text color={isDark ? '$textLight400' : '$textDark400'} fontSize="$sm">
                No news found yet.
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
          newsQuery.isFetchingNextPage ? (
            <Box py={20} alignItems="center">
              <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
          ) : null
        }
        contentContainerStyle={{
          paddingBottom: bottomPadding,
        }}
        showsVerticalScrollIndicator={true}
      />
    );
  }
  
  return (
    <FlatList
      ref={flatListRef}
      data={mappedPosts}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        activeTabQuery.isLoading && !((activeTabQuery.data as any)?.pages?.[0]) ? (
          <Box py={20} alignItems="center">
            <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
          </Box>
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
      showsVerticalScrollIndicator={true}
    />
  );
};

const BrandProductDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<BrandProductDetailScreenNavigationProp>();
  const route = useRoute<BrandProductDetailScreenRouteProp>();
  const bottomPadding = useBottomOffset({ includeTabBar: false, extraPadding: 16 });

  const { brandId, productId, productName: initialProductName, productImage: initialProductImage } = route.params;

  // API hooks - Brand product detail
  const { data: productDetail, isLoading: isLoadingProduct } = useBrandProductDetail(brandId, productId);
  const { data: brandStats } = useBrandStats(brandId);
  const { data: brandCatalog } = useBrandCatalog(brandId);
  const { user } = useAppStore();
  const { data: userProfile } = useUserProfile(user?.id);
  
  // Seçilen product bilgisi (navigation'dan gelen veya API'den gelen)
  const displayProductName = productDetail?.name || initialProductName || '';
  const displayProductImage = productDetail?.image 
    ? toImageSource(productDetail.image) 
    : (initialProductImage || require('@/assets/events/card-icon.png'));
  
  // Brand bilgisi
  const brandName = brandCatalog?.name || productDetail?.brand?.name;
  const brandImage = brandCatalog?.logo || productDetail?.brand?.image;
  const userPoints = brandStats?.totalPoints;
  
  // User bilgisi
  const userName = userProfile?.name || user?.name || 'User';
  const userAvatar = userProfile?.avatar || user?.avatar;

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
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Header */}
        <Header
          title="Product Details"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        {/* Product Info Card and User Points Card */}
        <Box px="$4" pt="$4" pb="$3">
          <HStack space="sm" alignItems="stretch">
            {/* Product Info Card */}
            {(displayProductName || initialProductName) && (
              <Box flex={1}>
                <BrandProductInfoCard
                  productName={displayProductName}
                  productImage={displayProductImage}
                  brandName={brandName}
                  brandImage={brandImage}
                />
              </Box>
            )}

            {/* User Points Card */}
            {userPoints !== undefined && (
              <Box
                bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                borderWidth={1}
                borderColor="#E9E9E9"
                borderRadius={10}
                px='$3'
                py='$2'
                minWidth={80}
                alignItems="center"
                justifyContent="center"
              >
                <VStack alignItems="center" space="xs">
                  {/* User Info - Üstte */}
                  <HStack alignItems="center" space="xs">
                    {userAvatar && (
                      <Box
                        width={20}
                        height={20}
                        borderRadius={10}
                        bg="#F6F6F6"
                        alignItems="center"
                        justifyContent="center"
                        overflow="hidden"
                      >
                        <Image
                          source={toImageSource(userAvatar) || require('@/assets/avatar/default-useravatar.png')}
                          alt={userName}
                          style={{
                            width: 20,
                            height: 20,
                          }}
                          resizeMode="cover"
                        />
                      </Box>
                    )}
                    <Text
                      color={isDark ? '#FFFFFF' : '#000000'}
                      fontSize={9}
                      fontWeight="$semibold"
                      numberOfLines={1}
                    >
                      {userName}
                    </Text>
                  </HStack>

                  {/* Points - Altta */}
                  <VStack alignItems="center" space={0}>
                    <Text
                      color="#3CA241"
                      fontSize={14}
                      fontWeight="$bold"
                      lineHeight={16}
                    >
                      {userPoints.toLocaleString()}
                    </Text>
                    <Text
                      color="#3CA241"
                      fontSize={10}
                      fontWeight="$bold"
                      lineHeight={12}
                    >
                      Points
                    </Text>
                  </VStack>
                </VStack>
              </Box>
            )}
          </HStack>
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

        {/* PagerView */}
        <AnimatedPagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageScroll={handlePageScroll}
          onPageSelected={handlePageSelected}
        >
          {TABS.map((tab) => (
            <Box key={tab.key} flex={1}>
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
