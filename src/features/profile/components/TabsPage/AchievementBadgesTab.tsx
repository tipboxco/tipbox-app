import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { Box, VStack, Text } from '@gluestack-ui/themed';
import { Badge } from '@/src/mock/profile/badges/types';
import BadgeCard from '../BadgeCard';
import { useSafeAreaValues, toImageSource, useCurrentUserIdOrLogout } from '@/src/utils';
import { useUserCollectionAchievements } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import type { AchievementApiItem } from '@/src/features/events/types';

interface AchievementBadgesTabProps {
  userId?: string;
  onBadgePress?: (badge: Badge) => void;
}

// Map AchievementApiItem to Badge format
const mapAchievementToBadge = (achievement: AchievementApiItem): Badge => {
  const imageSource = toImageSource(achievement.image) || require('@/assets/badges/badge_01.png');
  
  // Rarity belirleme - status'a göre veya default 'Usual'
  // API'den rarity gelmiyorsa, completed durumuna göre belirleyebiliriz
  let rarity: 'Usual' | 'Rare' | 'Epic' | 'Legendary' = 'Usual';
  if (achievement.status === 'completed') {
    // Completed achievement'lar için rarity belirleme mantığı
    // Şimdilik default 'Usual', ileride API'den gelebilir
    rarity = 'Usual';
  }

  return {
    id: achievement.id,
    title: achievement.title,
    icon: imageSource,
    rarity,
    category: 'achievement',
  };
};

export const AchievementBadgesTab: React.FC<AchievementBadgesTabProps> = ({
  userId,
  onBadgePress,
}) => {
  const bottomInset = useSafeAreaValues('bottom');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const currentUserId = useCurrentUserIdOrLogout();
  const targetUserId = userId || currentUserId;

  // Her sayfada 3'er achievement getirilecek
  const ACHIEVEMENTS_PER_PAGE = 4;

  // User Collection Achievements API hook with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isPending,
    error,
  } = useUserCollectionAchievements(targetUserId, ACHIEVEMENTS_PER_PAGE);

  // Flatten all pages into a single array - useMemo ile memoize et
  const achievements = useMemo(() => {
    if (!data?.pages) return [];
    
    // Her sayfadaki item'ları logla
    console.log('[AchievementBadgesTab] Pages Data:', {
      totalPages: data.pages.length,
      pagesDetail: data.pages.map((page, index) => ({
        pageIndex: index,
        itemsCount: page.items?.length || 0,
        itemIds: page.items?.map((item: any) => item.id) || [],
      })),
    });
    
    const allItems = data.pages.flatMap((page) => page.items ?? []);
    
    console.log('[AchievementBadgesTab] All Items Before Filtering:', {
      totalItems: allItems.length,
      allItemIds: allItems.map((item: any) => item.id),
    });
    
    // ID'ye göre unique item'ları filtrele
    const uniqueItems = allItems.filter((item, index, self) => 
      index === self.findIndex((t) => t.id === item.id)
    );
    
    const duplicates = allItems.length - uniqueItems.length;
    
    console.log('[AchievementBadgesTab] After Duplicate Filtering:', {
      totalItemsBefore: allItems.length,
      uniqueItemsCount: uniqueItems.length,
      duplicatesRemoved: duplicates,
      uniqueItemIds: uniqueItems.map((item: any) => item.id),
    });
    
    return uniqueItems;
  }, [data]);

  // Map achievements to Badge format
  const mappedBadges = useMemo(() => {
    const badges = achievements.map(mapAchievementToBadge);
    
    console.log('[AchievementBadgesTab] Mapped Badges:', {
      badgesCount: badges.length,
      badgeIds: badges.map((badge) => badge.id),
    });
    
    return badges;
  }, [achievements]);

  // onEndReached loop'unu önlemek için ref
  const isLoadingMoreRef = useRef(false);
  const lastItemsCountRef = useRef(0);

  // mappedBadges.length değiştiğinde lastItemsCountRef'i güncelle
  useEffect(() => {
    lastItemsCountRef.current = mappedBadges.length;
  }, [mappedBadges.length]);

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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, mappedBadges.length]);

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

  // Loading state - isLoading kullan çünkü infinite query'de isPending sadece ilk fetch için true olur
  if (isLoading && !data) {
    return (
      <VStack px={16} py={16} flex={1} justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mt="$2">
          Achievements yükleniyor...
        </Text>
      </VStack>
    );
  }

  // Error state
  if (error) {
    return (
      <VStack px={16} py={16}>
        <Text color="#CE4A4A" fontSize="$sm">
          Achievements yüklenirken bir hata oluştu: {error.message}
        </Text>
      </VStack>
    );
  }

  // Empty state
  if (mappedBadges.length === 0) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          Henüz achievement bulunmuyor.
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
      onEndReachedThreshold={0.5}
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

export default AchievementBadgesTab;

