import React, { useMemo, useCallback } from 'react';
import { FlatList, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
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
  } = useLimitedEvent();

  // Achievements API hook
  const {
    data: achievementsData,
    fetchNextPage: fetchNextAchievementsPage,
    hasNextPage: hasNextAchievementsPage,
    isFetchingNextPage: isFetchingNextAchievementsPage,
    isLoading: isAchievementsLoading,
    error: achievementsError,
  } = useAchievements(20);

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

  // ScrollView için scroll handler - nested scroll durumunda onEndReached düzgün çalışmayabilir
  const handleScrollViewScroll = useCallback(
    (event: any) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const paddingToBottom = 100; // ScrollView'in altına yaklaşma mesafesi
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

      if (isCloseToBottom && hasNextAchievementsPage && !isFetchingNextAchievementsPage) {
        fetchNextAchievementsPage();
      }
    },
    [hasNextAchievementsPage, isFetchingNextAchievementsPage, fetchNextAchievementsPage]
  );

  return (
    <VStack flex={1}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScrollViewScroll}
        scrollEventThrottle={400}
      >
        <VStack space="md" px="$4">
          {/* Limited Time Event Card */}
          {isLimitedEventLoading ? (
            <Box py="$4" alignItems="center" justifyContent="center" minHeight={230}>
              <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
              <Text color={isDark ? '#FFFFFF' : '#000000'} mt="$2" fontSize={12}>
                Yükleniyor...
              </Text>
            </Box>
          ) : limitedEventError ? (
            <Box py="$4" alignItems="center" justifyContent="center" minHeight={230}>
              <Text color="#CE4A4A" fontSize={12} textAlign="center">
                Hata: {limitedEventError.message}
              </Text>
            </Box>
          ) : limitedEvent ? (
            <LimitedTimeEventCard
              data={limitedEvent}
              onPress={() => {
                // Handle limited time event press
                console.log('Limited time event pressed:', limitedEvent.id);
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
                placeholder="Ürün Grubu seçin veya ürün adı arayın"
                placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
                color={isDark ? '#000' : '#000'}
                fontSize={9}
              />
            </Input>
          </HStack>

          {/* Achievement Filter */}
          <AchievementFilter
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
          />
        </VStack>

        {/* Achievement Badges Grid */}
        {isAchievementsLoading && mappedAchievements.length === 0 ? (
          <Box py="$4" alignItems="center" px={16}>
            <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
            <Text color={isDark ? '#FFFFFF' : '#000000'} mt="$2" fontSize={12}>
              Yükleniyor...
            </Text>
          </Box>
        ) : achievementsError ? (
          <Box py="$4" alignItems="center" px={16}>
            <Text color="#CE4A4A" fontSize={12} textAlign="center">
              Hata: {achievementsError.message}
            </Text>
          </Box>
        ) : getFilteredAchievements.length === 0 ? (
          <Box py="$4" alignItems="center" px={16}>
            <Text color={isDark ? '#FFFFFF' : '#B9B9B9'} fontSize={12} textAlign="center">
              {activeFilter === 'All' 
                ? 'Henüz achievement bulunmuyor'
                : `Henüz ${activeFilter} durumunda achievement bulunmuyor`}
            </Text>
          </Box>
        ) : (
          <FlatList
            data={getFilteredAchievements}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 0 }}
            ItemSeparatorComponent={() => <Box height={12} />}
            columnWrapperStyle={{ gap: 12 }}
            renderItem={({ item }) => (
              <Box flex={1}>
                <BadgeCard
                  data={item}
                  onPress={() => onRewardPress(item)}
                />
              </Box>
            )}
            keyExtractor={(item) => item.id}
            ListFooterComponent={
              isFetchingNextAchievementsPage ? (
                <Box pt="$4" alignItems="center" width="100%">
                  <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                </Box>
              ) : null
            }
          />
        )}
      </ScrollView>
    </VStack>
  );
};

