import React, { useCallback, useMemo } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { Box, VStack, Text } from '@gluestack-ui/themed';
import { Badge } from '@/src/mock/profile/badges/types';
import BadgeCard from '../BadgeCard';
import { useSafeAreaValues, toImageSource, useCurrentUserIdOrLogout } from '@/src/utils';
import { useUserCollectionBridges } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import type { CollectionBadgeApiItem } from '../../types';

interface AchievementBadgesTabProps {
  userId?: string;
  onBadgePress?: (badge: Badge) => void;
  searchQuery?: string;
  mainCategoryId?: string;
  subCategoryId?: string;
}

// Map CollectionBadgeApiItem to Badge format
const mapAchievementToBadge = (item: CollectionBadgeApiItem): Badge => {
  const imageSource = toImageSource(item.image ?? '') || require('@/assets/defaultImages/default-badge.png');

  return {
    id: item.id,
    title: item.title,
    icon: imageSource,
    rarity: item.rarity,
    category: item.category === 'event' ? 'event' : 'collection',
    earnedDate: item.earnedDate,
    totalEarned: item.totalEarned,
    isClaimed: item.isClaimed,
    nftAddress: item.nftAddress,
    tasks: item.tasks,
  };
};

export const AchievementBadgesTab: React.FC<AchievementBadgesTabProps> = ({
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

  const ACHIEVEMENTS_PER_PAGE = 10;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useUserCollectionBridges(targetUserId, ACHIEVEMENTS_PER_PAGE, searchQuery, mainCategoryId, subCategoryId);

  // Flatten achievement.items from all pages
  const achievements = useMemo(() => {
    if (!data?.pages) return [];

    const allItems = data.pages.flatMap((page) => page.achievement?.items ?? []);

    const uniqueItemsMap = new Map<string, CollectionBadgeApiItem>();
    for (const item of allItems) {
      if (!uniqueItemsMap.has(item.id)) {
        uniqueItemsMap.set(item.id, item);
      }
    }

    return Array.from(uniqueItemsMap.values()).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.earnedDate ? new Date(a.earnedDate).getTime() : 0);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.earnedDate ? new Date(b.earnedDate).getTime() : 0);
      return dateB - dateA;
    });
  }, [data]);

  // Map achievements to Badge format
  const mappedBadges = useMemo(() => {
    return achievements.map(mapAchievementToBadge);
  }, [achievements]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  const keyExtractor = useCallback((item: Badge) => item.id, []);

  const contentContainerStyle = useMemo(() => ({
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: bottomInset + 8,
  }), [bottomInset]);

  const columnWrapperStyle = useMemo(() => ({
    justifyContent: 'space-between' as const,
  }), []);

  // Loading state
  const hasCachedData = Boolean(data?.pages?.length);
  if (isLoading && !hasCachedData) {
    return (
      <VStack px={16} py={16} flex={1} justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mt="$2">
          {t('tabStates.achievements.loading')}
        </Text>
      </VStack>
    );
  }

  // Error state
  if (error) {
    return (
      <VStack px={16} py={16}>
        <Text color="#CE4A4A" fontSize="$sm">
          {t('tabStates.achievements.error', { message: error.message })}
        </Text>
      </VStack>
    );
  }

  // Empty state
  if (mappedBadges.length === 0) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          {t('tabStates.achievements.empty')}
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


export default AchievementBadgesTab;
