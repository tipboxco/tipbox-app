import React, { useState } from 'react';
import { FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  Input,
  InputField,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EventsStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import { mock_user_profile } from '@/src/mock/common';
import { mock_community_events, see_all_reward_mock } from '@/src/mock/events/communityEvents';
import { Feather } from '@expo/vector-icons';
import EventCard from '../components/EventCard';
import BadgeCard from '../components/BadgeCard';
import BadgeDetailModal from '../components/BadgeDetailModal';
import LimitedTimeEventCard from '../components/LimitedTimeEventCard';
import AchievementFilter from '../components/AchievementFilter';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import { FilterOption } from '../components/AchievementFilter';

type EventsScreenNavigationProp = NativeStackNavigationProp<EventsStackParamList, 'EventsScreen'>;

const { width } = Dimensions.get('window');

const EventsScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [activeTab, setActiveTab] = useState<'community' | 'achievement'>('community');
  const [selectedReward, setSelectedReward] = useState<SeeAllReward | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const navigation = useNavigation<EventsScreenNavigationProp>();

  const handleEventPress = (eventId: string) => {
    navigation.navigate('EventDetail', { eventId });
  };

  const handleAchievementPress = () => {
    setActiveTab('achievement');
  };

  const handleRewardPress = (reward: SeeAllReward) => {
    setSelectedReward(reward);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedReward(null);
  };

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
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Header
        title="Events"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <VStack flex={1} px="$4" py="$2" space="md">
        {/* Tabs */}
        <VStack px="$4" bg={isDark ? '#000' : '#FFF'}>
          <HStack space="lg">
            <Pressable
              onPress={() => setActiveTab('community')}
              flex={1}
              alignItems="center"
              py="$2"
            >
              <Text
                color={activeTab === 'community' ? '#000' : '#8C8C8C'}
                fontSize={12}
                fontWeight="$bold"
              >
                Community Events
              </Text>
              {activeTab === 'community' && (
                <Box
                  width={112}
                  height={2}
                  bg="#000"
                  mt="$1"
                  borderRadius={1}
                />
              )}
            </Pressable>
            <Pressable
              onPress={handleAchievementPress}
              flex={1}
              alignItems="center"
              py="$2"
            >
              <Text
                color={activeTab === 'achievement' ? '#000' : '#8C8C8C'}
                fontSize={12}
                fontWeight="$bold"
              >
                Achievement Ladder
              </Text>
              {activeTab === 'achievement' && (
                <Box
                  width={112}
                  height={2}
                  bg="#000"
                  mt="$1"
                  borderRadius={1}
                />
              )}
            </Pressable>
          </HStack>
        </VStack>

        {/* Content based on active tab */}
        {activeTab === 'community' && (
          <VStack space="md" flex={1}>
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

            {/* Active Events Section - Horizontal Scroll */}
            <VStack space="sm">
              <Text
                color={isDark ? '#FFFFFF' : '#B9B9B9'}
                fontSize={14}
                fontWeight="$bold"
              >
                Active Events
              </Text>
              <FlatList
                data={mock_community_events.activeEvents}
                horizontal
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={() => <Box width={12} />}
                renderItem={({ item }) => (
                  <EventCard
                    data={item}
                    isGrid={false}
                    onPress={() => handleEventPress(item.id)}
                  />
                )}
                keyExtractor={(item) => item.id}
              />
            </VStack>

            {/* Upcoming Events Section - Horizontal Scroll */}
            <VStack space="sm">
              <Text
                color={isDark ? '#FFFFFF' : '#B9B9B9'}
                fontSize={14}
                fontWeight="$bold"
              >
                Upcoming Events
              </Text>
              <FlatList
                data={mock_community_events.upcomingEvents}
                horizontal
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={() => <Box width={12} />}
                renderItem={({ item }) => (
                  <EventCard
                    data={item}
                    isGrid={false}
                    onPress={() => handleEventPress(item.id)}
                  />
                )}
                keyExtractor={(item) => item.id}
              />
            </VStack>
          </VStack>
        )}

        {activeTab === 'achievement' && (
          <VStack space="md" flex={1}>
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
              onFilterChange={setActiveFilter}
            />
            
            {/* Achievement Badges Grid */}
            <FlatList
              data={getFilteredAchievements()}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
              ItemSeparatorComponent={() => <Box height={6} />}
              columnWrapperStyle={{ justifyContent: 'space-between', gap: 6 }}
              renderItem={({ item }) => (
                <Box width={(width - 38) / 2}>
                  <BadgeCard
                    data={item}
                    onPress={() => handleRewardPress(item)}
                  />
                </Box>
              )}
              keyExtractor={(item) => item.id}
            />
          </VStack>
        )}
      </VStack>


      {/* Badge Detail Modal */}
      <BadgeDetailModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        data={selectedReward}
      />
    </Box>
    </SafeAreaView>
  );
};

EventsScreen.displayName = 'EventsScreen';

export default EventsScreen;
