import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { Feather } from '@expo/vector-icons';
import { Bars3Icon, FunnelIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EventsStackParamList } from '../navigation';
import { navigationService } from '@/src/services/NavigationService';
import { FilterOption } from '../components/AchievementFilter';
import { CommunityTab } from '../components/TabContents';
import CollectionsTab from '../components/TabContents/CollectionsTab';
import { useDrawerStore } from '@/src/store/drawerStore';
import FilterBottomSheet, { FilterSelection } from '../components/FilterBottomSheet';
import CollectionsBottomSheet from '../components/CollectionsBottomSheet';
import type { CollectionFilters } from '../types/medusa.types';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

type EventsScreenNavigationProp = NativeStackNavigationProp<EventsStackParamList, 'EventsScreen'>;

const EventsScreen: React.FC = () => {
  const { t } = useTranslation('events');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<EventsScreenNavigationProp>();
  const { openBottomSheet } = useGlobalBottomSheet();
  const pagerRef = useRef<PagerView>(null);
  const tabContainerRef = useRef<any>(null);
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // CRITICAL: Drawer gesture'ı disable et (yatay PagerView swipe ile çakışmasını önle)
  const setGestureEnabled = useDrawerStore((state) => state.setGestureEnabled);
  const openDrawer = useDrawerStore((state) => state.openDrawer);
  
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

  // Drawer açma handler - Header component'inden alınan mantık
  const handleOpenDrawer = useCallback(() => {
    // React Navigation drawer'ı aç
    if (navigation.getParent) {
      const drawerNavigation = navigation.getParent();
      if (drawerNavigation && 'openDrawer' in drawerNavigation) {
        (drawerNavigation as any).openDrawer();
      }
    }
    // Drawer store'u da güncelle (sync için)
    openDrawer();
  }, [navigation, openDrawer]);
  
  // 🎯 CORE: Shared progress value (0 = Community Events, 1 = Collections)
  const progress = useSharedValue(0);
  
  // Tab state - currentPage'e göre hesaplanıyor
  const activeTab: 'community' | 'collections' = currentPage === 0 ? 'community' : 'collections';
  
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showCommunityFilterSheet, setShowCommunityFilterSheet] = useState(false);
  /** Community tab filter (FilterBottomSheet) - CommunityTab'a geçirilir, query params ile API'ye gider */
  const [communityFilters, setCommunityFilters] = useState<FilterSelection | null>(null);
  /** Collections tab filter (CollectionsBottomSheet) - CollectionsTab'a geçirilir */
  const [collectionFilters, setCollectionFilters] = useState<CollectionFilters | null>(null);

  // Debounce search query for API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // PERFORMANCE FIX: Background colors - direkt hesapla (useMemo overhead'i yok)
  const backgroundColor = isDark ? '#000000' : '#FFFFFF';
  const tabHeaderBgColor = '#FFFFFF'; // Tab header her zaman beyaz

  // Memoize filter change handler to prevent AchievementTab re-renders
  const handleFilterChange = useCallback((filter: FilterOption) => {
    setActiveFilter(filter);
  }, []);
  
  // Filter apply handler (Community tab - FilterBottomSheet)
  const handleFilterApply = useCallback((filters: FilterSelection) => {
    setCommunityFilters(filters);
    setShowCommunityFilterSheet(false);
  }, []);

  // Collections filter apply handler (Collections tab - CollectionsBottomSheet)
  const handleCollectionsFilterApply = useCallback((filters: CollectionFilters) => {
    setCollectionFilters(filters);
  }, []);

  // Open Collections Filter Bottom Sheet
  const handleOpenCollectionsFilter = useCallback(() => {
    openBottomSheet(
      <CollectionsBottomSheet
        onApply={handleCollectionsFilterApply}
        isDark={isDark}
        initialFilters={collectionFilters}
      />,
      {
        snapPoints: ['50%', '75%'],
      }
    );
  }, [openBottomSheet, handleCollectionsFilterApply, isDark, collectionFilters]);

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

  // Tab 1 (Community Events) label color animation
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

  // Tab 2 (Collections) label color animation
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

  // PERFORMANCE FIX: Header renklerini direkt hesapla (useMemo overhead'i yok)
  // İlk render'da anında görünür olması için sabit değerler kullan
  const headerBgColor = isDark ? '#000000' : '#FFFFFF';
  const headerTextColor = isDark ? '#FFFFFF' : '#000000';
  const HEADER_MIN_HEIGHT = 56;

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <View style={[styles.mainContainer, { backgroundColor }]}>
        {/* Inline Header - Ekranın içinde, flicker önleme */}
        <View style={[styles.header, { backgroundColor: headerBgColor }]}>
          <View style={styles.headerContent}>
            {/* Sol kısım - Menu Icon */}
            <View style={styles.headerLeft}>
              <Pressable 
                onPress={handleOpenDrawer}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Bars3Icon
                  width={22}
                  height={22}
                  color={headerTextColor}
                />
              </Pressable>
            </View>

            {/* Orta kısım - Title */}
            <View style={styles.headerCenter}>
              <Text
                style={[styles.headerTitle, { color: headerTextColor }]}
              >
                {t('list.title')}
              </Text>
            </View>

            {/* Sağ kısım - Boş */}
            <View style={styles.headerRight} />
          </View>
        </View>

        <View style={styles.contentContainer}>
          {/* Search Bar - Above tabs */}
          <View style={[styles.searchContainer, { backgroundColor }]}>
            <View style={[styles.searchBar, { backgroundColor: isDark ? '#2A2A2A' : '#F2F2F2' }]}>
              <Feather
                name="search"
                size={24}
                color="rgba(60, 60, 67, 0.6)"
              />
              <TextInput
                style={[styles.searchInput, { color: '#000' }]}
                placeholder={activeTab === 'community' ? t('search.events') : t('search.collections')}
                placeholderTextColor="#B9B9B9"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {/* Filter Icon - Community tab: FilterBottomSheet, Collections tab: CollectionsBottomSheet */}
              <Pressable
                onPress={() =>
                  activeTab === 'community'
                    ? setShowCommunityFilterSheet(true)
                    : handleOpenCollectionsFilter()
                }
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ position: 'relative' }}
              >
                <FunnelIcon
                  width={20}
                  height={20}
                  color={isDark ? '#FFF' : '#000'}
                />
              </Pressable>
            </View>
          </View>

          {/* Tab Header */}
          <View style={[styles.tabHeader, { backgroundColor: tabHeaderBgColor }]}>
            <View
              ref={tabContainerRef}
              style={styles.tabContainer}
              onLayout={(event) => {
                const width = event.nativeEvent.layout.width;
                setTabContainerWidth(width);
              }}
            >
              {/* Community Tab Label */}
              <Pressable
                style={styles.tabButton}
                onPress={() => handleTabPress(0)}
              >
                <Animated.Text style={[styles.tabLabel, tab1Style]}>
                  {t('tabs.community')}
                </Animated.Text>
              </Pressable>

              {/* Collections Tab Label */}
              <Pressable
                style={styles.tabButton}
                onPress={() => handleTabPress(1)}
              >
                <Animated.Text style={[styles.tabLabel, tab2Style]}>
                  {t('tabs.collections')}
                </Animated.Text>
              </Pressable>

              {/* Animated Indicator */}
              {tabWidth > 0 && (
                <Animated.View
                  style={[
                    styles.indicator,
                    {
                      width: indicatorWidth,
                      backgroundColor: isDark ? '#cccccc' : '#000000',
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
            {/* Community Events Tab */}
            <View key="0" style={styles.page}>
              <CommunityTab
                searchQuery={debouncedSearchQuery}
                onEventPress={handleEventPress}
                communityFilters={communityFilters}
              />
            </View>

            {/* Collections Tab */}
            <View key="1" style={styles.page}>
              <CollectionsTab
                searchQuery={debouncedSearchQuery}
                activeFilter={activeFilter}
                collectionFilters={collectionFilters}
              />
            </View>
          </AnimatedPagerView>
        </View>
      </View>
      
      {/* Community tab filter - state CommunityTab'a geçer (useActiveEvents/useUpcomingEvents query params) */}
      <FilterBottomSheet
        visible={showCommunityFilterSheet}
        onClose={() => setShowCommunityFilterSheet(false)}
        onApply={handleFilterApply}
        isDark={isDark}
      />
    </SafeAreaView>
  );
};

EventsScreen.displayName = 'EventsScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    minHeight: 56,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  searchContainer: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9E9E9',
    borderRadius: 20,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    height: 44,
    paddingVertical: 0,
  },
  tabHeader: {
    paddingBottom: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#E9E9E9',
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
});

// PERFORMANCE FIX: Memoize EventsScreen to prevent unnecessary re-renders during tab transitions
export default React.memo(EventsScreen);
