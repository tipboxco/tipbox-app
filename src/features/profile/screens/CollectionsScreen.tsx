import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  withTiming,
} from 'react-native-reanimated';
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
import { useTranslation } from '@/src/hooks/useTranslation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const { t } = useTranslation('profile');
  
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
      <View style={styles.bottomSheetContainer}>
        {/* Sticky Header */}
        <View style={[
          styles.bottomSheetHeader,
          { 
            backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF',
            borderBottomColor: isDark ? '#333333' : '#F0F0F0',
          }
        ]}>
          <View style={styles.bottomSheetHeaderContent}>
            <Pressable
              onPress={handleClose}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <ChevronLeft size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
            <View style={styles.bottomSheetHeaderTitle}>
              <Text
                style={[
                  styles.bottomSheetTitle,
                  { color: isDark ? '#FFFFFF' : '#000' }
                ]}
              >
                {badge.title}
              </Text>
            </View>
          </View>
        </View>

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
      </View>,
      {
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: false,
        animateOnMount: true,
        backdropOpacity: 0.5,
        backdropPressBehavior: 'close',
        detached: true,
        bottomInset: safeAreaBottom,
        snapPoints: ['50%', '85%'],
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
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <View style={[
        styles.mainContainer, 
        { backgroundColor: isDark ? '#000000' : '#FFFFFF' }
      ]}>
        {/* Header */}
        <Header
          title={t('collections.title', { name: user?.fullName || 'User' })}
          showBackButton
          onBackPress={() => navigation.goBack()}
        />

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[
            styles.searchBar,
            { backgroundColor: isDark ? '#2A2A2A' : '#F2F2F2' }
          ]}>
            <Feather
              name="search"
              size={20}
              color={isDark ? '#FFFFFF' : '#8C8C8C'}
            />
            <TextInput
              style={[
                styles.searchInput,
                { color: isDark ? '#FFFFFF' : '#000000' }
              ]}
              placeholder={t('collections.searchPlaceholder')}
              placeholderTextColor={isDark ? '#8C8C8C' : '#B9B9B9'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Tab Header */}
        <View style={[
          styles.tabHeader,
          { 
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            borderBottomColor: isDark ? '#333333' : '#F0F0F0',
          }
        ]}>
          <View
            ref={tabContainerRef}
            style={styles.tabContainer}
            onLayout={(event) => {
              const width = event.nativeEvent.layout.width;
              setTabContainerWidth(width);
            }}
          >
            {/* Achievements Tab Label */}
            <Pressable
              style={styles.tabButton}
              onPress={() => handleTabPress(0)}
            >
              <Animated.Text style={[styles.tabLabel, tab1Style]}>
                {t('collections.achievementBadges')}
              </Animated.Text>
            </Pressable>

            {/* Bridges Tab Label */}
            <Pressable
              style={styles.tabButton}
              onPress={() => handleTabPress(1)}
            >
              <Animated.Text style={[styles.tabLabel, tab2Style]}>
                {t('collections.bridgeBadges')}
              </Animated.Text>
            </Pressable>

            {/* Animated Indicator */}
            {tabWidth > 0 && (
              <Animated.View
                style={[
                  styles.indicator,
                  {
                    width: indicatorWidth,
                    backgroundColor: isDark ? '#FFFFFF' : '#000000',
                  },
                  indicatorStyle,
                ]}
              />
            )}
          </View>
        </View>

        {/* PagerView - Native swipe tab switching */}
        <AnimatedPagerView
          ref={pagerRef}
          style={styles.pagerView}
          initialPage={0}
          onPageScroll={handlePageScroll}
          onPageSelected={handlePageSelected}
        >
          {/* Achievements Tab */}
          <View key="0" style={styles.page}>
            <AchievementBadgesTab
              userId={userId}
              searchQuery={debouncedSearchQuery}
            />
          </View>

          {/* Bridges Tab */}
          <View key="1" style={styles.page}>
            <BridgeBadgesTab
              userId={userId}
              onBadgePress={handleBadgePress}
              searchQuery={debouncedSearchQuery}
            />
          </View>
        </AnimatedPagerView>
      </View>
    </SafeAreaView>
  );
};

CollectionsScreen.displayName = 'CollectionsScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    height: 36,
    paddingHorizontal: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 9,
    height: 36,
    paddingVertical: 0,
  },
  tabHeader: {
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    position: 'relative',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 8,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  bottomSheetContainer: {
    flex: 1,
  },
  bottomSheetHeader: {
    borderBottomWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  bottomSheetHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomSheetHeaderTitle: {
    flex: 1,
    alignItems: 'center',
    marginRight: 24,
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CollectionsScreen;
