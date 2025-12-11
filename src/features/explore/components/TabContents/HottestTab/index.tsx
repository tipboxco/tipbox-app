import React, { useCallback, useMemo, useRef } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import PostCard from '@/src/components/PostCards/PostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import UpdatePostCard from '@/src/components/PostCards/UpdatePostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import { useHottest } from '../../../api/hooks';
import { CardType, ProductInfoType } from '@/src/types/common';
import { toImageSource, useBottomOffset } from '@/src/utils';
import type { FeedApiItem } from '@/src/features/feed/api/feedApi';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { ProfilePost } from '@/src/features/profile/types';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import type { ReviewApiItem } from '@/src/types/ReviewsCard';
import type { UpdateApiItem, UpdateCardData } from '@/src/types/UpdateCard';
import type { PostCardData } from '@/src/types/PostCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { ReviewCardData, ReviewCardContentItem } from '@/src/types/ReviewsCard';

interface HottestTabProps {
  // Props gerekirse buraya eklenebilir
}

// Map Feed to PostCardData
const mapFeedToCardData = (item: ProfilePost): PostCardData => {
  const contentString = Array.isArray(item.content)
    ? item.content.map((contentItem) => contentItem.content || '').join(' ')
    : (item.content || '');

  return {
    id: item.id,
    user: {
      id: item.user.id,
      name: item.user.name,
      title: item.user.title,
      avatar: toImageSource(item.user.avatar)!,
    },
    content: contentString,
    images: item.images?.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img),
    stats: item.stats,
    createdAt: item.createdAt,
    contextType: item.contextType,
    contextData: item.contextData,
  };
};

// Map Experience (ReviewApiItem) to ReviewCardData
const mapExperienceToCardData = (item: ReviewApiItem & { type: 'experience' }): ReviewCardData => {
  const avatarSource = toImageSource(item.user.avatar)!;
  const productImage = item.contextData?.image
    ? toImageSource(item.contextData.image)
    : undefined;

  const content: ReviewCardContentItem[] = item.content.map((contentItem) => ({
    tag: {
      icon: 'tag',
      title: contentItem.title,
    },
    text: contentItem.content,
    rating: Array(5)
      .fill(false)
      .map((_, index) => index < (contentItem.rating || 0)),
  }));

  return {
    id: item.id,
    user: {
      id: item.user.id,
      name: item.user.name,
      title: item.user.title,
      avatar: avatarSource,
      action: 'wrote a review',
    },
    contextData: {
      id: item.contextData?.id || '',
      name: item.contextData?.name || '',
      subName: item.contextData?.subName || '',
      image: productImage,
      isOwned: item.contextData?.isOwned,
    },
    content,
    tags: item.tags,
    images: item.images
      ?.map((img) => toImageSource(img))
      .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [],
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
  const avatarSource = toImageSource(item.user.avatar)!;

  const product: TipsProduct = {
    id: item.contextData.id,
    name: item.contextData.name,
    subName: item.contextData.subName,
    image: toImageSource(item.contextData.image)!,
  };

  const category: TipsCategory = {
    id: item.contextData.id,
    name: item.contextData.name,
    subCategory: item.contextData.subName,
    image: toImageSource(item.contextData.image)!,
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

// Map Question to QuestionCardData
const mapQuestionToCardData = (item: QuestionApiItem & { type: 'question' }): QuestionCardData => {
  const avatarSource = toImageSource(item.user.avatar)!;

  const product: QuestionCardProduct = {
    id: item.contextData.id,
    name: item.contextData.name,
    subName: item.contextData.subName,
    image: toImageSource(item.contextData.image)!,
  };

  const category: QuestionCardCategory = {
    id: item.contextData.id,
    name: item.contextData.name,
    subCategory: item.contextData.subName,
    image: toImageSource(item.contextData.image)!,
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
    isBoosted: item.isBoosted,
    images: item.images
      ?.map((img) => toImageSource(img))
      .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource),
    stats: item.stats,
    createdAt: item.createdAt,
  };
};

// Map Update to UpdateCardData
const mapUpdateToCardData = (item: UpdateApiItem & { type: 'update' }): UpdateCardData => {
  const avatarSource = toImageSource(item.user.avatar)!;
  
  let productInfoType: ProductInfoType = ProductInfoType.PRODUCT;
  if (item.contextType === 'product_group') {
    productInfoType = ProductInfoType.PRODUCT_GROUP;
  } else if (item.contextType === 'sub_category') {
    productInfoType = ProductInfoType.SUB_CATEGORY;
  }

  const relatedPostContent = item.relatedPost.content.map((contentItem) => {
    const ratingArray: number[] = Array(5).fill(0);
    const ratingValue = Math.min(Math.max(Math.round(contentItem.rating / 20), 0), 5);
    for (let i = 0; i < ratingValue; i++) {
      ratingArray[i] = 1;
    }

    return {
      tag: {
        icon: 'tag',
        title: contentItem.title,
      },
      text: contentItem.content,
      rating: ratingArray,
    };
  });

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
      id: item.relatedPost.product.id,
      name: item.relatedPost.product.name,
      subName: item.relatedPost.product.subName,
      image: toImageSource(item.relatedPost.product.image)!,
      isOwned: item.relatedPost.product.isOwned,
    },
    content: item.content,
    images: item.images?.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img),
    relatedPost: {
      id: item.relatedPost.id,
      product: {
        id: item.relatedPost.product.id,
        name: item.relatedPost.product.name,
        subName: item.relatedPost.product.subName,
        image: toImageSource(item.relatedPost.product.image)!,
        isOwned: item.relatedPost.product.isOwned,
      },
      content: relatedPostContent,
      tags: item.relatedPost.tags,
      images: item.relatedPost.images?.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img),
    },
  };
};

