import React from 'react';
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
import { see_all_reward_mock } from '@/src/mock/events/communityEvents';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import { FilterOption } from '../AchievementFilter';
import { useSafeAreaValues } from '@/src/utils';
import { useLimitedEvent } from '../../api/hooks';

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

  // Filter achievements based on active filter
  const getFilteredAchievements = () => {
    switch (activeFilter) {
      case 'Not Started':
        return see_all_reward_mock.filter(item => !item.isUnlocked && (item.completed || 0) === 0);
      case 'In Progress':
        return see_all_reward_mock.filter(item => !item.isUnlocked && (item.completed || 0) > 0 && (item.completed || 0) < (item.task || 1));
      case 'Completed':
        return see_all_reward_mock.filter(item => item.isUnlocked);
      case 'All':
      default:
        return see_all_reward_mock;
    }
  };

  return (
    <VStack flex={1}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        showsVerticalScrollIndicator={false}
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
        <FlatList
          data={getFilteredAchievements()}
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
        />
      </ScrollView>
    </VStack>
  );
};

