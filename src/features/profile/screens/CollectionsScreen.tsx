import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  withTiming,
} from 'react-native-reanimated';
import { Box, Text, Pressable, HStack, Input, InputField, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Header } from '@/src/components/Header';
import type { Badge } from '@/src/mock/profile/badges/types';
import AchievementBadgesTab from '../components/TabsPage/AchievementBadgesTab';
import BridgeBadgesTab from '../components/TabsPage/BridgeBadgesTab';
import BadgeDetail from '../components/BadgeDetail';
import { useSafeAreaValues } from '@/src/utils';
import { useAppStore } from '@/src/store/appStore';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { ProfileStackParamList } from '../navigation';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

type CollectionsScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Collections'>;

const CollectionsScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CollectionsScreenNavigationProp>();
  const { user } = useAppStore();
  const userId = user?.id;
  const pagerRef = useRef<PagerView>(null);
  const tabContainerRef = useRef<any>(null);
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const safeAreaBottom = useSafeAreaValues('bottom');
  
  // 🎯 CORE: Shared progress value (0 = Achievements, 1 = Bridges)
  const progress = useSharedValue(0);
  
  // Tab state - currentPage'e göre hesaplanıyor
  const activeTab: 'achievements' | 'bridges' = currentPage === 0 ? 'achievements' : 'bridges';
  
  // Debounce search query for API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();

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

  // Tab 1 (Achievements) label color animation
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

  // Tab 2 (Bridges) label color animation
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

  // Rozete tıklanınca bottom sheet'i aç
  const handleBadgePress = useCallback((badge: Badge) => {
    setSelectedBadge(badge);
    
    const handleClose = () => {
      closeBottomSheet();
      setTimeout(() => setSelectedBadge(null), 300);
    };

    // Badge detail content'i hazırla
    openBottomSheet(
      <Box flex={1}>
        {/* Sticky Header */}
        <Box
          bg={isDark ? '#1F1F1F' : '#FFFFFF'}
          borderBottomWidth={1}
          borderBottomColor={isDark ? '#333333' : '#F0F0F0'}
          px={15}
          py={15}
        >
          <Box flexDirection="row" alignItems="center">
            <Pressable
              onPress={handleClose}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <ChevronLeft size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
            <Box flex={1} alignItems="center" mr={24}>
              <Text
                fontSize={16}
                fontWeight="$bold"
                color={isDark ? '$textDark50' : '#000'}
              >
                {badge.title}
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Scrollable Content */}
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: safeAreaBottom }}
          showsVerticalScrollIndicator={false}
        >
          <BadgeDetail
            badge={badge}
            onClose={handleClose}
            hideHeader={true}
          />
        </BottomSheetScrollView>
      </Box>,
      {
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        enableDynamicSizing: true,
        animateOnMount: true,
        backdropOpacity: 0.5,
        backdropPressBehavior: 'close',
        detached: true,
        bottomInset: safeAreaBottom,
        style: {
          marginHorizontal: 4,
          marginBottom: safeAreaBottom + 24,
        },
        backgroundStyle: {
          backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
          borderRadius: 20,
        },
        handleStyle: {
          backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        handleIndicatorStyle: {
          backgroundColor: isDark ? '#333333' : '#CCCCCC',
          width: 40,
          height: 4,
        },
        onChange: (index: number) => {
          // Sheet kapandığında selectedBadge'i temizle
          if (index === -1) {
            setTimeout(() => setSelectedBadge(null), 300);
          }
        },
      }
    );
  }, [openBottomSheet, closeBottomSheet, isDark, safeAreaBottom]);


  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      {/* Header */}
      <Header
        title={`${user?.fullName || 'User'}'s Collections`}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      {/* Search Bar */}
      <Box px="$4" py="$2">
        <Box
          bg={isDark ? '#2A2A2A' : '#F2F2F2'}
          borderRadius={20}
          height={36}
          px="$4"
          justifyContent="center"
        >
          <HStack alignItems="center" space="sm">
            <Feather
              name="search"
              size={20}
              color={isDark ? '#FFFFFF' : '#8C8C8C'}
            />
            <Input flex={1} borderWidth={0} bg="transparent">
              <InputField
                placeholder="Search by badge name"
                placeholderTextColor={isDark ? '#8C8C8C' : '#B9B9B9'}
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={9}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </Input>
          </HStack>
        </Box>
      </Box>

      {/* Tab Header */}
      <VStack pt={0} pb="$2" bg={isDark ? '$backgroundDark900' : '$white'}>
        <HStack
          ref={tabContainerRef}
          borderBottomWidth={1}
          borderColor={isDark ? '$borderDark800' : '$borderLight200'}
          p={0}
          m={0}
          position="relative"
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            setTabContainerWidth(width);
          }}
        >
          {/* Achievements Tab Label */}
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
                Achievements Badges
              </Animated.Text>
            </VStack>
          </Pressable>

          {/* Bridges Tab Label */}
          <Pressable
            flex={1}
            onPress={() => handleTabPress(1)}
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
                  tab2Style,
                ]}
              >
                Bridge Badges
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
        {/* Achievements Tab */}
        <Box key="0" flex={1}>
          <AchievementBadgesTab
            userId={userId}
            onBadgePress={handleBadgePress}
            searchQuery={debouncedSearchQuery}
          />
        </Box>

        {/* Bridges Tab */}
        <Box key="1" flex={1}>
          <BridgeBadgesTab
            userId={userId}
            onBadgePress={handleBadgePress}
            searchQuery={debouncedSearchQuery}
          />
        </Box>
      </AnimatedPagerView>

      </Box>
    </SafeAreaView>
  );
};

CollectionsScreen.displayName = 'CollectionsScreen';

export default CollectionsScreen;