const HottestTabComponent: React.FC<HottestTabProps> = () => {
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
  } = useHottest(3);

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
              key={item.data.id}
              data={mapExperienceToCardData(item.data as ReviewApiItem & { type: 'experience' })}
            />
          );
        }
        return null;
      case CardType.POST:
        return (
          <PostCard
            key={item.data.id}
            data={mapFeedToCardData(item.data as ProfilePost)}
          />
        );
      case CardType.BENCHMARK:
        return (
          <BenchmarkPostCard
            key={item.data.id}
            data={mapBenchmarkToCardData(item.data as BenchmarkApiItem & { type: 'benchmark' })}
          />
        );
      case CardType.QUESTION:
        if ('contextType' in item.data && 'contextData' in item.data && 'isBoosted' in item.data) {
          return (
            <QuestionPostCard
              key={item.data.id}
              data={mapQuestionToCardData(item.data as QuestionApiItem & { type: 'question' })}
            />
          );
        }
        return null;
      case CardType.TIPS_AND_TRICKS:
        return (
          <TipsAndTricksPostCard
            key={item.data.id}
            data={mapTipsToCardData(item.data as TipsApiItem & { type: 'tipsAndTricks' })}
          />
        );
      case CardType.UPDATE:
        if ('relatedPost' in item.data && 'contextType' in item.data) {
          return (
            <UpdatePostCard
              key={item.data.id}
              data={mapUpdateToCardData(item.data as UpdateApiItem & { type: 'update' })}
            />
          );
        }
        return null;
      default:
        return null;
    }
  }, []);

  if (isLoading && hottestItems.length === 0) {
    return (
      <Box py="$8" alignItems="center">
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box py="$8" alignItems="center">
        <Text color={isDark ? '#FFFFFF' : '#000000'}>
          Bir hata oluştu. Lütfen tekrar deneyin.
        </Text>
      </Box>
    );
  }

  if (hottestItems.length === 0) {
    return (
      <Box py="$8" alignItems="center">
        <Text color={isDark ? '#FFFFFF' : '#000000'}>
          Henüz içerik bulunmuyor.
        </Text>
      </Box>
    );
  }

  return (
    <Box px="$4" pt={0} mt={0}>
      <FlatList
        data={hottestItems}
        renderItem={({ item }) => renderHottestItem(item)}
        keyExtractor={(item) => item.data.id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        removeClippedSubviews={false}
        contentContainerStyle={{ paddingTop: 0, paddingBottom: bottomPadding }}
        ListFooterComponent={
          isFetchingNextPage ? (
            <Box py="$4" alignItems="center">
              <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
          ) : null
        }
        scrollEnabled={false}
        nestedScrollEnabled={true}
      />
    </Box>
  );
};

// React.memo ile sarmalayarak gereksiz re-render'ları önle
// HottestTab props almadığı için her zaman aynı component instance'ı
export const HottestTab = React.memo(HottestTabComponent);

export default HottestTab;

