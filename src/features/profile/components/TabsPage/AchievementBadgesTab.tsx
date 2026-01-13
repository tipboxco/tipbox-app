import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { Box, VStack, Text, Modal, ModalBackdrop, ModalContent } from '@gluestack-ui/themed';
import { Badge } from '@/src/mock/profile/badges/types';
import BadgeCard from '../BadgeCard';
import BadgeBottomSheet from '@/src/features/events/components/BadgeBottomSheet';
import { useSafeAreaValues, toImageSource, useCurrentUserIdOrLogout } from '@/src/utils';
import { useUserCollectionAchievements } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import type { AchievementApiItem } from '@/src/features/events/types';

interface AchievementBadgesTabProps {
  userId?: string;
  onBadgePress?: (badge: Badge) => void;
  searchQuery?: string;
}

// Map AchievementApiItem to Badge format
const mapAchievementToBadge = (achievement: AchievementApiItem): Badge => {
  const imageSource = toImageSource(achievement.image) || require('@/assets/defaultImages/default-badge.png');
  
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
  searchQuery,
}) => {
  const bottomInset = useSafeAreaValues('bottom');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const currentUserId = useCurrentUserIdOrLogout();
  const targetUserId = userId || currentUserId;
  const [selectedBadge, setSelectedBadge] = useState<SeeAllReward | null>(null);

  // Her sayfada 10'ar achievement getirilecek
  const ACHIEVEMENTS_PER_PAGE = 10;

  // User Collection Achievements API hook with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useUserCollectionAchievements(targetUserId, ACHIEVEMENTS_PER_PAGE, searchQuery);

  // Flatten all pages into a single array - useMemo ile memoize et
  const achievements = useMemo(() => {
    if (!data || !('pages' in data) || !data.pages) return [];
    
    const allItems = data.pages.flatMap((page) => page.items ?? []);
    
    // ID'ye göre unique item'ları filtrele (cursor pagination'da aynı item tekrar gelebilir)
    const uniqueItemsMap = new Map<string, AchievementApiItem>();
    for (const item of allItems) {
      if (!uniqueItemsMap.has(item.id)) {
        uniqueItemsMap.set(item.id, item);
      }
    }
    
    return Array.from(uniqueItemsMap.values());
  }, [data]);

  // Map achievements to Badge format
  const mappedBadges = useMemo(() => {
    return achievements.map(mapAchievementToBadge);
  }, [achievements]);

  // Console log: API'den gelen veriyi göster
  useEffect(() => {
    if (data?.pages) {
      console.log('[AchievementBadgesTab] ========================================');
      console.log('[AchievementBadgesTab] API Response Data:');
      console.log('[AchievementBadgesTab] Total Pages:', data.pages.length);
      
      data.pages.forEach((page, pageIndex) => {
        console.log(`[AchievementBadgesTab] Page ${pageIndex + 1}:`, {
          itemsCount: page.items?.length || 0,
          pagination: page.pagination,
          items: page.items?.map((item) => ({
            id: item.id,
            title: item.title,
            image: item.image,
            description: item.description,
            current: item.current,
            total: item.total,
            status: item.status,
          })) || [],
        });
      });
      
      console.log('[AchievementBadgesTab] All Achievements (after flattening):', {
        totalCount: achievements.length,
        achievementIds: achievements.map((item) => item.id),
        achievements: achievements.map((item) => ({
          id: item.id,
          title: item.title,
          image: item.image,
          description: item.description,
          current: item.current,
          total: item.total,
          status: item.status,
        })),
      });
      
      console.log('[AchievementBadgesTab] Mapped Badges:', {
        totalCount: mappedBadges.length,
        badgeIds: mappedBadges.map((badge) => badge.id),
        badges: mappedBadges.map((badge) => ({
          id: badge.id,
          title: badge.title,
          rarity: badge.rarity,
          category: badge.category,
        })),
      });
      
      console.log('[AchievementBadgesTab] Infinite Scroll State:', {
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error: error ? error.message : null,
      });
      
      console.log('[AchievementBadgesTab] ========================================');
    }
  }, [data, achievements, mappedBadges, hasNextPage, isFetchingNextPage, isLoading, error]);

  const handleLoadMore = useCallback(() => {
    console.log('[AchievementBadgesTab] 🔄 Scroll Event Triggered:', {
      hasNextPage,
      isFetchingNextPage,
      currentAchievementsCount: achievements.length,
      currentBadgesCount: mappedBadges.length,
    });
    
    if (hasNextPage && !isFetchingNextPage) {
      console.log('[AchievementBadgesTab] ✅ Fetching next page...');
      fetchNextPage();
    } else {
      console.log('[AchievementBadgesTab] ⏸️ Skipping fetch:', {
        reason: !hasNextPage ? 'No more pages' : 'Already fetching',
        hasNextPage,
        isFetchingNextPage,
      });
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, achievements.length, mappedBadges.length]);

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

  // Badge tıklandığında modal aç
  const handleBadgePress = useCallback((badge: Badge) => {
    // Badge'i SeeAllReward formatına map et
    const badgeData: SeeAllReward = {
      id: badge.id,
      title: badge.title,
      image: badge.icon,
      description: '', // Badge'de description yok
      category: badge.category,
      isUnlocked: true, // Badge zaten kazanılmış
      completed: 1,
      task: 1,
    };

    // Modal aç - performanslı, tek seferde açılır kapanır
    setSelectedBadge(badgeData);
  }, []);

  // Modal kapatma handler - Eş zamanlı kapanma için state'i hemen güncelle
  const handleCloseModal = useCallback(() => {
    // State'i hemen güncelle - Modal ve backdrop eş zamanlı kapansın
    setSelectedBadge(null);
  }, []);

  const renderItem = useCallback(({ item }: { item: Badge }) => {
    return (
      <Box width="50%" p="$2">
        <BadgeCard
          badge={item}
          onPress={() => handleBadgePress(item)}
        />
      </Box>
    );
  }, [handleBadgePress]);

  // Loading state
  // CACHE FIX: Only show loading when loading and no cached data
  const hasCachedData = data && 'pages' in data && Array.isArray(data.pages) && data.pages.length > 0 && data.pages[0];
  if (isLoading && !hasCachedData) {
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
          No achievements yet.
        </Text>
      </VStack>
    );
  }

  return (
    <>
      <FlatList
        data={mappedBadges}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{
          paddingHorizontal: 8,
          paddingTop: 8,
          paddingBottom: bottomInset + 8,
        }}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        removeClippedSubviews={false}
      />

      {/* Badge Detail Modal - Performanslı, tek seferde açılır kapanır */}
      <Modal
        isOpen={!!selectedBadge}
        onClose={handleCloseModal}
        size="lg"
        closeOnOverlayClick={true}
      >
        <ModalBackdrop onPress={handleCloseModal} />
        {selectedBadge ? (
          <ModalContent
            bg={isDark ? '#1A1A1A' : '#FDFDFB'}
            borderRadius={20}
            marginHorizontal={24}
            marginBottom={bottomInset + 24}
            maxHeight="80%"
          >
            <BadgeBottomSheet
              data={selectedBadge}
              onClose={handleCloseModal}
            />
          </ModalContent>
        ) : null}
      </Modal>
    </>
  );
};


export default AchievementBadgesTab;

