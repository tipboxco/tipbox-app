import React, { useCallback, useMemo, useRef } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { FeedSkeleton } from '@/src/components/Skeletons';
import PostCard from '@/src/components/PostCards/PostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import UpdatePostCard from '@/src/components/PostCards/UpdatePostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import { useHottest } from '../../../api/hooks';
import { CardType, ProductInfoType } from '@/src/types/common';
import { toImageSource, useBottomOffset, isSameImageSource } from '@/src/utils';
import type { FeedApiItem } from '@/src/features/feed/api/feedApi';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { ProfilePost } from '@/src/features/profile/types';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import type { ExperiencePostApiItem } from '@/src/types/ExperienceCard';
import type { UpdateApiItem, UpdateCardData } from '@/src/types/UpdateCard';
import type { PostCardData } from '@/src/types/PostCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { ExperiencePostCardData, ExperiencePostCardContentItem } from '@/src/types/ExperienceCard';

interface HottestTabProps {
  searchQuery?: string;
  headerComponent?: React.ReactElement | null;
}

// Map Feed to PostCardData
const mapFeedToCardData = (item: ProfilePost): PostCardData => {
  const defaultPostImage = require('@/assets/defaultImages/default-post.png');
  const contentString = Array.isArray(item.content)
    ? item.content.map((contentItem) => contentItem.content || '').join(' ')
    : (item.content || '');

  // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
  // Kullanıcı post oluştururken görsel eklemek istememiş olabilir, bu durumda görsel alanı gösterilmemeli
  const mappedImages = Array.isArray(item.images)
    ? item.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
    : [];
  const images = mappedImages;

  // contextData.image için fallback
  const contextImage = item.contextData?.image
    ? toImageSource(item.contextData.image)
    : undefined;
  const contextData = item.contextData
    ? {
        ...item.contextData,
        image: contextImage || item.contextData.image || defaultPostImage,
      }
    : undefined;

  return {
    id: item.id,
    user: {
      id: item.user.id,
      name: item.user.name,
      title: item.user.title,
      avatar: toImageSource(item.user.avatar)!,
    },
    content: contentString,
    images,
    stats: item.stats,
    createdAt: item.createdAt,
    contextType: item.contextType,
    contextData,
  };
};

// Map Experience (ExperiencePostApiItem) to ExperiencePostCardData
const mapExperienceToCardData = (item: ExperiencePostApiItem & { type: 'experience' }): ExperiencePostCardData => {
  const defaultPostImage = require('@/assets/defaultImages/default-post.png');
  const avatarSource = toImageSource(item.user.avatar)!;
  const ctx = item.contextData as { product?: { id?: string; name?: string; image?: string | null; subName?: string } } | undefined;
  const rawProduct = ctx?.product ?? item.contextData ?? item.product;
  const productImage = rawProduct?.image ? toImageSource(rawProduct.image) : undefined;

  const contentBlocks = item.experienceContent ?? (Array.isArray(item.content) ? item.content : []);
  const content: ExperiencePostCardContentItem[] = Array.isArray(contentBlocks)
    ? contentBlocks.map((contentItem) => ({
        tag: {
          icon: (contentItem.title?.toLowerCase?.().includes('product') || contentItem.title?.toLowerCase?.().includes('usage')) ? 'package' : 'tag',
          title: contentItem.title,
        },
        text: contentItem.content,
        rating: Array(5)
          .fill(false)
          .map((_, index) => index < (contentItem.rating || 0)),
      }))
    : [];

  const mappedImages = item.images
    ?.map((img) => toImageSource(img))
    .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
  // Carousel'de sadece kullanıcı yüklediği görseller; ürün görseli gösterilmez
  const filteredImages = mappedImages.filter((img) => !isSameImageSource(img, productImage ?? defaultPostImage));
  const images = filteredImages.length > 0 ? filteredImages : [defaultPostImage];

  const isOwned = item.status === 'own' || rawProduct?.isOwned || false;
  const subNameRaw = rawProduct?.subName ?? '';
  const subName = subNameRaw && !/^Status:\s*(tested|own)$/i.test(String(subNameRaw)) ? subNameRaw : '';
  const tagsFromApi = Array.isArray(item.tags) ? item.tags : [];
  const tags =
    tagsFromApi.length >= 3
      ? tagsFromApi
      : [item.durationName, item.locationName, item.purposeName].filter((s): s is string => !!s);

  return {
    id: item.id,
    user: {
      id: item.user.id,
      name: item.user.name,
      title: item.user.title,
      avatar: avatarSource,
      action: isOwned ? 'Added new product and experiences to inventory!' : undefined,
    },
    contextData: {
      id: rawProduct?.id || '',
      name: rawProduct?.name || '',
      subName,
      image: productImage ?? defaultPostImage,
      isOwned,
    },
    content,
    tags,
    images,
    stats: item.stats,
    createdAt: item.createdAt,
  };
};

