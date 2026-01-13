import React, { useMemo, useCallback, useState } from 'react';
import { FlatList, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Modal,
  ModalBackdrop,
  ModalContent,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import LimitedTimeEventCard from '../LimitedTimeEventCard';
import AchievementFilter from '../AchievementFilter';
import BadgeCard from '../BadgeCard';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import { FilterOption } from '../AchievementFilter';
import { useSafeAreaValues, toImageSource } from '@/src/utils';
import { useLimitedEvent, useAchievements } from '../../api/hooks';
import BadgeBottomSheet from '../BadgeBottomSheet';
import type { AchievementApiItem } from '../../types';
import { LimitedTimeEventSkeleton, BadgeSkeleton } from '@/src/components/Skeletons';

const { width } = Dimensions.get('window');

type AchievementTabProps = {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  onRewardPress?: (reward: SeeAllReward) => void; // Optional - artık kullanılmıyor
};

const AchievementTab: React.FC<AchievementTabProps> = ({
  activeFilter,
  onFilterChange,
  onRewardPress,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const bottomInset = useSafeAreaValues('bottom');
  const [selectedBadge, setSelectedBadge] = useState<SeeAllReward | null>(null);
  
  // Limited Event API hook
  const {
    data: limitedEvent,
    isLoading: isLimitedEventLoading,
    error: limitedEventError,
    refetch: refetchLimitedEvent, // Pull-to-refresh için
    isRefetching: isRefetchingLimitedEvent, // Refresh durumu
  } = useLimitedEvent();

  // Achievements API hook - 6'lı veri gelecek
  const {
    data: achievementsData,
    fetchNextPage: fetchNextAchievementsPage,
    hasNextPage: hasNextAchievementsPage,
    isFetchingNextPage: isFetchingNextAchievementsPage,
    isLoading: isAchievementsLoading,
    error: achievementsError,
    refetch: refetchAchievements, // Pull-to-refresh için
    isRefetching: isRefetchingAchievements, // Refresh durumu
  } = useAchievements(6);

  // Map AchievementApiItem to SeeAllReward format (BadgeCard component'i için)
  const mapAchievementToSeeAllReward = useCallback((achievement: AchievementApiItem): SeeAllReward => {
    const imageSource = toImageSource(achievement.image) || require('@/assets/avatar/default-useravatar.png');
    
    return {
      id: achievement.id,
      title: achievement.title,
      image: imageSource,
      description: achievement.description,
      category: '', // API'den gelmiyor, boş string
      isUnlocked: achievement.status === 'completed',
      completed: achievement.current,
      task: achievement.total,
    };
  }, []);


  // Transform achievements data for display (flatten all pages and remove duplicates)
  const allAchievements = useMemo(() => {
    if (!achievementsData?.pages) return [];
    
    const allItems = achievementsData.pages.flatMap((page) => page.items);
    
    // Remove duplicates by ID (cursor pagination'da aynı item tekrar gelebilir)
    const uniqueItemsMap = new Map<string, AchievementApiItem>();
    for (const item of allItems) {
      if (!uniqueItemsMap.has(item.id)) {
        uniqueItemsMap.set(item.id, item);
      }
    }
    
    return Array.from(uniqueItemsMap.values());
  }, [achievementsData?.pages]);

  // Map achievements to SeeAllReward format
  const mappedAchievements = useMemo(() => {
    return allAchievements.map(mapAchievementToSeeAllReward);
  }, [allAchievements, mapAchievementToSeeAllReward]);

  // Filter achievements based on active filter
  const getFilteredAchievements = useMemo(() => {
    switch (activeFilter) {
      case 'Not Started':
        return mappedAchievements.filter(item => !item.isUnlocked && (item.completed || 0) === 0);
      case 'In Progress':
        return mappedAchievements.filter(item => !item.isUnlocked && (item.completed || 0) > 0 && (item.completed || 0) < (item.task || 1));
      case 'Completed':
        return mappedAchievements.filter(item => item.isUnlocked);
      case 'All':
      default:
        return mappedAchievements;
    }
  }, [mappedAchievements, activeFilter]);

  // Pull-to-Refresh handler - Smart refresh pattern
  // Cache'den anında göster, arka planda fresh data fetch et
  const isRefetching = isRefetchingLimitedEvent || isRefetchingAchievements;
  const handleRefresh = useCallback(async () => {
    // Cache'den göster (zaten gösteriliyor - React Query otomatik yapıyor)
    // Arka planda fresh data fetch et
    await Promise.all([
      refetchLimitedEvent(),   // Limited event refresh
      refetchAchievements(),   // Achievements refresh
    ]);
    // Fresh data geldiğinde React Query otomatik UI'ı günceller
  }, [refetchLimitedEvent, refetchAchievements]);

  // ListHeaderComponent - Limited Event, Search Bar ve Filter
  const ListHeaderComponent = useMemo(() => (
    <VStack space="md" px="$4" pb="$1">
      {/* Limited Time Event Card */}
      <Box alignItems="center">
        {isLimitedEventLoading && !limitedEvent ? (
          <LimitedTimeEventSkeleton />
        ) : limitedEventError ? (
          <Box py="$4" alignItems="center" justifyContent="center" minHeight={230}>
            <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
              Hata: {limitedEventError.message}
            </Text>
          </Box>
        ) : limitedEvent ? (
            <LimitedTimeEventCard
            data={limitedEvent}
            onPress={() => {
              // Limited time event için bottom sheet açılabilir (ileride eklenebilir)
              // Şimdilik sadece navigation yapılabilir
            }}
          />
        ) : null}
      </Box>

      {/* Achievement Filter */}
      <AchievementFilter
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />
    </VStack>
  ), [
    isLimitedEventLoading,
    limitedEventError,
    limitedEvent,
    activeFilter,
    onFilterChange,
  ]);

  // Empty state component
  const EmptyComponent = useMemo(() => {
    if (isAchievementsLoading && !achievementsData) {
      return <BadgeSkeleton count={6} />;
    }
    if (achievementsError) {
      return (
        <Box py="$4" alignItems="center" px={16}>
          <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
            Hata: {achievementsError.message}
          </Text>
        </Box>
      );
    }
    if (getFilteredAchievements.length === 0) {
      return (
        <Box py="$4" alignItems="center" px={16}>
          <Text color={isDark ? '#FFFFFF' : '#B9B9B9'} fontSize="$md" textAlign="center">
            {activeFilter === 'All' 
              ? 'No achievements yet'
              : `No ${activeFilter} achievements yet`}
          </Text>
        </Box>
      );
    }
    return null;
  }, [
    isAchievementsLoading,
    achievementsData,
    achievementsError,
    getFilteredAchievements.length,
    activeFilter,
    isDark,
  ]);

  // Modal kapatma handler - Hook Rules: Tüm hook'lar early return'den önce çağrılmalı
  const handleCloseModal = useCallback(() => {
    setSelectedBadge(null);
  }, []);

  // Initial loading state - hem limited event hem achievements ilk yüklemede ise tüm ekran için skeleton göster
  // Cache'den veri varsa skeleton gösterme
  const isInitialLoading = (isLimitedEventLoading && !limitedEvent) || 
                           (isAchievementsLoading && !achievementsData);

  // numColumns'u sabit tut (FlatList numColumns'u dinamik değiştirmeyi desteklemiyor)
  // Boş durumda zaten ListEmptyComponent gösteriliyor, o yüzden her zaman 2 kullan
  const numColumns = 2;
  const hasItems = getFilteredAchievements.length > 0;

  // İlk yüklemede ve cache'den veri yoksa tüm ekran için skeleton göster
  if (isInitialLoading && !limitedEvent && !achievementsData) {
    return (
      <VStack flex={1} px="$4" py="$4" space="md">
        {/* Limited Time Event Skeleton */}
        <LimitedTimeEventSkeleton />

        {/* Filter Skeleton */}
        <HStack space="sm">
          {['All', 'Not Started', 'In Progress', 'Completed'].map((_, index) => (
            <Box
              key={index}
              bg={isDark ? '#2A2A2A' : '#E9E9E9'}
              borderRadius={20}
              height={32}
              width={80}
            />
          ))}
        </HStack>

        {/* Achievements Skeleton */}
        <BadgeSkeleton count={6} />
      </VStack>
    );
  }

  return (
    <VStack flex={1}>
      <FlatList
        key={`achievement-list-${numColumns}`} // numColumns değişirse yeniden render et
        data={getFilteredAchievements}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 0, paddingHorizontal: hasItems ? 16 : 0, paddingBottom: bottomInset + 24 }}
        ItemSeparatorComponent={hasItems ? () => <Box height={12} /> : undefined}
        columnWrapperStyle={hasItems ? { gap: 12 } : undefined}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={EmptyComponent}
        renderItem={({ item }) => (
          <Box flex={1}>
            <BadgeCard
              data={item}
              onPress={() => {
                // Modal aç - performanslı, tek seferde açılır kapanır
                setSelectedBadge(item);
              }}
            />
          </Box>
        )}
        keyExtractor={(item) => item.id}
        onEndReached={() => {
          if (hasNextAchievementsPage && !isFetchingNextAchievementsPage) {
            fetchNextAchievementsPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextAchievementsPage ? (
            <Box pt="$4" alignItems="center" width="100%">
              <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#E2FF46' : '#8B5CF6'}
          />
        }
      />

      {/* Badge Detail Modal - Performanslı, tek seferde açılır kapanır */}
      <Modal
        isOpen={!!selectedBadge}
        onClose={handleCloseModal}
        size="lg"
        closeOnOverlayClick={true}
      >
        <ModalBackdrop onPress={handleCloseModal} />
        {selectedBadge && (
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
        )}
      </Modal>
    </VStack>
  );
};

export default React.memo(AchievementTab);

