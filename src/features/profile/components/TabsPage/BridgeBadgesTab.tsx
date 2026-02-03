import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { Box, VStack, Text } from '@gluestack-ui/themed';
import { Badge } from '@/src/mock/profile/badges/types';
import BadgeCard from '../BadgeCard';
import { useSafeAreaValues, toImageSource, useCurrentUserIdOrLogout } from '@/src/utils';
import { useUserCollectionBridges } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import type { CollectionBadgeApiItem } from '../../types';

interface BridgeBadgesTabProps {
  userId?: string;
  onBadgePress?: (badge: Badge) => void;
  searchQuery?: string;
}

// Map BridgeBadgeApiItem to Badge format
const mapBridgeToBadge = (bridge: CollectionBadgeApiItem): Badge => {
  const imageSource = toImageSource(bridge.image ?? '') || require('@/assets/defaultImages/default-badge.png');
  
  return {
    id: bridge.id,
    title: bridge.title,
    icon: imageSource,
    rarity: bridge.rarity,
    category: 'bridge',
  };
};

export const BridgeBadgesTab: React.FC<BridgeBadgesTabProps> = ({
  userId,
  onBadgePress,
  searchQuery,
}) => {
  const bottomInset = useSafeAreaValues('bottom');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const currentUserId = useCurrentUserIdOrLogout();
  const targetUserId = userId || currentUserId;

  // Her sayfada 10'ar bridge badge getirilecek
  const BRIDGES_PER_PAGE = 10;

  // User Collection Bridges API hook with infinite scroll
  const queryResult = useUserCollectionBridges(targetUserId, BRIDGES_PER_PAGE, searchQuery);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    isFetching,
    isRefetching,
    status,
    fetchStatus,
  } = queryResult;

  // hasNextPage false olduğunda bir kere denemek için ref
  const hasAttemptedRef = useRef(false);
  
  // hasNextPage değiştiğinde ref'i reset et (sadece true olduğunda)
  useEffect(() => {
    if (hasNextPage) {
      hasAttemptedRef.current = false;
    }
  }, [hasNextPage]);

  // Flatten brand.items from all pages (GET /users/:id/collections/bridges → response.brand.items)
  const bridges = useMemo(() => {
    if (!data?.pages) return [];

    const allItems = data.pages.flatMap((page) => page.brand?.items ?? []);

    // ID'ye göre unique; en son kazanılanı tut (earnedDate'e göre)
    const uniqueItemsMap = new Map<string, CollectionBadgeApiItem>();
    for (const item of allItems) {
      const existing = uniqueItemsMap.get(item.id);
      const itemDate = item.earnedDate ? new Date(item.earnedDate).getTime() : 0;
      const existingDate = existing?.earnedDate ? new Date(existing.earnedDate).getTime() : 0;
      if (!existing || itemDate > existingDate) {
        uniqueItemsMap.set(item.id, item);
      }
    }

    return Array.from(uniqueItemsMap.values());
  }, [data]);

  // Map bridges to Badge format
  const mappedBadges = useMemo(() => {
    return bridges.map(mapBridgeToBadge);
  }, [bridges]);


  // Loading state için state - scroll yaptığında loading gösterilsin
  const [isManuallyLoading, setIsManuallyLoading] = useState(false);

  const handleLoadMore = useCallback(() => {
    // Eğer hasNextPage false ise ve daha önce denemediysek, bir kere dene
    if (!hasNextPage && hasAttemptedRef.current) {
      return;
    }
    
    // Eğer zaten fetch yapılıyorsa veya manuel loading yapılıyorsa, skip
    if (isFetchingNextPage || isManuallyLoading) {
      return;
    }
    
    // hasNextPage false ise, bir kere denemek için flag set et
    if (!hasNextPage) {
      hasAttemptedRef.current = true;
    }
    
    setIsManuallyLoading(true);
    
    fetchNextPage()
      .then(() => {
        setIsManuallyLoading(false);
      })
      .catch((error) => {
        setIsManuallyLoading(false);
      });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isManuallyLoading]);

  // Footer için activity indicator - scroll yaptığında veya fetch yapılırken göster
  const activityIndicatorColor = useMemo(() => isDark ? '#FFFFFF' : '#000000', [isDark]);
  const showLoading = isFetchingNextPage || isManuallyLoading;

  const renderFooter = useCallback(() => {
    if (!showLoading) return null;
    return (
      <Box py={20} alignItems="center">
        <ActivityIndicator size="small" color={activityIndicatorColor} />
      </Box>
    );
  }, [showLoading, activityIndicatorColor]);
  
  // FlatList için keyExtractor - memoize et
  const keyExtractor = useCallback((item: Badge) => item.id, []);

  const renderItem = useCallback(({ item }: { item: Badge }) => {
    return (
      <Box width="50%" p="$2">
        <BadgeCard
          badge={item}
          onPress={() => onBadgePress?.(item)}
        />
      </Box>
    );
  }, [onBadgePress]);

  // contentContainerStyle - memoize et (early return'lerden ÖNCE olmalı!)
  const contentContainerStyle = useMemo(() => ({
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: bottomInset + 8,
  }), [bottomInset]);
  
  // columnWrapperStyle - memoize et (early return'lerden ÖNCE olmalı!)
  const columnWrapperStyle = useMemo(() => ({
    justifyContent: 'space-between' as const,
  }), []);

  // Loading state
  // CACHE FIX: Only show loading when loading and no cached data
  if (isLoading && !data?.pages?.[0]) {
    return (
      <VStack px={16} py={16} flex={1} justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mt="$2">
          Bridge badges yükleniyor...
        </Text>
      </VStack>
    );
  }

  // Error state
  if (error) {
    return (
      <VStack px={16} py={16}>
        <Text color="#CE4A4A" fontSize="$sm">
          Bridge badges yüklenirken bir hata oluştu: {error.message}
        </Text>
      </VStack>
    );
  }

  // Empty state
  if (mappedBadges.length === 0) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          No bridge badges yet.
        </Text>
      </VStack>
    );
  }

  return (
    <FlatList
      data={mappedBadges}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={2}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={columnWrapperStyle}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.1}
      ListFooterComponent={renderFooter}
      removeClippedSubviews={false}
      // Performance optimizations
      initialNumToRender={6}
      maxToRenderPerBatch={6}
      windowSize={5}
    />
  );
};

export default BridgeBadgesTab;

