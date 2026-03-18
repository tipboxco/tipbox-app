import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
  Modal,
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
import { Header } from '@/src/components/Header';
import type { Badge } from '@/src/mock/profile/badges/types';
import AchievementBadgesTab from '../components/TabsPage/AchievementBadgesTab';
import BridgeBadgesTab from '../components/TabsPage/BridgeBadgesTab';
import BadgeDetail from '../components/BadgeDetail';
import { useSafeAreaValues } from '@/src/utils';
import { useAppStore } from '@/src/store/appStore';
import { ProfileStackParamList } from '../navigation';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useMainCategories } from '@/src/features/events/api/hooks';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import CollectionsBottomSheet from '@/src/features/events/components/CollectionsBottomSheet';
import type { CollectionFilters } from '@/src/features/events/types/medusa.types';
import { AdjustmentsHorizontalIcon } from 'react-native-heroicons/outline';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

type CollectionsScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Collections'>;

// Memoized category chip component - prevents re-render when parent state changes
type CategoryChipItem = { id: string; name: string };

const CategoryFilterChips = React.memo(({
  categories,
  selectedId,
  isDark,
  onPress,
  onFilterPress,
  hasActiveFilter,
}: {
  categories: CategoryChipItem[];
  selectedId: string;
  isDark: boolean;
  onPress: (id: string) => void;
  onFilterPress: () => void;
  hasActiveFilter: boolean;
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterChipsContainer}
      style={styles.filterChips}
    >
      {categories.map((cat) => {
        const isActive = cat.id === selectedId;
        return (
          <Pressable
            key={cat.id}
            style={[
              styles.filterChip,
              {
                backgroundColor: isActive
                  ? (isDark ? '#FFFFFF' : '#000000')
                  : 'transparent',
                borderColor: isDark ? '#333333' : '#EFEFEF',
              },
            ]}
            onPress={() => onPress(cat.id)}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: isActive
                    ? (isDark ? '#000000' : '#FFFFFF')
                    : (isDark ? '#8C8C8C' : '#000000'),
                },
              ]}
            >
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
      {/* Filter Button */}
      <Pressable
        style={[
          styles.filterChip,
          {
            backgroundColor: hasActiveFilter
              ? (isDark ? '#FFFFFF' : '#000000')
              : 'transparent',
            borderColor: isDark ? '#333333' : '#EFEFEF',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          },
        ]}
        onPress={onFilterPress}
      >
        <AdjustmentsHorizontalIcon
          width={14}
          height={14}
          color={hasActiveFilter
            ? (isDark ? '#000000' : '#FFFFFF')
            : (isDark ? '#8C8C8C' : '#000000')}
        />
        {hasActiveFilter && (
          <View style={[
            styles.filterDot,
            { backgroundColor: isDark ? '#C2E607' : '#8B5CF6' },
          ]} />
        )}
      </Pressable>
    </ScrollView>
  );
});

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
  const [selectedChipId, setSelectedChipId] = useState<string>('all');
  const safeAreaBottom = useSafeAreaValues('bottom');
  const { t } = useTranslation('profile');
  const { openBottomSheet } = useGlobalBottomSheet();

  // Category filter state (mainCategoryId & subCategoryId)
  const [mainCategoryId, setMainCategoryId] = useState<string | undefined>(undefined);
  const [subCategoryId, setSubCategoryId] = useState<string | undefined>(undefined);

  // Fetch main categories for chip filters (only Beauty & Electronics)
  const ALLOWED_CATEGORY_NAMES = ['beauty', 'electronics'];
  const { data: mainCategoriesData } = useMainCategories();
  const chipCategories = useMemo<CategoryChipItem[]>(
    () => [
      { id: 'all', name: t('collections.all') },
      ...(mainCategoriesData ?? [])
        .filter((c) => ALLOWED_CATEGORY_NAMES.includes(c.name.toLowerCase()))
        .map((c) => ({ id: c.id, name: c.name })),
    ],
    [mainCategoriesData, t]
  );

  // Check if bottom sheet filter (subCategory) is active
  const hasActiveSubFilter = !!subCategoryId;

  // 🎯 CORE: Shared progress value (0 = Achievements, 1 = Bridges)
  const progress = useSharedValue(0);

  // Tab state - currentPage'e gore hesaplaniyor
  const activeTab: 'achievements' | 'bridges' = currentPage === 0 ? 'achievements' : 'bridges';

  // Debounce search query for API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Category chip press handler - sets mainCategoryId and clears subCategoryId
  const handleChipPress = useCallback((id: string) => {
    setSelectedChipId(id);
    if (id === 'all') {
      setMainCategoryId(undefined);
    } else {
      setMainCategoryId(id);
    }
    // Chip secildiginde subCategory temizlenir
    setSubCategoryId(undefined);
  }, []);

  // CollectionsBottomSheet filter apply handler
  const handleCollectionsFilterApply = useCallback((filters: CollectionFilters) => {
    setMainCategoryId(filters.mainCategoryId);
    setSubCategoryId(filters.subCategoryId);
    // Chip'i sync et: mainCategoryId varsa ilgili chip, yoksa 'all'
    setSelectedChipId(filters.mainCategoryId ?? 'all');
  }, []);

  // Open CollectionsBottomSheet
  const handleOpenFilter = useCallback(() => {
    openBottomSheet(
      <CollectionsBottomSheet
        onApply={handleCollectionsFilterApply}
        isDark={isDark}
        initialFilters={{
          mainCategoryId,
          subCategoryId,
        }}
      />,
      {
        snapPoints: ['50%', '75%'],
      }
    );
  }, [openBottomSheet, handleCollectionsFilterApply, isDark, mainCategoryId, subCategoryId]);

  // Tab press handler - PagerView native animasyonu ile gecis
  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
  }, []);

  // PagerView scroll handler - realtime progress guncelleme
  const handlePageScroll = useCallback(
    (e: any) => {
      'worklet';
      const { position, offset } = e.nativeEvent;
      progress.value = position + offset;
    },
    [progress]
  );

  // PagerView page selected handler - snap sonrasi progress'i sync et
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
  const indicatorWidth = tabWidth * 0.8; // Tab genisliginin %80'i
  const indicatorStyle = useAnimatedStyle(() => {
    const translateX = progress.value * tabWidth + (tabWidth - indicatorWidth) / 2;
    return {
      transform: [{ translateX }],
    };
  });

  // Badge tiklaninca modal ac
  const handleBadgePress = useCallback((badge: Badge) => {
    setSelectedBadge(badge);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedBadge(null);
  }, []);


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
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather
                  name="x-circle"
                  size={18}
                  color={isDark ? '#8C8C8C' : '#B9B9B9'}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Category Filter Chips */}
        <CategoryFilterChips
          categories={chipCategories}
          selectedId={selectedChipId}
          isDark={isDark}
          onPress={handleChipPress}
          onFilterPress={handleOpenFilter}
          hasActiveFilter={hasActiveSubFilter}
        />

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
              onBadgePress={handleBadgePress}
              searchQuery={debouncedSearchQuery}
              mainCategoryId={mainCategoryId}
              subCategoryId={subCategoryId}
            />
          </View>

          {/* Bridges Tab */}
          <View key="1" style={styles.page}>
            <BridgeBadgesTab
              userId={userId}
              onBadgePress={handleBadgePress}
              searchQuery={debouncedSearchQuery}
              mainCategoryId={mainCategoryId}
              subCategoryId={subCategoryId}
            />
          </View>
        </AnimatedPagerView>
      </View>

      {/* Badge Detail Modal */}
      <Modal
        visible={!!selectedBadge}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView
          edges={['top', 'bottom']}
          style={[styles.modalContainer, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}
        >
          {selectedBadge && (
            <>
              {/* Modal Header */}
              <View style={[
                styles.modalHeader,
                { borderBottomColor: isDark ? '#333333' : '#F0F0F0' }
              ]}>
                <Pressable
                  onPress={handleCloseModal}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <ChevronLeft size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                </Pressable>
                <Text
                  style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}
                  numberOfLines={1}
                >
                  {selectedBadge.title}
                </Text>
                <View style={{ width: 24 }} />
              </View>

              {/* Modal Content */}
              <ScrollView
                contentContainerStyle={{ paddingBottom: safeAreaBottom }}
                showsVerticalScrollIndicator={false}
              >
                <BadgeDetail
                  badge={selectedBadge}
                  onClose={handleCloseModal}
                  hideHeader
                />
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
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
    fontSize: 14,
    height: 36,
    paddingVertical: 0,
  },
  filterChips: {
    maxHeight: 48,
  },
  filterChipsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 14,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CollectionsScreen;
