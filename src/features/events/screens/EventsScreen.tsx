import React, { useState, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  withTiming,
} from 'react-native-reanimated';
import {
  Box,
  VStack,
  HStack,
  Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EventsStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import BadgeDetailModal from '../components/BadgeDetailModal';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import { FilterOption } from '../components/AchievementFilter';
import { CommunityTab, AchievementTab } from '../components/TabContents';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

type EventsScreenNavigationProp = NativeStackNavigationProp<EventsStackParamList, 'EventsScreen'>;

const EventsScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<EventsScreenNavigationProp>();
  const pagerRef = useRef<PagerView>(null);
  const tabContainerRef = useRef<any>(null);
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  
  // 🎯 CORE: Shared progress value (0 = Community, 1 = Achievement)
  const progress = useSharedValue(0);
  
  // Tab state - currentPage'e göre hesaplanıyor
  const activeTab: 'community' | 'achievement' = currentPage === 0 ? 'community' : 'achievement';
  
  const [selectedReward, setSelectedReward] = useState<SeeAllReward | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');


  const handleEventPress = (eventId: string) => {
    if (!eventId) {
      console.error('[EventsScreen] handleEventPress: eventId is missing');
      return;
    }
    console.log('[EventsScreen] Navigating to EventDetail with eventId:', eventId);
    try {
      navigation.navigate('EventDetail', { eventId });
    } catch (error) {
      console.error('[EventsScreen] Navigation error:', error);
    }
  };

  const handleRewardPress = (reward: SeeAllReward) => {
    setSelectedReward(reward);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedReward(null);
  };

  // Tab press handler - PagerView native animasyonu ile geçiş
  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
  }, []);

  // PagerView scroll handler - realtime progress güncelleme
  const handlePageScroll = useCallback(
    (e: any) => {
      'worklet';
      const { position, offset } = e.nativeEvent;
      progress.value = position + offset;
    },
    [progress]
  );

  // PagerView page selected handler - snap sonrası progress'i sync et
  const handlePageSelected = useCallback(
    (e: any) => {
      const position = e.nativeEvent.position;
      progress.value = withTiming(position, { duration: 0 });
      setCurrentPage(position);
    },
    [progress]
  );

  // Tab 1 (Community) label color animation
  const tab1Style = useAnimatedStyle(() => {
    const activeColor = isDark ? '#FFFFFF' : '#000000';
    const inactiveColor = '#8C8C8C';
    const color = interpolateColor(
      progress.value,
      [0, 1],
      [activeColor, inactiveColor]
    );
    return { color };
  });

  // Tab 2 (Achievement) label color animation
  const tab2Style = useAnimatedStyle(() => {
    const activeColor = isDark ? '#FFFFFF' : '#000000';
    const inactiveColor = '#8C8C8C';
    const color = interpolateColor(
      progress.value,
      [0, 1],
      [inactiveColor, activeColor]
    );
    return { color };
  });

  // Indicator position animation
  const tabWidth = tabContainerWidth / 2 || 0;
  const indicatorWidth = tabWidth * 0.8; // Tab genişliğinin %80'i
  const indicatorStyle = useAnimatedStyle(() => {
    // Indicator'ı tab genişliğine göre translate et
    // Her tab'in ortasına yerleştirmek için: tabWidth * progress + (tabWidth - indicatorWidth) / 2
    const translateX = progress.value * tabWidth + (tabWidth - indicatorWidth) / 2;
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        <Header
          title="Events"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />

        <VStack flex={1} py="$2" space="md">
          {/* Tab Header */}
          <VStack pt="$4" bg={isDark ? '#000' : '#FFF'}>
            <HStack
              ref={tabContainerRef}
              borderBottomWidth={1}
              borderColor="#E9E9E9"
              p={0}
              m={0}
              position="relative"
              onLayout={(event) => {
                const width = event.nativeEvent.layout.width;
                setTabContainerWidth(width);
              }}
            >
              {/* Community Tab Label */}
              <Pressable
                flex={1}
                onPress={() => handleTabPress(0)}
                alignItems="center"
                py="$1"
              >
                <VStack alignItems="center" space="xs">
                  <Animated.Text
                    style={[
                      {
                        fontSize: 14,
                        fontWeight: 'bold',
                      },
                      tab1Style,
                    ]}
                  >
                    Community Events
                  </Animated.Text>
                </VStack>
              </Pressable>

              {/* Achievement Tab Label */}
              <Pressable
                flex={1}
                onPress={() => handleTabPress(1)}
                alignItems="center"
                py="$1"
              >
                <VStack alignItems="center" space="xs">
                  <Animated.Text
                    style={[
                      {
                        fontSize: 14,
                        fontWeight: 'bold',
                      },
                      tab2Style,
                    ]}
                  >
                    Achievement Ladder
                  </Animated.Text>
                </VStack>
              </Pressable>

              {/* Animated Indicator */}
              {tabWidth > 0 && (
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: indicatorWidth,
                      height: 2,
                      backgroundColor: isDark ? '#FFFFFF' : '#000000',
                    },
                    indicatorStyle,
                  ]}
                />
              )}
            </HStack>
          </VStack>

          {/* PagerView - Native swipe tab switching */}
          <AnimatedPagerView
            ref={pagerRef}
            style={{ flex: 1 }}
            initialPage={0}
            onPageScroll={handlePageScroll}
            onPageSelected={handlePageSelected}
          >
            {/* Community Tab */}
            <Box key="0" flex={1}>
              <CommunityTab onEventPress={handleEventPress} />
            </Box>

            {/* Achievement Tab */}
            <Box key="1" flex={1}>
              <AchievementTab
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                onRewardPress={handleRewardPress}
              />
            </Box>
          </AnimatedPagerView>
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
