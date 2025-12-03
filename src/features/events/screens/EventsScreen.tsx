import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EventsStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import BadgeDetailModal from '../components/BadgeDetailModal';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import { FilterOption } from '../components/AchievementFilter';
import { CommunityTab, AchievementTab } from '../components/TabContents';
import EventsTabs from '../components/EventsTabs';

type EventsScreenNavigationProp = NativeStackNavigationProp<EventsStackParamList, 'EventsScreen'>;

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

  const handleRewardPress = (reward: SeeAllReward) => {
    setSelectedReward(reward);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedReward(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'community':
        return <CommunityTab onEventPress={handleEventPress} />;
      case 'achievement':
        return (
          <AchievementTab
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onRewardPress={handleRewardPress}
          />
        );
      default:
        return <CommunityTab onEventPress={handleEventPress} />;
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

        {/* Tabs */}
        <EventsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <Box flex={1}>
          {renderTabContent()}
        </Box>


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
