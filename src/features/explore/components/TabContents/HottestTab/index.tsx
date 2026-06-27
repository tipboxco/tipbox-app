import React, { useCallback, useMemo, useRef } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { FeedSkeleton } from '@/src/components/Skeletons';
import { FeedItemCard } from '../../FeedItemCard';
import { useHottest } from '../../../api/hooks';
import { useBottomOffset } from '@/src/utils';
import type { FeedApiItem } from '@/src/features/feed/api/feedApi';

interface HottestTabProps {
  searchQuery?: string;
  headerComponent?: React.ReactElement | null;
}

const HottestTabComponent: React.FC<HottestTabProps> = ({ searchQuery, headerComponent }) => {
  const { colorMode } = useColorMode();
  const { t } = useTranslation('explore');
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
  } = useHottest(5, searchQuery);

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

  // CACHE-FIRST: Sadece cache'de veri yoksa hata göster, varsa cache'den göster
  if (error && !data?.pages?.[0]) {
    return (
      <Box py="$8" alignItems="center">
        <Text color={isDark ? '#FFFFFF' : '#000000'}>
          {t('hottest.error')}
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
                  {t('hottest.empty')}
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
    <Box flex={1} pt={0} mt={0} bg={isDark ? '$backgroundDark950' : '#F5F5F5'}>
      <FlatList
        data={hottestItems}
        renderItem={({ item }) => <FeedItemCard item={item} />}
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
