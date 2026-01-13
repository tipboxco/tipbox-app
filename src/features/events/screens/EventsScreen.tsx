import React, { useState, useRef, useCallback, useMemo } from 'react';
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
  Input,
  InputField,
  Text,
  Image,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalBody,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EventsStackParamList } from '../navigation';
import { navigationService } from '@/src/services/NavigationService';
import { Header } from '@/src/components/Header';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import { FilterOption } from '../components/AchievementFilter';
import { CommunityTab, AchievementTab } from '../components/TabContents';
import { useDrawerStore } from '@/src/store/drawerStore';

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
  
  // CRITICAL: Drawer gesture'ı disable et (yatay PagerView swipe ile çakışmasını önle)
  const setGestureEnabled = useDrawerStore((state) => state.setGestureEnabled);
  
  useFocusEffect(
    useCallback(() => {
      // Ekran focus aldığında drawer gesture'ı disable et
      setGestureEnabled(false);
      if (__DEV__) {
      }
      return () => {
        // Ekran blur olduğunda drawer gesture'ı tekrar enable et
        setGestureEnabled(true);
        if (__DEV__) {
        }
      };
    }, [setGestureEnabled])
  );
  
  // 🎯 CORE: Shared progress value (0 = Community, 1 = Achievement)
  const progress = useSharedValue(0);
  
  // Tab state - currentPage'e göre hesaplanıyor
  const activeTab: 'community' | 'achievement' = currentPage === 0 ? 'community' : 'achievement';
  
  const [selectedReward, setSelectedReward] = useState<SeeAllReward | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // PERFORMANCE FIX: Memoize background colors to prevent re-renders
  const backgroundColor = useMemo(() => isDark ? '$backgroundDark950' : '#FFFFFF', [isDark]);
  const tabHeaderBgColor = useMemo(() => '#FFFFFF', []); // Tab header her zaman beyaz

  const handleEventPress = (eventId: string) => {
    if (!eventId) {
      console.error('[EventsScreen] handleEventPress: eventId is missing');
      return;
    }
    try {
      // RootNavigator'dan EventDetailScreen'e navigate et (full screen banner için)
      navigationService.navigate('Event', { 
        screen: 'EventDetailScreen', 
        params: { eventId } 
      });
    } catch (error) {
      console.error('[EventsScreen] Navigation error:', error);
    }
  };

  const handleRewardPress = useCallback((reward: SeeAllReward) => {
    setSelectedReward(reward);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedReward(null);
  }, []);

  const handleViewAchievement = useCallback(() => {
    handleCloseModal();
    // Note: RewardsBadges requires eventId, but achievement ladder shows general achievements
    // Navigation removed as we don't have an eventId in this context
  }, [handleCloseModal]);

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
      <Box flex={1} bg={backgroundColor}>
        <Header
          title="Events"
          leftAction="menu"
        />

        <VStack flex={1}>
          {/* Search Bar - Above tabs */}
          <VStack
            space="md"
            pb="$4"
            px="$4"
            bg={backgroundColor}
          >
            <HStack
              alignItems="center"
              bg={isDark ? '#2A2A2A' : '#F2F2F2'}
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
                  fontSize="$xs"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </Input>
            </HStack>
          </VStack>

          {/* Tab Header */}
          <VStack pt={0} pb="$4" bg={tabHeaderBgColor}>
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
                pb={8}
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
      </Box>

      {/* Badge Detail Modal */}
      <Modal 
        isOpen={!!selectedReward} 
        onClose={handleCloseModal}
        size="lg"
      >
        <ModalBackdrop />
        <ModalContent
          bg={isDark ? '#1F1F1F' : '#FFFFFF'}
          borderRadius={16}
          marginHorizontal={24}
          marginBottom={46}
        >
          <ModalBody p="$4">
            {selectedReward && (
              <VStack space="md" alignItems="center">
                {/* Badge Title */}
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={16}
                  fontWeight="$bold"
                  textAlign="center"
                >
                  {selectedReward.title}
                </Text>

                {/* Instruction Text */}
                <Text
                  color={isDark ? '#CCCCCC' : '#000000'}
                  fontSize={12}
                  textAlign="center"
                  px="$2"
                >
                  "{selectedReward.title}" rozetini kazanmak için en az {selectedReward.task} gönderi paylaşmalısın.
                </Text>

                {/* Badge Image */}
                <Image
                  source={selectedReward.image}
                  alt={selectedReward.title}
                  width={180}
                  height={180}
                />

                {/* Progress Bar */}
                <VStack space="sm" w="100%" px="$4">
                  <Box
                    w="100%"
                    h={5}
                    bg={isDark ? '$backgroundDark700' : '#E0E0E0'}
                    borderRadius={10}
                    overflow="hidden"
                  >
                    <Box
                      w={`${((selectedReward.completed || 0) / (selectedReward.task || 1)) * 100}%`}
                      h="100%"
                      bg={selectedReward.isUnlocked ? '#0C7A24' : '#686868'}
                    />
                  </Box>
                  <Text
                    color={isDark ? '$textDark400' : '#797979'}
                    fontSize={9}
                    textAlign="center"
                  >
                    {selectedReward.isUnlocked ? 'Completed' : `${selectedReward.completed || 0}/${selectedReward.task || 1}`}
                  </Text>
                </VStack>

                {/* View Detail Button */}
                <Pressable
                  bg="#C2E607"
                  borderRadius={8}
                  h={48}
                  w="100%"
                  px="$4"
                  onPress={handleViewAchievement}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text
                    color="#000000"
                    fontSize={12}
                    fontWeight="$bold"
                  >
                    View Detail
                  </Text>
                </Pressable>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </SafeAreaView>
  );
};

EventsScreen.displayName = 'EventsScreen';

// PERFORMANCE FIX: Memoize EventsScreen to prevent unnecessary re-renders during tab transitions
export default React.memo(EventsScreen);
