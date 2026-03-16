import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, FlatList, RefreshControl, Platform } from 'react-native';
import { VStack, Text, Box, HStack, Image } from '@gluestack-ui/themed';
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
import { toImageSource, useBottomOffset, formatRelativeTime, isSameImageSource } from '@/src/utils';
import { navigationService } from '@/src/services/NavigationService';
import {
  useBrandProductDetail,
  useBrandProductNews,
  useCatalogProductPosts,
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
import { useTranslation } from '@/src/hooks/useTranslation';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { CatalogFilterChips } from '../components/CatalogFilterChips';
import type { CatalogFilterId, CatalogFilterParams } from '../components/CatalogFilterChips';
import { CatalogFilterSheet } from '../components/CatalogFilterSheet';

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
  if (!('type' in item) || item.type !== 'tipsAndTricks') {
    return null;
  }

  const postData = 'data' in item ? (item.data as TipsApiItem) : ((item as any).data as TipsApiItem);

  if (!postData) {
    return null;
  }

  const contextData = postData.contextData || (postData as any).product;
  if (!contextData || !contextData.id) {
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
  if (!('type' in item) || item.type !== 'question') {
    return null;
  }

  const postData = 'data' in item ? (item.data as QuestionApiItem) : ((item as any).data as QuestionApiItem);

  if (!postData) {
    return null;
  }

  if (!postData.contextData || !postData.contextData.id) {
    return null;
  }

  if (!postData.user || !postData.user.id) {
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
    boostedUntil: postData.boostedUntil,
    boostPrice: postData.boostPrice,
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

// Map catalog filter tag value to API filter param
const mapTagToApiFilter = (tag?: string): 'all' | 'reviews' | 'benchmarks' | 'tips_and_tricks' | 'questions' | 'updates' | undefined => {
  if (!tag || tag === 'all' || tag === 'news') return undefined;
  return tag as any;
};

const mapSortToApiSort = (sort?: string): 'newest' | 'oldest' | 'most_popular' | undefined => {
  if (!sort || sort === 'newest') return undefined;
  return sort as any;
};

const BrandProductDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<BrandProductDetailScreenNavigationProp>();
  const route = useRoute<BrandProductDetailScreenRouteProp>();
  const bottomPadding = useBottomOffset({ includeTabBar: false, extraPadding: 16 });
  const { t } = useTranslation('catalog');
  const insets = useSafeAreaInsets();
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  const flatListRef = useRef<FlatList>(null);

  const { brandId, productId, productName: initialProductName, productImage: initialProductImage } = route.params;

  // API hooks - Brand product detail
  const { data: productDetail } = useBrandProductDetail(brandId, productId);

  // Seçilen product bilgisi (navigation'dan gelen veya API'den gelen)
  const displayProductName = productDetail?.name || initialProductName || '';
  const displayProductImage = productDetail?.image
    ? toImageSource(productDetail.image)
    : (initialProductImage || require('@/assets/events/card-icon.png'));

  // Filter state
  const [filters, setFilters] = useState<CatalogFilterParams>({});
  const isInitialMount = useRef(true);

  // Determine if we're in news mode
  const isNewsMode = filters.tag === 'news';

  // API hooks - Posts (catalog context endpoint with filter/sort)
  const apiFilter = mapTagToApiFilter(filters.tag);
  const apiSort = mapSortToApiSort(filters.sort);
  const postsQuery = useCatalogProductPosts(
    isNewsMode ? undefined : productId,
    apiFilter,
    apiSort,
    20
  );

  // API hooks - News (separate endpoint)
  const newsQuery = useBrandProductNews(brandId, productId, 20, isNewsMode);

  // Active query based on filter
  const activeQuery = isNewsMode ? newsQuery : postsQuery;

  // Scroll to top when filters change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [filters]);

  // Handle filter chip press - open bottom sheet
  const handleFilterButtonPress = useCallback((filterId: CatalogFilterId) => {
    openBottomSheet(
      <CatalogFilterSheet
        filterId={filterId}
        filters={filters}
        onFiltersChange={setFilters}
        onClose={closeBottomSheet}
      />,
      {
        snapPoints: ['50%'],
        enableDynamicSizing: false,
        enablePanDownToClose: true,
        animateOnMount: false,
        paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0,
      }
    );
  }, [filters, openBottomSheet, closeBottomSheet, insets.bottom]);

  // Mapping cache
  const mappingCacheRef = useRef<Map<string, MappedPost | { type: 'news'; id: string; data: any }>>(new Map());

  // Clear cache when filters change
  useEffect(() => {
    mappingCacheRef.current.clear();
  }, [filters]);

  const mappedPosts = useMemo(() => {
    if (isNewsMode) {
      const queryData = newsQuery.data as any;
      if (!queryData?.pages) return [];

      const allNews = queryData.pages.flatMap((page: any) => page?.items ?? []) ?? [];
      return allNews.map((item: any) => {
        const cached = mappingCacheRef.current.get(item.id);
        if (cached && cached.type === 'news') return cached;

        const mapped = { type: 'news' as const, id: item.id, data: item };
        mappingCacheRef.current.set(item.id, mapped);
        return mapped;
      });
    }

    const queryData = postsQuery.data as any;
    if (!queryData?.pages) return [];

    const allItems = queryData.pages.flatMap((page: any) => page?.items ?? page?.posts ?? []) ?? [];
    const validItems = allItems.filter((item: any) => item?.id || item?.data?.id);
    const uniqueItems = validItems.filter((item: any, index: number, self: any[]) => {
      const id = item?.id || item?.data?.id;
      return index === self.findIndex((t: any) => (t?.id || t?.data?.id) === id);
    });

    const mapped: (MappedPost | { type: 'news'; id: string; data: any })[] = [];

    for (const item of uniqueItems) {
      const itemId = item?.id || item?.data?.id;

      const cached = mappingCacheRef.current.get(itemId);
      if (cached && cached.type !== 'news') {
        mapped.push(cached as MappedPost);
        continue;
      }

      let mappedItem: MappedPost | null = null;

      if ('type' in item && 'data' in item) {
        const brandPost = item as BrandFeedPost;

        switch (brandPost.type) {
          case 'experience': {
            const experienceData = mapExperienceToCardData(brandPost);
            if (experienceData) {
              mappedItem = { type: 'experience', id: experienceData.id, data: experienceData };
            }
            break;
          }
          case 'benchmark': {
            const benchmarkData = mapBenchmarkToCardData(brandPost);
            if (benchmarkData) {
              mappedItem = { type: 'benchmark', id: benchmarkData.id, data: benchmarkData };
            }
            break;
          }
          case 'tipsAndTricks': {
            const tipsData = mapTipsToCardData(brandPost);
            if (tipsData) {
              mappedItem = { type: 'tips', id: tipsData.id, data: tipsData };
            }
            break;
          }
          case 'question': {
            const questionData = mapQuestionToCardData(brandPost);
            if (questionData) {
              mappedItem = { type: 'question', id: questionData.id, data: questionData };
            }
            break;
          }
          case 'post': {
            const postData = mapPostToCardData(brandPost.data as ProfilePost);
            if (postData) {
              mappedItem = { type: 'post', id: postData.id, data: postData };
            }
            break;
          }
        }
      }

      if (mappedItem) {
        mappingCacheRef.current.set(itemId, mappedItem);
        mapped.push(mappedItem);
      }
    }

    return mapped;
  }, [postsQuery.data, newsQuery.data, isNewsMode]);

  // Pull to refresh
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await activeQuery.refetch();
    } catch (error) {
      if (__DEV__) {
        console.error('[BrandProductDetailScreen] Refresh error:', error);
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeQuery]);

  const renderPostCard = useCallback((postData: MappedPost | { type: 'news'; id: string; data: any }) => {
    if (postData.type === 'news') {
      const formattedDate = postData.data?.date ? formatRelativeTime(postData.data.date) : '';
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

  const ListFooterComponent = useMemo(() => {
    if (!activeQuery.isFetchingNextPage) return null;
    return (
      <Box py={20} alignItems="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }, [activeQuery.isFetchingNextPage, isDark]);

  const ListEmptyComponent = useMemo(() => {
    if (activeQuery.isLoading && !((activeQuery.data as any)?.pages?.[0])) {
      return (
        <Box py={20} alignItems="center">
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        </Box>
      );
    }
    return (
      <Box py={20} alignItems="center">
        <Text color={isDark ? '$textLight400' : '$textDark400'} fontSize="$sm">
          {isNewsMode ? t('brandProductDetail.noNews') : t('brandProductDetail.noContent')}
        </Text>
      </Box>
    );
  }, [activeQuery.isLoading, activeQuery.data, isNewsMode, isDark, t]);

  const isLoadingMoreRef = useRef(false);
  const handleLoadMore = useCallback(() => {
    if (isLoadingMoreRef.current || !activeQuery.hasNextPage || activeQuery.isFetchingNextPage) {
      return;
    }
    isLoadingMoreRef.current = true;
    activeQuery.fetchNextPage().finally(() => {
      setTimeout(() => {
        isLoadingMoreRef.current = false;
      }, 500);
    });
  }, [activeQuery]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Header */}
        <Header
          title={t('brandProductDetail.title')}
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

        {/* Filter Chips */}
        <CatalogFilterChips
          filters={filters}
          onFilterPress={handleFilterButtonPress}
          onClearAll={() => setFilters({})}
        />

        {/* Post List */}
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
          removeClippedSubviews={true}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={5}
          updateCellsBatchingPeriod={50}
        />
      </VStack>
    </SafeAreaView>
  );
};

export default BrandProductDetailScreen;
