import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { VStack, Text, Box } from '@gluestack-ui/themed';
import PostCard from '@/src/components/PostCards/PostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import { useUserPosts } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useCurrentUserIdOrLogout, toImageSource } from '@/src/utils';
import { CardType } from '@/src/types/common';
import type { PostCardData } from '@/src/types/PostCard';
import type { ReviewCardData, ReviewCardContentItem } from '@/src/types/ReviewsCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { ProfilePost, ProfileReview, ProfileFeedItem } from '../../types';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';

// Map Post/Feed to PostCardData
const mapPostToCardData = (post: ProfilePost): PostCardData => {
  const contextImage = post.contextData?.image
    ? toImageSource(post.contextData.image)
    : undefined;

  // content array ise string'e çevir, değilse direkt kullan
  const contentString = Array.isArray(post.content)
    ? post.content.map((item) => item.content || '').join(' ')
    : (post.content || '');

  return {
    id: post.id,
    user: {
      id: post.user.id,
      name: post.user.name,
      title: post.user.title,
      avatar: toImageSource(post.user.avatar)!,
    },
    content: contentString,
    images:
      post.images
        ?.map((img) => toImageSource(img))
        .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [],
    stats: {
      likes: post.stats.likes,
      comments: post.stats.comments || 0,
      shares: post.stats.shares,
      bookmarks: post.stats.bookmarks,
    },
    createdAt: post.createdAt,
    contextType: post.contextType,
    contextData: post.contextData
      ? {
          id: post.contextData.id,
          name: post.contextData.name,
          subName: post.contextData.subName,
          image: contextImage || post.contextData.image,
          isOwned: post.contextData.isOwned,
        }
      : undefined,
  };
};