// Map Benchmark to BenchmarkCardData
const mapBenchmarkToCardData = (item: BenchmarkApiItem & { type: 'benchmark' }): BenchmarkCardData => {
  const avatarSource = toImageSource(item.user.avatar)!;

  const products: BenchmarkProduct[] = item.products.map((p) => ({
    id: p.id,
    name: p.name,
    subName: p.subName,
    image: toImageSource(p.image)!,
    isOwned: p.isOwned,
    choice: p.choice,
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

// Map Tips to TipsCardData
const mapTipsToCardData = (item: TipsApiItem & { type: 'tipsAndTricks' }): TipsCardData => {
  const defaultPostImage = require('@/assets/defaultImages/default-post.png');
  const avatarSource = toImageSource(item.user.avatar)!;
  const contextImage = toImageSource(item.contextData.image)!;

  // CRITICAL: contextType'a göre product veya category mapping yap
  let category: TipsCategory;
  
  if (item.contextType === 'sub_category') {
    // SubCategory: sadece category bilgisi, product YOK
    category = {
      id: item.contextData.id,
      name: item.contextData.name,
      subCategory: item.contextData.subName,
      image: contextImage,
      // product undefined bırak
    };
  } else {
    // Product veya ProductGroup: category.product dolu
    const product: TipsProduct = {
      id: item.contextData.id,
      name: item.contextData.name,
      subName: item.contextData.subName,
      image: contextImage,
    };

    category = {
      id: item.contextData.id,
      name: item.contextData.name,
      subCategory: item.contextData.subName,
      image: contextImage,
      product,
    };
  }

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
    images,
    stats: item.stats,
    tag: item.tag,
    benefitCategory: item.benefitCategory,
    createdAt: item.createdAt,
  };
};

// Map Question to QuestionCardData
const mapQuestionToCardData = (item: QuestionApiItem & { type: 'question' }): QuestionCardData => {
  const defaultPostImage = require('@/assets/defaultImages/default-post.png');
  const avatarSource = toImageSource(item.user.avatar)!;
  const contextImage = toImageSource(item.contextData.image)!;

  // CRITICAL: contextType'a göre product veya category mapping yap
  let category: QuestionCardCategory;
  
  if (item.contextType === 'sub_category') {
    // SubCategory: category dolu, product YOK
    category = {
      id: item.contextData.id,
      name: item.contextData.name,
      subCategory: item.contextData.subName,
      image: contextImage,
      // product undefined bırak
    };
  } else {
    // Product veya ProductGroup: category.product dolu
    const product: QuestionCardProduct = {
      id: item.contextData.id,
      name: item.contextData.name,
      subName: item.contextData.subName,
      image: contextImage,
    };

    category = {
      id: item.contextData.id,
      name: item.contextData.name,
      subCategory: item.contextData.subName,
      image: contextImage,
      product,
    };
  }

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
    images,
    stats: item.stats,
    createdAt: item.createdAt,
  };
};

// Map Update to UpdateCardData
const mapUpdateToCardData = (item: UpdateApiItem & { type: 'update' }): UpdateCardData => {
  const defaultPostImage = require('@/assets/defaultImages/default-post.png');
  const avatarSource = toImageSource(item.user.avatar)!;
  
  let productInfoType: ProductInfoType = ProductInfoType.PRODUCT;
  if (item.contextType === 'product_group') {
    productInfoType = ProductInfoType.PRODUCT_GROUP;
  } else if (item.contextType === 'sub_category') {
    productInfoType = ProductInfoType.SUB_CATEGORY;
  }

  // relatedPost null check
  if (!item.relatedPost) {
    console.warn('[mapUpdateToCardData] Missing relatedPost for item:', item.id);
    const mappedImages = item.images?.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img) ?? [];
    const images = mappedImages.length > 0 ? mappedImages : [defaultPostImage];

    return {
      id: item.id,
      user: {
        id: item.user.id,
        name: item.user.name,
        title: item.user.title,
        avatar: avatarSource,
      },
      stats: item.stats,
      createdAt: item.createdAt,
      contextType: productInfoType,
      product: {
        id: '',
        name: '',
        subName: '',
        image: require('@/assets/inventory/product_01.png'),
        isOwned: false,
      },
      content: item.content || '',
      images,
      relatedPost: undefined,
    };
  }

  const relatedPostContent = (item.relatedPost?.content && Array.isArray(item.relatedPost.content))
    ? item.relatedPost.content
        .filter((contentItem) => contentItem != null)
        .map((contentItem) => {
          const ratingArray: number[] = Array(5).fill(0);
          const ratingValue = Math.min(Math.max(Math.round((contentItem?.rating || 0) / 20), 0), 5);
          for (let i = 0; i < ratingValue; i++) {
            ratingArray[i] = 1;
          }

          return {
            tag: {
              icon: 'tag',
              title: contentItem?.title || '',
            },
            text: contentItem?.content || '',
            rating: ratingArray,
          };
        })
    : [];

  // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
  // Kullanıcı post oluştururken görsel eklemek istememiş olabilir, bu durumda görsel alanı gösterilmemeli
  const mappedImages = Array.isArray(item.images)
    ? item.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
    : [];
  const images = mappedImages;

  return {
    id: item.id,
    user: {
      id: item.user.id,
      name: item.user.name,
      title: item.user.title,
      avatar: avatarSource,
    },
    stats: item.stats,
    createdAt: item.createdAt,
    contextType: productInfoType,
    product: {
      id: item.relatedPost?.product?.id || '',
      name: item.relatedPost?.product?.name || '',
      subName: item.relatedPost?.product?.subName || '',
      image: toImageSource(item.relatedPost?.product?.image) || require('@/assets/inventory/product_01.png'),
      isOwned: item.relatedPost?.product?.isOwned || false,
    },
    content: item.content,
    images,
    relatedPost: item.relatedPost ? {
      id: item.relatedPost.id,
      product: {
        id: item.relatedPost.product?.id || '',
        name: item.relatedPost.product?.name || '',
        subName: item.relatedPost.product?.subName || '',
        image: toImageSource(item.relatedPost.product?.image) || require('@/assets/inventory/product_01.png'),
        isOwned: item.relatedPost.product?.isOwned || false,
      },
      content: relatedPostContent,
      tags: item.relatedPost.tags || [],
      images: item.relatedPost.images?.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img),
    } : undefined,
  };
};

