import React from 'react';
import { FlatList, Dimensions, ScrollView } from 'react-native';
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
        contentContainerStyle={{ paddingBottom: bottomInset }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space="md" px="$4">
          {/* Limited Time Event Card */}
          <LimitedTimeEventCard
            title="Weekend Voyager"
            description="Share at least 1 post on each weekend (Saturday or Sunday) for 4 weeks in a row."
            timeRemaining="11:42:03"
            userScore={34599}
            userRank={12}
            userAvatar={require('@/assets/avatar/ozan.png')}
            otherUsers={[
              {
                id: '1',
                avatar: require('@/assets/avatar/ozan.png'),
                rank: 1,
              },
              {
                id: '2',
                avatar: require('@/assets/avatar/ozan.png'),
                rank: 2,
              },
              {
                id: '3',
                avatar: require('@/assets/avatar/ozan.png'),
                rank: 3,
              },
            ]}
            onPress={() => {
              // Handle limited time event press
              console.log('Limited time event pressed');
            }}
          />

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

          {/* Achievement Badges Grid */}
          <FlatList
            data={getFilteredAchievements()}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
            ItemSeparatorComponent={() => <Box height={6} />}
            columnWrapperStyle={{ justifyContent: 'space-between', gap: 6 }}
            renderItem={({ item }) => (
              <Box width={(width - 38) / 2}>
                <BadgeCard
                  data={item}
                  onPress={() => onRewardPress(item)}
                />
              </Box>
            )}
            keyExtractor={(item) => item.id}
          />
        </VStack>
      </ScrollView>
    </VStack>
  );
};

