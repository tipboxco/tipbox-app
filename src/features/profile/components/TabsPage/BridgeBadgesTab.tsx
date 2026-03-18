import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { Box, VStack, Text } from '@gluestack-ui/themed';
import { Badge } from '@/src/mock/profile/badges/types';
import BadgeCard from '../BadgeCard';
import { useSafeAreaValues, toImageSource, useCurrentUserIdOrLogout } from '@/src/utils';
import { useUserCollectionBridges } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import type { CollectionBadgeApiItem } from '../../types';

interface BridgeBadgesTabProps {
  userId?: string;
  onBadgePress?: (badge: Badge) => void;
  searchQuery?: string;
  mainCategoryId?: string;
  subCategoryId?: string;
}

// Map BridgeBadgeApiItem to Badge format
const mapBridgeToBadge = (bridge: CollectionBadgeApiItem): Badge => {
  const imageSource = toImageSource(bridge.image ?? '') || require('@/assets/defaultImages/default-badge.png');

  return {
    id: bridge.id,
    title: bridge.title,
    icon: imageSource,
    rarity: bridge.rarity,
    category: 'brand',
    earnedDate: bridge.earnedDate,
    totalEarned: bridge.totalEarned,
    isClaimed: bridge.isClaimed,
    nftAddress: bridge.nftAddress,
    tasks: bridge.tasks,
  };
};

export const BridgeBadgesTab: React.FC<BridgeBadgesTabProps> = ({
  userId,
  onBadgePress,
  searchQuery,
  mainCategoryId,
  subCategoryId,
}) => {
  const bottomInset = useSafeAreaValues('bottom');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('profile');
  const currentUserId = useCurrentUserIdOrLogout();
  const targetUserId = userId || currentUserId;

  const BRIDGES_PER_PAGE = 10;

  const queryResult = useUserCollectionBridges(targetUserId, BRIDGES_PER_PAGE, searchQuery, mainCategoryId, subCategoryId);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = queryResult;

  // hasNextPage false olduğunda bir kere denemek için ref
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (hasNextPage) {
      hasAttemptedRef.current = false;
    }
  }, [hasNextPage]);

  // Flatten brand.items from all pages
  const bridges = useMemo(() => {
    if (!data?.pages) return [];

    const allItems = data.pages.flatMap((page) => page.brand?.items ?? []);

    const uniqueItemsMap = new Map<string, CollectionBadgeApiItem>();
    for (const item of allItems) {
      const existing = uniqueItemsMap.get(item.id);
      const itemDate = item.earnedDate ? new Date(item.earnedDate).getTime() : 0;
      const existingDate = existing?.earnedDate ? new Date(existing.earnedDate).getTime() : 0;
      if (!existing || itemDate > existingDate) {
        uniqueItemsMap.set(item.id, item);
      }
    }

    return Array.from(uniqueItemsMap.values()).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.earnedDate ? new Date(a.earnedDate).getTime() : 0);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.earnedDate ? new Date(b.earnedDate).getTime() : 0);
      return dateB - dateA;
    });
  }, [data]);

  // Map bridges to Badge format
  const mappedBadges = useMemo(() => {
    return bridges.map(mapBridgeToBadge);
  }, [bridges]);

  const [isManuallyLoading, setIsManuallyLoading] = useState(false);

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage && hasAttemptedRef.current) {
      return;
    }

    if (isFetchingNextPage || isManuallyLoading) {
      return;
    }

    if (!hasNextPage) {
      hasAttemptedRef.current = true;
    }

    setIsManuallyLoading(true);

    fetchNextPage()
      .then(() => {
        setIsManuallyLoading(false);
      })
      .catch(() => {
        setIsManuallyLoading(false);
      });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isManuallyLoading]);

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

  const contentContainerStyle = useMemo(() => ({
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: bottomInset + 8,
  }), [bottomInset]);

  const columnWrapperStyle = useMemo(() => ({
    justifyContent: 'space-between' as const,
  }), []);

  // Loading state
  if (isLoading && !data?.pages?.[0]) {
    return (
      <VStack px={16} py={16} flex={1} justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mt="$2">
          {t('tabStates.bridgeBadges.loading')}
        </Text>
      </VStack>
    );
  }

  // Error state
  if (error) {
    return (
      <VStack px={16} py={16}>
        <Text color="#CE4A4A" fontSize="$sm">
          {t('tabStates.bridgeBadges.error', { message: error.message })}
        </Text>
      </VStack>
    );
  }

  // Empty state
  if (mappedBadges.length === 0) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          {t('tabStates.bridgeBadges.empty')}
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
      columnWrapperStyle={columnWrapperStyle}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.3}
      ListFooterComponent={renderFooter}
    />
  );
};

export default BridgeBadgesTab;
