import React, { useCallback, useMemo } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { Box, VStack, Text } from '@gluestack-ui/themed';
import { Badge } from '@/src/mock/profile/badges/types';
import BadgeCard from '../BadgeCard';
import { useSafeAreaValues, toImageSource, useCurrentUserIdOrLogout } from '@/src/utils';
import { useUserCollectionBridges } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import type { BridgeBadgeApiItem } from '../../types';

interface BridgeBadgesTabProps {
  userId?: string;
  onBadgePress?: (badge: Badge) => void;
}

// Map BridgeBadgeApiItem to Badge format
const mapBridgeToBadge = (bridge: BridgeBadgeApiItem): Badge => {
  const imageSource = toImageSource(bridge.image) || require('@/assets/badges/badge_01.png');
  
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
}) => {
  const bottomInset = useSafeAreaValues('bottom');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const currentUserId = useCurrentUserIdOrLogout();
  const targetUserId = userId || currentUserId;

  // User Collection Bridges API hook with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useUserCollectionBridges(targetUserId, 20);

  // Flatten all pages into a single array - useMemo ile memoize et
  const bridges = useMemo(() => {
    if (!data?.pages) return [];
    const allItems = data.pages.flatMap((page) => page.items ?? []);
    // ID'ye göre unique item'ları filtrele
    const uniqueItems = allItems.filter((item, index, self) => 
      index === self.findIndex((t) => t.id === item.id)
    );
    return uniqueItems;
  }, [data]);

  // Map bridges to Badge format
  const mappedBadges = useMemo(() => {
    return bridges.map(mapBridgeToBadge);
  }, [bridges]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Footer için activity indicator
  const activityIndicatorColor = useMemo(() => isDark ? '#FFFFFF' : '#000000', [isDark]);

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <Box py={20} alignItems="center">
        <ActivityIndicator size="small" color={activityIndicatorColor} />
      </Box>
    );
  }, [isFetchingNextPage, activityIndicatorColor]);

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

  // Loading state
  if (isLoading && !data) {
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
          Henüz bridge badge bulunmuyor.
        </Text>
      </VStack>
    );
  }

  return (
    <FlatList
      data={mappedBadges}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={{
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: bottomInset,
      }}
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.1}
      ListFooterComponent={renderFooter}
      removeClippedSubviews={true}
      // Performance optimizations
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      updateCellsBatchingPeriod={50}
    />
  );
};

export default BridgeBadgesTab;