const HottestTabComponent: React.FC<HottestTabProps> = ({ searchQuery, headerComponent }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const bottomPadding = useBottomOffset({ includeTabBar: false, extraPadding: 8 });
  
  // onEndReached loop'unu önlemek için ref
  const isLoadingMoreRef = useRef(false);

  // Hottest API hook with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useHottest(3, searchQuery);

  // Flatten all pages into a single array and remove duplicates by ID
  const hottestItems = useMemo(() => {
    if (!data?.pages) return [];
    
    const allItems = data.pages.flatMap((page) => page.items);
    
    // Remove duplicates by ID
    const uniqueItemsMap = new Map<string, FeedApiItem>();
    for (const item of allItems) {
      const itemId = item.data.id;
      if (!uniqueItemsMap.has(itemId)) {
        uniqueItemsMap.set(itemId, item);
      }
    }
    
    return Array.from(uniqueItemsMap.values());
  }, [data?.pages]);

  // Item sayısı değiştiğinde ref'i güncelle
  React.useEffect(() => {
    isLoadingMoreRef.current = false;
  }, [hottestItems.length]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMoreRef.current) {
      return;
    }

    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    isLoadingMoreRef.current = true;

    fetchNextPage()
      .finally(() => {
        setTimeout(() => {
          isLoadingMoreRef.current = false;
        }, 1000);
      });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderHottestItem = useCallback((item: FeedApiItem) => {
    switch (item.type) {
      case CardType.EXPERIENCE:
        if ('contextData' in item.data && 'content' in item.data && Array.isArray(item.data.content)) {
          return (
            <ExperiencePostCard
              data={mapExperienceToCardData(item.data as ExperiencePostApiItem & { type: 'experience' })}
            />
          );
        }
        return null;
      case CardType.POST:
        return (
          <PostCard
            data={mapFeedToCardData(item.data as ProfilePost)}
          />
        );
      case CardType.BENCHMARK:
        return (
          <BenchmarkPostCard
            data={mapBenchmarkToCardData(item.data as BenchmarkApiItem & { type: 'benchmark' })}
          />
        );
      case CardType.QUESTION:
        if ('contextType' in item.data && 'contextData' in item.data && 'isBoosted' in item.data) {
          return (
            <QuestionPostCard
              data={mapQuestionToCardData(item.data as QuestionApiItem & { type: 'question' })}
            />
          );
        }
        return null;
      case CardType.TIPS_AND_TRICKS:
        return (
          <TipsAndTricksPostCard
            data={mapTipsToCardData(item.data as TipsApiItem & { type: 'tipsAndTricks' })}
          />
        );
      case CardType.UPDATE:
        if ('relatedPost' in item.data && 'contextType' in item.data) {
          return (
            <UpdatePostCard
              data={mapUpdateToCardData(item.data as UpdateApiItem & { type: 'update' })}
            />
          );
        }
        return null;
      default:
        return null;
    }
  }, []);

  // ARCHITECTURE FIX: All hooks must be called before any early returns
  // React Hooks Rules: Hooks must be called in the same order on every render
  // PERFORMANCE FIX: Memoize footer component to prevent re-renders
  const LoadingFooter = useMemo(() => {
    if (!isFetchingNextPage) return null;
    return (
      <Box py="$4" alignItems="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }, [isFetchingNextPage, isDark]);

  // PERFORMANCE FIX: Memoize keyExtractor
  const getItemKey = useCallback((item: FeedApiItem) => {
    return `hottest-${item.data.id}`;
  }, []);

  // Early returns AFTER all hooks
  // CACHE FIX: Only show skeleton when loading and no cached data
  if (isLoading && !data?.pages?.[0]) {
    return <FeedSkeleton count={5} />;
  }

  if (error) {
    return (
      <Box py="$8" alignItems="center">
        <Text color={isDark ? '#FFFFFF' : '#000000'}>
          An error occurred. Please try again.
        </Text>
      </Box>
    );
  }

  // Empty state - Show banner carousel and empty message
  if (hottestItems.length === 0) {
    return (
      <Box flex={1} pt={0} mt={0}>
        <FlatList
          data={[]}
          renderItem={() => null}
          keyExtractor={() => 'empty'}
          ListHeaderComponent={
            <>
              {headerComponent}
              <Box py="$8" alignItems="center" px="$4">
                <Text 
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$md"
                  textAlign="center"
                >
                  Henüz gönderi yok
                </Text>
              </Box>
            </>
          }
          contentContainerStyle={{ paddingTop: 16, paddingBottom: bottomPadding }}
          scrollEnabled={true}
          nestedScrollEnabled={false}
          showsVerticalScrollIndicator={true}
        />
      </Box>
    );
  }

  return (
    <Box flex={1} pt={0} mt={0}>
      <FlatList
        data={hottestItems}
        renderItem={({ item }) => renderHottestItem(item)}
        keyExtractor={getItemKey}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        removeClippedSubviews={true}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: bottomPadding, paddingHorizontal: 16 }}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        ListHeaderComponent={headerComponent}
        ListFooterComponent={LoadingFooter}
        scrollEnabled={true}
        nestedScrollEnabled={false}
        showsVerticalScrollIndicator={true}
      />
    </Box>
  );
};

// React.memo ile sarmalayarak gereksiz re-render'ları önle
// HottestTab props almadığı için her zaman aynı component instance'ı
export const HottestTab = React.memo(HottestTabComponent);

export default HottestTab;