// Map Experience (Review) to ReviewCardData
const mapExperienceToCardData = (review: ProfileReview): ReviewCardData => {
  const avatarSource = review.user?.avatar
    ? toImageSource(review.user.avatar)!
    : require('@/assets/avatar/ozan.png');
  
  const productImage = review.contextData?.image
    ? toImageSource(review.contextData.image)
    : undefined;

  const content: ReviewCardContentItem[] = review.content?.map((item) => ({
    tag: {
      icon: 'tag',
      title: item.title,
    },
    text: item.content,
    rating: Array(5)
      .fill(false)
      .map((_, index) => index < (item.rating || 0)),
  })) ?? [];

  return {
    id: review.id,
    user: {
      id: review.user?.id || '',
      name: review.user?.name || 'Unknown',
      title: review.user?.title || '',
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

// Map Benchmark to BenchmarkCardData
const mapBenchmarkToCardData = (item: BenchmarkApiItem): BenchmarkCardData => {
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
const mapTipsToCardData = (item: TipsApiItem): TipsCardData => {
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
const mapQuestionToCardData = (item: QuestionApiItem): QuestionCardData => {
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

// Mapped post type
type MappedPost = 
  | { type: 'post'; id: string; data: PostCardData }
  | { type: 'experience'; id: string; data: ReviewCardData }
  | { type: 'benchmark'; id: string; data: BenchmarkCardData }
  | { type: 'tips'; id: string; data: TipsCardData }
  | { type: 'question'; id: string; data: QuestionCardData };

const FeedTabComponent = () => {
  const userId = useCurrentUserIdOrLogout();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  // Render sayısını takip et ve değişen değerleri log'la
  const renderCountRef = useRef(0);
  const prevValuesRef = useRef<any>({});
  
  // User Posts API hook with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isPending,
    error,
  } = useUserPosts(userId, 5);

  useEffect(() => {
    renderCountRef.current += 1;
    const currentValues = {
      userId,
      colorMode,
      dataPagesCount: data?.pages?.length,
      hasNextPage,
      isFetchingNextPage,
      isLoading,
      isPending,
      error: error?.message,
    };
    
    const changedValues: string[] = [];
    Object.keys(currentValues).forEach((key) => {
      const typedKey = key as keyof typeof currentValues;
      if (prevValuesRef.current[typedKey] !== currentValues[typedKey]) {
        changedValues.push(`${key}: ${prevValuesRef.current[typedKey]} → ${currentValues[typedKey]}`);
      }
    });
    
    console.log(`[FeedTab] Render #${renderCountRef.current}`, {
      changed: changedValues.length > 0 ? changedValues : ['No changes detected'],
      current: currentValues,
    });
    
    prevValuesRef.current = currentValues;
  });

  // Flatten all pages into a single array - useMemo ile memoize et
  // Duplicate ID'leri filtrele (backend cursor desteklemiyorsa aynı item'lar tekrar gelebilir)
  // Mapping sonuçlarını da cache'le - böylece React.memo düzgün çalışır
  const posts = useMemo(() => {
    const allItems = data?.pages.flatMap((page) => page.items) ?? [];
    
    // Detaylı log: Duplicate filter öncesi
    console.log('[FeedTab] Duplicate Filter Öncesi:', {
      pagesCount: data?.pages?.length || 0,
      allItemsCount: allItems.length,
      allItemIds: allItems.map((item) => item.id),
      pagesItemIds: data?.pages?.map((page, idx) => ({
        pageIndex: idx,
        itemIds: page.items?.map((item) => item.id) || [],
      })) || [],
    });
    
    // ID'ye göre unique item'ları filtrele
    const uniqueItems = allItems.filter((item, index, self) => 
      index === self.findIndex((t) => t.id === item.id)
    );
    
    // Detaylı log: Duplicate filter sonrası
    console.log('[FeedTab] Duplicate Filter Sonrası:', {
      allItemsCount: allItems.length,
      uniqueItemsCount: uniqueItems.length,
      duplicatesRemoved: allItems.length - uniqueItems.length,
      uniqueItemIds: uniqueItems.map((item) => item.id),
    });
    
    return uniqueItems;
  }, [data]);

  // Mapping sonuçlarını cache'le - her item için bir kez hesapla
  // Bu sayede React.memo düzgün çalışır (aynı referanslar)
  const mappedPosts = useMemo(() => {
    const mapped = posts.map((post) => {
      switch (post.type) {
        case CardType.EXPERIENCE:
          if ('contextData' in post && 'content' in post && Array.isArray(post.content)) {
            return {
              type: 'experience' as const,
              id: post.id,
              data: mapExperienceToCardData(post as ProfileReview),
            };
          }
          return null;
        case CardType.BENCHMARK:
          return {
            type: 'benchmark' as const,
            id: post.id,
            data: mapBenchmarkToCardData(post as BenchmarkApiItem),
          };
        case CardType.TIPS_AND_TRICKS:
          return {
            type: 'tips' as const,
            id: post.id,
            data: mapTipsToCardData(post as TipsApiItem),
          };
        case CardType.QUESTION:
          if ('contextType' in post && 'contextData' in post && 'isBoosted' in post) {
            return {
              type: 'question' as const,
              id: post.id,
              data: mapQuestionToCardData(post as QuestionApiItem),
            };
          }
          return null;
        case CardType.POST:
        default:
          return {
            type: 'post' as const,
            id: post.id,
            data: mapPostToCardData(post as ProfilePost),
          };
      }
    }).filter((item): item is NonNullable<typeof item> => item !== null);
    
    // Detaylı log: Mapping sonrası
    console.log('[FeedTab] Mapping Sonrası:', {
      postsCount: posts.length,
      mappedCount: mapped.length,
      mappedIds: mapped.map((item) => item.id),
    });
    
    return mapped;
  }, [posts]);

  // Duplicate key'leri önlemek için unique key oluştur
  const getItemKey = useCallback((item: MappedPost) => {
    return item.id;
  }, []);

  // onEndReached loop'unu önlemek için ref
  const isLoadingMoreRef = useRef(false);
  const lastItemsCountRef = useRef(0);

  // mappedPosts.length değiştiğinde lastItemsCountRef'i güncelle
  useEffect(() => {
    lastItemsCountRef.current = mappedPosts.length;
  }, [mappedPosts.length]);

  const handleLoadMore = useCallback(() => {
    // Eğer zaten yükleme yapılıyorsa veya item sayısı değişmediyse, tekrar tetikleme
    if (isLoadingMoreRef.current) {
      return;
    }

    // Eğer hasNextPage false ise veya zaten fetch yapılıyorsa, işlem yapma
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    // Flag'i set et
    isLoadingMoreRef.current = true;

    fetchNextPage()
      .finally(() => {
        // Fetch tamamlandığında flag'i reset et
        // Kısa bir delay ekle ki onEndReached tekrar tetiklenmesin
        setTimeout(() => {
          isLoadingMoreRef.current = false;
        }, 1000);
      });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, mappedPosts.length]);

  // Footer component'ini memoize et - isFetchingNextPage değişiklikleri render tetiklemez
  // ama footer'ı göstermek için değeri kullanabiliriz
  const LoadingFooter = React.memo(({ isFetching, isDark }: { isFetching: boolean; isDark: boolean }) => {
    if (!isFetching) return null;
    return (
      <Box py={20} alignItems="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  });

  const renderFooter = useCallback(() => {
    return <LoadingFooter isFetching={isFetchingNextPage} isDark={isDark} />;
  }, [isFetchingNextPage, isDark]);

  // Render item - artık mapping yapmıyoruz, sadece render ediyoruz
  // Mapping sonuçları zaten cache'lenmiş durumda
  const renderItem = useCallback(({ item }: { item: MappedPost }) => {
    switch (item.type) {
      case 'experience':
        return <ExperiencePostCard data={item.data} />;
      case 'benchmark':
        return <BenchmarkPostCard data={item.data} />;
      case 'tips':
        return <TipsAndTricksPostCard data={item.data} />;
      case 'question':
        return <QuestionPostCard data={item.data} />;
      case 'post':
      default:
        return <PostCard data={item.data} />;
    }
  }, []);

  // contentContainerStyle'ı memoize et - her render'da yeni obje oluşturulmasını önle
  const contentContainerStyle = useMemo(
    () => ({ paddingHorizontal: 16, paddingVertical: 8 }),
    []
  );

  // extraData için mappedPosts array'inin length'ini kullan
  // Array değiştiğinde length de değişir, bu yeterli
  // useMemo ile memoize et ki gereksiz re-render olmasın
  // ÖNEMLİ: Tüm hook'lar koşullu return'lerden ÖNCE çağrılmalı
  const flatListExtraData = useMemo(() => mappedPosts.length, [mappedPosts.length]);

  if (!userId) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          Kullanıcı bilgisi bulunamadı.
        </Text>
      </VStack>
    );
  }

  // isPending kontrolü - sadece ilk yükleme için (data yoksa)
  if (isPending && !data) {
    return (
      <VStack px={16} py={16} flex={1} justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mt="$2">
          Feed yükleniyor...
        </Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack px={16} py={16}>
        <Text color="#CE4A4A" fontSize="$sm">
          Feed yüklenirken bir hata oluştu: {error.message}
        </Text>
      </VStack>
    );
  }

  if (mappedPosts.length === 0) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          Henüz feed içeriği bulunmuyor.
        </Text>
      </VStack>
    );
  }

  return (
    <FlatList
      data={mappedPosts}
      renderItem={renderItem}
      keyExtractor={getItemKey}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      nestedScrollEnabled={true}
      scrollEnabled={false}
      // Performance optimizations
      initialNumToRender={3}
      maxToRenderPerBatch={3}
      windowSize={5}
      updateCellsBatchingPeriod={50}
      // extraData: mappedPosts değiştiğinde re-render et
      // Hash kullanarak sadece gerçekten değiştiğinde re-render olur
      extraData={flatListExtraData}
    />
  );
};
export const FeedTab = React.memo(FeedTabComponent);
export default FeedTab;