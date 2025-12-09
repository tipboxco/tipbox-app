import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { VStack, Text, Box } from '@gluestack-ui/themed';
import { ExperiencePostCard } from '@/src/components/PostCards/ExperiencePostCard';
import { useUserReviews } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useCurrentUserIdOrLogout, toImageSource } from '@/src/utils';
import type { ReviewCardData, ReviewCardContentItem } from '@/src/types/ReviewsCard';
import type { ProfileReview } from '../../types';

const mapReviewToCardData = (review: ProfileReview): ReviewCardData => {
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
    // En fazla 3 tag göster
    tags: review.tags?.slice(0, 3) ?? [],
    images:
      review.images
        ?.map((img) => toImageSource(img))
        .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [],
    stats: review.stats,
    createdAt: review.createdAt,
  };
};

const ReviewsTabComponent = () => {
  const userId = useCurrentUserIdOrLogout();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Render sayısını takip et ve değişen değerleri log'la
  const renderCountRef = useRef(0);
  const prevValuesRef = useRef<any>({});
  
  // Reviews API hook with infinite scroll
  const {
    data: reviewsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useUserReviews(userId, 5);

  useEffect(() => {
    renderCountRef.current += 1;
    const currentValues = {
      userId,
      colorMode,
      dataPagesCount: reviewsData?.pages?.length,
      hasNextPage,
      isFetchingNextPage,
      isLoading,
      error: error?.message,
    };
    
    const changedValues: string[] = [];
    Object.keys(currentValues).forEach((key) => {
      const typedKey = key as keyof typeof currentValues;
      if (prevValuesRef.current[typedKey] !== currentValues[typedKey]) {
        changedValues.push(`${key}: ${prevValuesRef.current[typedKey]} → ${currentValues[typedKey]}`);
      }
    });
    
    console.log(`[ReviewsTab] Render #${renderCountRef.current}`, {
      changed: changedValues.length > 0 ? changedValues : ['No changes detected'],
      current: currentValues,
    });
    
    prevValuesRef.current = currentValues;
  });

  // Flatten all pages into a single array - Duplicate ID'leri filtrele
  const reviews = useMemo(() => {
    if (!reviewsData?.pages) return [];
    const allItems = reviewsData.pages.flatMap((page) => page.items ?? []);
    
    // Detaylı log: Duplicate filter öncesi
    console.log('[ReviewsTab] Duplicate Filter Öncesi:', {
      pagesCount: reviewsData.pages.length,
      allItemsCount: allItems.length,
      allItemIds: allItems.map((item) => item.id),
      pagesItemIds: reviewsData.pages.map((page, idx) => ({
        pageIndex: idx,
        itemIds: page.items?.map((item) => item.id) || [],
      })),
    });
    
    // ID'ye göre unique item'ları filtrele
    const uniqueItems = allItems.filter((item, index, self) => 
      index === self.findIndex((t) => t.id === item.id)
    );
    
    // Detaylı log: Duplicate filter sonrası
    console.log('[ReviewsTab] Duplicate Filter Sonrası:', {
      allItemsCount: allItems.length,
      uniqueItemsCount: uniqueItems.length,
      duplicatesRemoved: allItems.length - uniqueItems.length,
      uniqueItemIds: uniqueItems.map((item) => item.id),
    });
    
    return uniqueItems;
  }, [reviewsData]);

  const mappedReviews = useMemo(() => {
    if (!reviews || !Array.isArray(reviews)) return [];
    const mapped = reviews.map(mapReviewToCardData);
    
    // Detaylı log: Mapping sonrası
    console.log('[ReviewsTab] Mapping Sonrası:', {
      reviewsCount: reviews.length,
      mappedCount: mapped.length,
      mappedIds: mapped.map((item) => item.id),
    });
    
    return mapped;
  }, [reviews]);

  // onEndReached loop'unu önlemek için ref
  const isLoadingMoreRef = useRef(false);

  // mappedReviews.length değiştiğinde ref'i güncelle
  useEffect(() => {
    // Item sayısı değiştiğinde flag'i reset et (yeni veri geldi demektir)
    isLoadingMoreRef.current = false;
  }, [mappedReviews.length]);

  const handleLoadMore = useCallback(() => {
    // Eğer zaten yükleme yapılıyorsa, tekrar tetikleme
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, mappedReviews.length]);

  // Footer component'ini memoize et
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

  if (!userId) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          Kullanıcı bilgisi bulunamadı.
        </Text>
      </VStack>
    );
  }

  if (isLoading && reviews.length === 0) {
    return (
      <VStack px={16} py={16} flex={1} justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mt="$2">
          Reviews yükleniyor...
        </Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack px={16} py={16}>
        <Text color="#CE4A4A" fontSize="$sm">
          Reviews yüklenirken bir hata oluştu: {error.message}
        </Text>
      </VStack>
    );
  }

  if (mappedReviews.length === 0) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          Henüz review bulunmuyor.
        </Text>
      </VStack>
    );
  }

  return (
    <FlatList
      data={mappedReviews}
      renderItem={({ item }) => <ExperiencePostCard data={item} />}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
      scrollEnabled={false}
      removeClippedSubviews={true}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
    />
  );
};

export const ReviewsTab = React.memo(ReviewsTabComponent);
export default ReviewsTab;