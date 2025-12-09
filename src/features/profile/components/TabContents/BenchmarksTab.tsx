import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { VStack, Text, Box } from '@gluestack-ui/themed';
import { BenchmarkPostCard } from '@/src/components/PostCards/BenchmarkPostCard';
import { useUserBenchmarks } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useCurrentUserIdOrLogout, toImageSource } from '@/src/utils';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { ProfileBenchmark } from '../../types';

const mapBenchmarkToCardData = (item: ProfileBenchmark): BenchmarkCardData => {
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

const BenchmarksTabComponent = () => {
  const userId = useCurrentUserIdOrLogout();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Render sayısını takip et ve değişen değerleri log'la
  const renderCountRef = useRef(0);
  const prevValuesRef = useRef<any>({});
  
  // Benchmarks API hook with infinite scroll
  const {
    data: benchmarksData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useUserBenchmarks(userId, 5);

  useEffect(() => {
    renderCountRef.current += 1;
    const currentValues = {
      userId,
      colorMode,
      dataPagesCount: benchmarksData?.pages?.length,
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
    
    console.log(`[BenchmarksTab] Render #${renderCountRef.current}`, {
      changed: changedValues.length > 0 ? changedValues : ['No changes detected'],
      current: currentValues,
    });
    
    prevValuesRef.current = currentValues;
  });

  // Flatten all pages into a single array - Duplicate ID'leri filtrele
  // (cursor pagination'da aynı item tekrar gelebilir veya backend duplicate döndürebilir)
  const benchmarks = useMemo(() => {
    if (!benchmarksData?.pages) return [];
    const allItems = benchmarksData.pages.flatMap((page) => page.items ?? []);
    
    // Detaylı log: Duplicate filter öncesi
    console.log('[BenchmarksTab] Duplicate Filter Öncesi:', {
      pagesCount: benchmarksData.pages.length,
      allItemsCount: allItems.length,
      allItemIds: allItems.map((item) => item.id),
      pagesItemIds: benchmarksData.pages.map((page, idx) => ({
        pageIndex: idx,
        itemIds: page.items?.map((item) => item.id) || [],
      })),
    });
    
    // ID'ye göre unique item'ları filtrele
    const uniqueItems = allItems.filter((item, index, self) => 
      index === self.findIndex((t) => t.id === item.id)
    );
    
    // Detaylı log: Duplicate filter sonrası
    console.log('[BenchmarksTab] Duplicate Filter Sonrası:', {
      allItemsCount: allItems.length,
      uniqueItemsCount: uniqueItems.length,
      duplicatesRemoved: allItems.length - uniqueItems.length,
      uniqueItemIds: uniqueItems.map((item) => item.id),
    });
    
    return uniqueItems;
  }, [benchmarksData]);

  const mappedBenchmarks = useMemo(() => {
    if (!benchmarks || !Array.isArray(benchmarks)) return [];
    const mapped = benchmarks.map(mapBenchmarkToCardData);
    
    // Detaylı log: Mapping sonrası
    console.log('[BenchmarksTab] Mapping Sonrası:', {
      benchmarksCount: benchmarks.length,
      mappedCount: mapped.length,
      mappedIds: mapped.map((item) => item.id),
    });
    
    return mapped;
  }, [benchmarks]);

  // onEndReached loop'unu önlemek için ref
  const isLoadingMoreRef = useRef(false);

  // mappedBenchmarks.length değiştiğinde ref'i güncelle
  useEffect(() => {
    // Item sayısı değiştiğinde flag'i reset et (yeni veri geldi demektir)
    isLoadingMoreRef.current = false;
  }, [mappedBenchmarks.length]);

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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, mappedBenchmarks.length]);

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

  if (isLoading && benchmarks.length === 0) {
    return (
      <VStack px={16} py={16} flex={1} justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mt="$2">
          Benchmarks yükleniyor...
        </Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack px={16} py={16}>
        <Text color="#CE4A4A" fontSize="$sm">
          Benchmarks yüklenirken bir hata oluştu: {error.message}
        </Text>
      </VStack>
    );
  }

  if (mappedBenchmarks.length === 0) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          Henüz benchmark bulunmuyor.
        </Text>
      </VStack>
    );
  }

  return (
    <FlatList
      data={mappedBenchmarks}
      renderItem={({ item }) => <BenchmarkPostCard data={item} />}
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

export const BenchmarksTab = React.memo(BenchmarksTabComponent);
export default BenchmarksTab;