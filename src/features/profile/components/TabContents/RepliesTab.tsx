import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { VStack, Text, Box } from '@gluestack-ui/themed';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import { useUserReplies } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useCurrentUserIdOrLogout, toImageSource } from '@/src/utils';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { ProfileReplies } from '../../types';

const mapQuestionToCardData = (item: ProfileReplies): QuestionCardData => {
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

const RepliesTabComponent = () => {
  const userId = useCurrentUserIdOrLogout();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  // Render sayısını takip et ve değişen değerleri log'la
  const renderCountRef = useRef(0);
  const prevValuesRef = useRef<any>({});
  
  // Replies API hook with infinite scroll
  const {
    data: repliesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useUserReplies(userId, 5);

  useEffect(() => {
    renderCountRef.current += 1;
    const currentValues = {
      userId,
      colorMode,
      dataPagesCount: repliesData?.pages?.length,
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
    
    console.log(`[RepliesTab] Render #${renderCountRef.current}`, {
      changed: changedValues.length > 0 ? changedValues : ['No changes detected'],
      current: currentValues,
    });
    
    prevValuesRef.current = currentValues;
  });

  // Flatten all pages into a single array - Duplicate ID'leri filtrele
  const replies = useMemo(() => {
    if (!repliesData?.pages) return [];
    const allItems = repliesData.pages.flatMap((page) => page.items ?? []);
    
    // Detaylı log: Duplicate filter öncesi
    console.log('[RepliesTab] Duplicate Filter Öncesi:', {
      pagesCount: repliesData.pages.length,
      allItemsCount: allItems.length,
      allItemIds: allItems.map((item) => item.id),
      pagesItemIds: repliesData.pages.map((page, idx) => ({
        pageIndex: idx,
        itemIds: page.items?.map((item) => item.id) || [],
      })),
    });
    
    // ID'ye göre unique item'ları filtrele
    const uniqueItems = allItems.filter((item, index, self) => 
      index === self.findIndex((t) => t.id === item.id)
    );
    
    // Detaylı log: Duplicate filter sonrası
    console.log('[RepliesTab] Duplicate Filter Sonrası:', {
      allItemsCount: allItems.length,
      uniqueItemsCount: uniqueItems.length,
      duplicatesRemoved: allItems.length - uniqueItems.length,
      uniqueItemIds: uniqueItems.map((item) => item.id),
    });
    
    return uniqueItems;
  }, [repliesData]);

  const mappedReplies = useMemo(() => {
    if (!replies || !Array.isArray(replies)) return [];
    const mapped = replies.map(mapQuestionToCardData);
    
    // Detaylı log: Mapping sonrası
    console.log('[RepliesTab] Mapping Sonrası:', {
      repliesCount: replies.length,
      mappedCount: mapped.length,
      mappedIds: mapped.map((item) => item.id),
    });
    
    return mapped;
  }, [replies]);

  // onEndReached loop'unu önlemek için ref
  const isLoadingMoreRef = useRef(false);

  // mappedReplies.length değiştiğinde ref'i güncelle
  useEffect(() => {
    // Item sayısı değiştiğinde flag'i reset et (yeni veri geldi demektir)
    isLoadingMoreRef.current = false;
  }, [mappedReplies.length]);

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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, mappedReplies.length]);

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

  // CACHE FIX: Only show loading when loading and no cached data
  if (isLoading && !data?.pages?.[0]) {
    return (
      <VStack px={16} py={16} flex={1} justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mt="$2">
          Replies yükleniyor...
        </Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack px={16} py={16}>
        <Text color="#CE4A4A" fontSize="$sm">
          Replies yüklenirken bir hata oluştu: {error.message}
        </Text>
      </VStack>
    );
  }

  if (mappedReplies.length === 0) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          No replies yet.
        </Text>
      </VStack>
    );
  }

  return (
    <FlatList
      data={mappedReplies}
      renderItem={({ item }) => <QuestionPostCard data={item} />}
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

export const RepliesTab = React.memo(RepliesTabComponent);
export default RepliesTab;