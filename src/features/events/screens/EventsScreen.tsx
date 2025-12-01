import React, { useState, useEffect } from 'react';
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
  ScrollView,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EventsStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import { mock_user_profile } from '@/src/mock/common';
import { see_all_reward_mock } from '@/src/mock/events/communityEvents';
import { Feather } from '@expo/vector-icons';
import EventCard from '@/src/components/EventCard';
import BadgeCard from '../components/BadgeCard';
import BadgeDetailModal from '../components/BadgeDetailModal';
import LimitedTimeEventCard from '../components/LimitedTimeEventCard';
import AchievementFilter from '../components/AchievementFilter';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import { FilterOption } from '../components/AchievementFilter';
import { useSafeAreaValues } from '@/src/utils';
import { useActiveEvents, useUpcomingEvents } from '../api/hooks';
import type { EventApiItem } from '@/src/types/EventCard';
import type { EventCardData } from '@/src/types/EventCard';

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
  const bottomInset = useSafeAreaValues('bottom');

  // Active Events API hook
  const {
    data: activeEventsData,
    fetchNextPage: fetchNextActivePage,
    hasNextPage: hasNextActivePage,
    isFetchingNextPage: isFetchingNextActivePage,
    isLoading: isActiveEventsLoading,
    error: activeEventsError,
  } = useActiveEvents(20);

  // Upcoming Events API hook
  const {
    data: upcomingEventsData,
    fetchNextPage: fetchNextUpcomingPage,
    hasNextPage: hasNextUpcomingPage,
    isFetchingNextPage: isFetchingNextUpcomingPage,
    isLoading: isUpcomingEventsLoading,
    error: upcomingEventsError,
  } = useUpcomingEvents(20);

  // Format date range from startDate and endDate
  const formatDateRange = (startDate: string, endDate: string): string => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      
      const formatDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
      };

      return `${formatDate(start)} - ${formatDate(end)}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  // Map API event data to EventCardData format
  const mapEventToCardData = (event: EventApiItem): EventCardData => {
    return {
      id: event.eventId,
      title: event.title,
      description: event.description,
      image: event.image || null,
      dateRange: formatDateRange(event.startDate, event.endDate),
      participants: event.interaction,
      avatars: event.participants.map(p => p.avatar),
      eventType: event.eventType || 'default',
    };
  };

  // Transform events data for display (flatten all pages)
  const activeEvents = activeEventsData?.pages.flatMap((page) => 
    page.items.map(mapEventToCardData)
  ) ?? [];

  const upcomingEvents = upcomingEventsData?.pages.flatMap((page) => 
    page.items.map(mapEventToCardData)
  ) ?? [];

  // Debug: API response'u kontrol et
  useEffect(() => {
    if (activeEventsData) {
      console.log('Active Events Data:', JSON.stringify(activeEventsData, null, 2));
      console.log('Active Events Count:', activeEvents.length);
    }
    if (activeEventsError) {
      console.error('Active Events Error:', activeEventsError);
      if ('response' in activeEventsError) {
        console.error('Error Response:', (activeEventsError as any).response?.data);
        console.error('Error Status:', (activeEventsError as any).response?.status);
      }
    }
    if (upcomingEventsData) {
      console.log('Upcoming Events Data:', JSON.stringify(upcomingEventsData, null, 2));
      console.log('Upcoming Events Count:', upcomingEvents.length);
    }
    if (upcomingEventsError) {
      console.error('Upcoming Events Error:', upcomingEventsError);
      if ('response' in upcomingEventsError) {
        console.error('Error Response:', (upcomingEventsError as any).response?.data);
        console.error('Error Status:', (upcomingEventsError as any).response?.status);
      }
    }
  }, [activeEventsData, activeEventsError, activeEvents.length, upcomingEventsData, upcomingEventsError, upcomingEvents.length]);

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

        <VStack flex={1} space="md">
          {/* Tabs - Trust/Collections ile aynı stil */}
          <VStack pt='$4' bg={isDark ? '#000' : '#FAFAFA'} >
            <HStack borderBottomWidth={1} borderColor="#E9E9E9" p={0} m={0}>
              <Pressable
                onPress={() => setActiveTab('community')}
                flex={1}
                alignItems="center"
                pb="$1"
                position="relative"
              >
                <VStack alignItems="center" space="xs">
                  <Text
                    color={activeTab === 'community' ? '#000' : '#8C8C8C'}
                    fontSize={12}
                    fontWeight="$bold"
                  >
                    Community Events
                  </Text>
                </VStack>
                <Box
                  position="absolute"
                  bottom={-1}
                  left="25%"
                  height={2}
                  width="50%"
                  borderRadius={999}
                  bg={activeTab === 'community' ? '#000' : 'transparent'}
                />
              </Pressable>

              <Pressable
                onPress={handleAchievementPress}
                flex={1}
                alignItems="center"
                pb="$1"
                position="relative"
              >
                <VStack alignItems="center" space="xs">
                  <Text
                    color={activeTab === 'achievement' ? '#000' : '#8C8C8C'}
                    fontSize={12}
                    fontWeight="$bold"
                  >
                    Achievement Ladder
                  </Text>
                </VStack>
                <Box
                  position="absolute"
                  bottom={-1}
                  left="25%"
                  height={2}
                  width="50%"
                  borderRadius={999}
                  bg={activeTab === 'achievement' ? '#000' : 'transparent'}
                />
              </Pressable>
            </HStack>
          </VStack>

          {/* Content based on active tab */}
          {activeTab === 'community' && (
            <VStack flex={1}>
              <ScrollView
                flex={1}
                contentContainerStyle={{ paddingBottom: bottomInset }}
                showsVerticalScrollIndicator={false}
              >
                <VStack space="md">
                  {/* Search Bar */}
                  <Box px="$4">
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
                  </Box>

                  {/* Active Events Section - Horizontal Scroll */}
                  <Box pl="$4">
                    <VStack space="sm">
                      <Text
                        color={isDark ? '#FFFFFF' : '#B9B9B9'}
                        fontSize={14}
                        fontWeight="$bold"
                      >
                        Active Events
                      </Text>
                      {isActiveEventsLoading ? (
                        <Box py="$4" alignItems="center">
                          <Text color={isDark ? '#FFFFFF' : '#000000'}>Yükleniyor...</Text>
                        </Box>
                      ) : activeEventsError ? (
                        <Box py="$4" alignItems="center">
                          <Text color="#CE4A4A" fontSize={12}>
                            Hata: {activeEventsError.message}
                          </Text>
                        </Box>
                      ) : activeEvents.length === 0 ? (
                        <Box py="$4" alignItems="center">
                          <Text color={isDark ? '#FFFFFF' : '#B9B9B9'} fontSize={12}>
                            Henüz aktif etkinlik bulunmuyor
                          </Text>
                        </Box>
                      ) : (
                        <FlatList
                          data={activeEvents}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          ItemSeparatorComponent={() => <Box width={12} />}
                          contentContainerStyle={{ paddingRight: 16 }}
                          renderItem={({ item }) => (
                            <EventCard
                              data={item}
                              isGrid={false}
                              onPress={() => handleEventPress(item.id)}
                            />
                          )}
                          keyExtractor={(item) => item.id}
                          onEndReached={() => {
                            if (hasNextActivePage && !isFetchingNextActivePage) {
                              fetchNextActivePage();
                            }
                          }}
                          onEndReachedThreshold={0.5}
                        />
                      )}
                    </VStack>
                  </Box>

                  {/* Upcoming Events Section - Horizontal Scroll */}
                  <Box pl="$4">
                    <VStack space="sm">
                      <Text
                        color={isDark ? '#FFFFFF' : '#B9B9B9'}
                        fontSize={14}
                        fontWeight="$bold"
                      >
                        Upcoming Events
                      </Text>
                      {isUpcomingEventsLoading ? (
                        <Box py="$4" alignItems="center">
                          <Text color={isDark ? '#FFFFFF' : '#000000'}>Yükleniyor...</Text>
                        </Box>
                      ) : upcomingEventsError ? (
                        <Box py="$4" alignItems="center">
                          <Text color="#CE4A4A" fontSize={12}>
                            Hata: {upcomingEventsError.message}
                          </Text>
                        </Box>
                      ) : upcomingEvents.length === 0 ? (
                        <Box py="$4" alignItems="center">
                          <Text color={isDark ? '#FFFFFF' : '#B9B9B9'} fontSize={12}>
                            Henüz yaklaşan etkinlik bulunmuyor
                          </Text>
                        </Box>
                      ) : (
                        <FlatList
                          data={upcomingEvents}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          ItemSeparatorComponent={() => <Box width={12} />}
                          contentContainerStyle={{ paddingRight: 16 }}
                          renderItem={({ item }) => (
                            <EventCard
                              data={item}
                              isGrid={false}
                              onPress={() => handleEventPress(item.id)}
                            />
                          )}
                          keyExtractor={(item) => item.id}
                          onEndReached={() => {
                            if (hasNextUpcomingPage && !isFetchingNextUpcomingPage) {
                              fetchNextUpcomingPage();
                            }
                          }}
                          onEndReachedThreshold={0.5}
                        />
                      )}
                    </VStack>
                  </Box>
                </VStack>
              </ScrollView>
            </VStack>
          )}

          {activeTab === 'achievement' && (
            <VStack flex={1}>
              <ScrollView
                flex={1}
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
                    onFilterChange={setActiveFilter}
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
                          onPress={() => handleRewardPress(item)}
                        />
                      </Box>
                    )}
                    keyExtractor={(item) => item.id}
                  />
                </VStack>
              </ScrollView>
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
