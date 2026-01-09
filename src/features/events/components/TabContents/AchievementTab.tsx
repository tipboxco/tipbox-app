import React, { useMemo, useCallback } from 'react';
import { FlatList, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputField,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import LimitedTimeEventCard from '../LimitedTimeEventCard';
import AchievementFilter from '../AchievementFilter';
import BadgeCard from '../BadgeCard';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import { FilterOption } from '../AchievementFilter';
import { useSafeAreaValues, toImageSource } from '@/src/utils';
import { useLimitedEvent, useAchievements } from '../../api/hooks';
import type { AchievementApiItem } from '../../types';
import { LimitedTimeEventSkeleton, BadgeSkeleton } from '@/src/components/Skeletons';

const { width } = Dimensions.get('window');

type AchievementTabProps = {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  onRewardPress: (reward: SeeAllReward) => void;
};

export const AchievementTab: React.FC<AchievementTabProps> = ({
  activeFilter,
  onFilterChange,
  onRewardPress,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const bottomInset = useSafeAreaValues('bottom');
  
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
    const imageSource = toImageSource(achievement.image) || require('@/assets/avatar/ozan.png');
    
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
    <VStack space="md" px="$4" pb="$4">
      {/* Limited Time Event Card */}
      {isLimitedEventLoading ? (
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
            // Limited time event'i SeeAllReward formatına map et
            if (onRewardPress) {
              const reward: SeeAllReward = {
                id: limitedEvent.id,
                title: limitedEvent.title || '',
                image: limitedEvent.eventImage ? toImageSource(limitedEvent.eventImage) : require('@/assets/avatar/ozan.png'),
                description: limitedEvent.description || '',
                category: '', // Limited event için category yok
                isUnlocked: false, // Limited event için unlock durumu yok
                completed: limitedEvent.userScore?.score || 0,
                task: 0, // Limited event için target score yok
              };
              onRewardPress(reward);
            }
          }}
        />
      ) : null}

      {/* Search Bar */}
      <HStack
        alignItems="center"
        bg={isDark ? '#1A1A1A' : '#F2F2F2'}
        borderWidth={1}
        borderColor="#E9E9E9"
        borderRadius={20}
        px={14}
        space="sm"
      >
        <Feather
          name="search"
          size={24}
          color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'}
        />
        <Input flex={1} borderWidth={0} bg="transparent">
          <InputField
            placeholder="Select product group or search product name"
            placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
            color={isDark ? '#000' : '#000'}
            fontSize="$2xs"
          />
        </Input>
      </HStack>

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
    isDark,
    activeFilter,
    onFilterChange,
    onRewardPress,
  ]);

  // Empty state component
  const EmptyComponent = useMemo(() => {
    if (isAchievementsLoading && mappedAchievements.length === 0) {
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
          <Text color={isDark ? '#FFFFFF' : '#B9B9B9'} fontSize="$sm" textAlign="center">
            {activeFilter === 'All' 
              ? 'Henüz achievement bulunmuyor'
              : `Henüz ${activeFilter} durumunda achievement bulunmuyor`}
          </Text>
        </Box>
      );
    }
    return null;
  }, [
    isAchievementsLoading,
    mappedAchievements.length,
    achievementsError,
    getFilteredAchievements.length,
    activeFilter,
    isDark,
  ]);

  // numColumns'u sabit tut (FlatList numColumns'u dinamik değiştirmeyi desteklemiyor)
  // Boş durumda zaten ListEmptyComponent gösteriliyor, o yüzden her zaman 2 kullan
  const numColumns = 2;
  const hasItems = getFilteredAchievements.length > 0;

  return (
    <VStack flex={1}>
      <FlatList
        key={`achievement-list-${numColumns}`} // numColumns değişirse yeniden render et
        data={getFilteredAchievements}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: hasItems ? 16 : 0, paddingBottom: bottomInset + 24 }}
        ItemSeparatorComponent={hasItems ? () => <Box height={12} /> : undefined}
        columnWrapperStyle={hasItems ? { gap: 12 } : undefined}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={() => EmptyComponent}
        renderItem={({ item }) => (
          <Box flex={1}>
            <BadgeCard
              data={item}
              onPress={() => onRewardPress(item)}
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
    </VStack>
  );
};

