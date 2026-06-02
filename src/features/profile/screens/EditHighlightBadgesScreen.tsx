import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Pressable as RNPressable, Text as RNText } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import {
  VStack,
  Text,
  Image,
  Pressable,
  ScrollView,
} from '@gluestack-ui/themed';
import { XMarkIcon, PlusIcon, CheckIcon } from 'react-native-heroicons/solid';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { ProfileStackParamList } from '../navigation';
import { useHighlightBadges, useUpdateHighlightBadges } from '../api/hooks';
import { toImageSource } from '@/src/utils';
import type { Badge } from '@/src/mock/profile/badges/types';
import type { HighlightBadgeItem } from '../types';
import { useTranslation } from '@/src/hooks/useTranslation';

type ProfileEditHighlightBadgesNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'EditHighlightBadges'>;
type ProfileEditHighlightBadgesRouteProp = RouteProp<ProfileStackParamList, 'EditHighlightBadges'>;

const SLOT_COUNT = 4;
const PAGE_SIZE = 10;
const TAB_COUNT = 4;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 8;
const BADGE_CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 2) / 3;

const TAB_KEYS = ['event', 'collection', 'cosmetic', 'brand'] as const;
type TabKey = typeof TAB_KEYS[number];

const mapHighlightBadgeToBadge = (item: HighlightBadgeItem, category: TabKey): Badge => ({
  id: item.id,
  title: item.title,
  icon: toImageSource(item.image ?? '') || require('@/assets/defaultImages/default-badge.png'),
  rarity: item.rarity,
  category,
});

/** Animated underline indicator that follows swipe gesture in real-time */
const AnimatedTabIndicator: React.FC<{
  position: Animated.SharedValue<number>;
  tabCount: number;
  color: string;
}> = ({ position, tabCount, color }) => {
  const tabWidth = SCREEN_WIDTH / tabCount;
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value * tabWidth }],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: tabWidth,
          height: 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

const EditHighlightBadgesScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<ProfileEditHighlightBadgesNavigationProp>();
  const route = useRoute<ProfileEditHighlightBadgesRouteProp>();
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const { t } = useTranslation('profile');

  // Pagination: visible count per tab
  const [visibleCounts, setVisibleCounts] = useState<Record<number, number>>({
    0: PAGE_SIZE, 1: PAGE_SIZE, 2: PAGE_SIZE, 3: PAGE_SIZE,
  });

  // Animated tab indicator position (0..TAB_COUNT-1)
  const tabScrollPosition = useSharedValue(0);

  // Fetch highlight badges - includes selectedBadgeIds and availableBadges (4 categories)
  const { data: highlightData, isLoading } = useHighlightBadges();

  const { mutateAsync: saveHighlightBadges } = useUpdateHighlightBadges();

  // Derive badge lists from API data per category
  const eventBadges: Badge[] = useMemo(() => {
    return (highlightData?.availableBadges?.event ?? []).map((item) => mapHighlightBadgeToBadge(item, 'event'));
  }, [highlightData]);

  const collectionBadges: Badge[] = useMemo(() => {
    return (highlightData?.availableBadges?.collection ?? []).map((item) => mapHighlightBadgeToBadge(item, 'collection'));
  }, [highlightData]);

  const cosmeticBadges: Badge[] = useMemo(() => {
    return (highlightData?.availableBadges?.cosmetic ?? []).map((item) => mapHighlightBadgeToBadge(item, 'cosmetic'));
  }, [highlightData]);

  const brandBadges: Badge[] = useMemo(() => {
    return (highlightData?.availableBadges?.brand ?? []).map((item) => mapHighlightBadgeToBadge(item, 'brand'));
  }, [highlightData]);

  const badgesByTab: Badge[][] = useMemo(() => [eventBadges, collectionBadges, cosmeticBadges, brandBadges], [eventBadges, collectionBadges, cosmeticBadges, brandBadges]);

  // All badges combined for slot lookup
  const allBadges = useMemo(() => [...eventBadges, ...collectionBadges, ...cosmeticBadges, ...brandBadges], [eventBadges, collectionBadges, cosmeticBadges, brandBadges]);

  // Initialize slots from route params or highlight API response
  const initialBadgeIds = useMemo(() => {
    const routeIds = route.params?.initialBadgeIds;
    if (routeIds && routeIds.length > 0) return routeIds;
    return highlightData?.selectedBadgeIds ?? [];
  }, [route.params?.initialBadgeIds, highlightData?.selectedBadgeIds]);

  const [slots, setSlots] = useState<(string | null)[]>(() => {
    const arr: (string | null)[] = [];
    for (let i = 0; i < SLOT_COUNT; i++) arr.push(initialBadgeIds[i] ?? null);
    return arr;
  });
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isBadgeInSlots = useCallback(
    (badgeId: string) => slots.some((id) => id === badgeId),
    [slots]
  );

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const badgeIds = slots.filter((id): id is string => id != null && id !== '');
      await saveHighlightBadges({ badgeIds });
      navigation.goBack();
    } catch (error) {
      console.error('[EditHighlightBadgesScreen] Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [slots, navigation, saveHighlightBadges]);

  const handleRemoveFromSlot = useCallback((index: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setSelectedSlotIndex(null);
  }, []);

  const handleEmptySlotPress = useCallback((index: number) => {
    setSelectedSlotIndex(index);
  }, []);

  const handleBadgePress = useCallback(
    (badge: Badge) => {
      const inSlots = slots.indexOf(badge.id);
      if (inSlots !== -1) {
        setSlots((prev) => {
          const next = [...prev];
          next[inSlots] = null;
          return next;
        });
        setSelectedSlotIndex(null);
        return;
      }
      if (selectedSlotIndex !== null) {
        setSlots((prev) => {
          const next = [...prev];
          next[selectedSlotIndex] = badge.id;
          return next;
        });
        setSelectedSlotIndex(null);
        return;
      }
      const firstEmpty = slots.findIndex((id) => id == null || id === '');
      if (firstEmpty !== -1) {
        setSlots((prev) => {
          const next = [...prev];
          next[firstEmpty] = badge.id;
          return next;
        });
      }
    },
    [slots, selectedSlotIndex]
  );

  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    tabScrollPosition.value = withTiming(index, { duration: 200, easing: Easing.out(Easing.quad) });
  }, []);

  const handlePageSelected = useCallback((e: { nativeEvent: { position: number } }) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

  const handlePageScroll = useCallback((e: { nativeEvent: { position: number; offset: number } }) => {
    const { position, offset } = e.nativeEvent;
    tabScrollPosition.value = position + offset;
  }, []);

  const handleLoadMore = useCallback((tabIndex: number) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [tabIndex]: (prev[tabIndex] ?? PAGE_SIZE) + PAGE_SIZE,
    }));
  }, []);

  const tabBorderColor = isDark ? '#FFFFFF' : '#000000';
  const tabInactiveColor = '#9D9D9D';

  const tabLabels = [
    t('editHighlightBadges.eventBadges'),
    t('editHighlightBadges.collections'),
    t('editHighlightBadges.cosmetic'),
    t('editHighlightBadges.brand'),
  ];

  const emptyMessages = [
    t('editHighlightBadges.noEventBadges'),
    t('editHighlightBadges.noCollectionBadges'),
    t('editHighlightBadges.noCosmeticBadges'),
    t('editHighlightBadges.noBrandBadges'),
  ];

  const renderBadgeGrid = (badges: Badge[], tabIndex: number) => {
    if (badges.length === 0) {
      return (
        <Text color={isDark ? '#9D9D9D' : '#8A8A8A'} fontSize="$sm" textAlign="center" mt="$4">
          {emptyMessages[tabIndex]}
        </Text>
      );
    }

    const visibleCount = visibleCounts[tabIndex] ?? PAGE_SIZE;
    const visibleBadges = badges.slice(0, visibleCount);
    const hasMore = badges.length > visibleCount;

    return (
      <>
        <View style={styles.gridWrapper}>
          {visibleBadges.map((badge) => {
            const selected = isBadgeInSlots(badge.id);
            return (
              <RNPressable
                key={badge.id}
                onPress={() => handleBadgePress(badge)}
                style={[
                  styles.badgeCard,
                  { borderColor: selected ? (isDark ? '#444' : '#E0E0E0') : (isDark ? '#333' : '#E9E9E9') },
                ]}
              >
                <View style={[styles.badgeImageContainer, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}>
                  <View style={[styles.badgeImageCircleWrapper, { backgroundColor: isDark ? '#262626' : '#EBEBEB' }]}>
                    <Image
                      source={badge.icon}
                      alt={badge.title}
                      style={styles.badgeImage}
                      resizeMode="contain"
                    />
                  </View>
                  {selected && (
                    <View style={[styles.checkBadge, { backgroundColor: '#C8E600' }]}>
                      <CheckIcon width={10} height={10} color="#000000" />
                    </View>
                  )}
                </View>
                <View style={[styles.badgeTitleContainer, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
                  <RNText
                    numberOfLines={1}
                    style={[styles.badgeTitleText, { color: isDark ? '#FFFFFF' : '#000000' }]}
                  >
                    {badge.title}
                  </RNText>
                </View>
              </RNPressable>
            );
          })}
        </View>
        {hasMore && (
          <RNPressable
            onPress={() => handleLoadMore(tabIndex)}
            style={[styles.loadMoreButton, { borderColor: isDark ? '#333' : '#E0E0E0' }]}
          >
            <RNText style={[styles.loadMoreText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {t('editHighlightBadges.loadMore')}
            </RNText>
          </RNPressable>
        )}
      </>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
        <VStack flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleClose} hitSlop={12} p="$2">
          <XMarkIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text fontSize="$lg" fontWeight="$bold" color={isDark ? '#FFFFFF' : '#000000'}>
          {t('editHighlightBadges.title')}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          bg="#D8FF08"
          borderRadius={20}
          px="$5"
          py="$2"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#111111" />
          ) : (
            <Text color="#111111" fontSize="$sm" fontWeight="$bold">
              {t('editHighlightBadges.save')}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Slots container */}
      <View style={[styles.slotsContainer, {
        backgroundColor: isDark ? '#111111' : '#F8F8F8',
        borderColor: isDark ? '#2A2A2A' : '#ECECEC',
      }]}>
        <View style={styles.slotsRow}>
          {Array.from({ length: SLOT_COUNT }, (_, index) => {
            const badgeId = slots[index];
            const badge = badgeId ? allBadges.find((b) => b.id === badgeId) : null;
            const isSelectedSlot = selectedSlotIndex === index;
            const isFirst = index === 0;
            return (
              <View key={index} style={[styles.slotItem, !isFirst && { marginLeft: 8 }]}>
                {badge ? (
                  <Pressable onPress={() => handleRemoveFromSlot(index)}>
                    <View style={[styles.slotFilled, isSelectedSlot && styles.slotSelected]}>
                      <Image
                        source={badge.icon}
                        alt={badge.title}
                        style={styles.slotImage}
                        resizeMode="contain"
                      />
                      <View style={styles.removeButton}>
                        <XMarkIcon width={10} height={10} color="#FFFFFF" />
                      </View>
                    </View>
                    <Text
                      fontSize={9}
                      fontWeight="$medium"
                      color={isDark ? '#FFFFFF' : '#000000'}
                      textAlign="center"
                      numberOfLines={1}
                      mt={4}
                    >
                      {badge.title}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => handleEmptySlotPress(index)}>
                    <View style={[styles.slotEmpty, {
                      borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                    }]}>
                      <PlusIcon width={22} height={22} color={isDark ? '#555' : '#B0B0B0'} />
                    </View>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Tabs - 4 tabs with animated indicator */}
      <View style={[styles.tabsContainer, { borderBottomColor: isDark ? '#262626' : '#E9E9E9' }]}>
        {TAB_KEYS.map((key, index) => (
          <RNPressable
            key={key}
            style={styles.tabButton}
            onPress={() => handleTabPress(index)}
          >
            <RNText
              style={[
                styles.tabText,
                {
                  fontWeight: currentPage === index ? '700' : '400',
                  color: currentPage === index ? (isDark ? '#FFFFFF' : '#000000') : tabInactiveColor,
                },
              ]}
            >
              {tabLabels[index]}
            </RNText>
          </RNPressable>
        ))}
        <AnimatedTabIndicator
          position={tabScrollPosition}
          tabCount={TAB_COUNT}
          color={tabBorderColor}
        />
      </View>

      {/* Badge grid pages - 4 pages */}
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
        onPageScroll={handlePageScroll}
      >
        {TAB_KEYS.map((key, index) => (
          <View key={key} style={styles.page}>
            <ScrollView
              style={styles.scrollPage}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={false}
            >
              {renderBadgeGrid(badgesByTab[index], index)}
            </ScrollView>
          </View>
        ))}
      </PagerView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  slotsContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  slotItem: {
    flex: 1,
    alignItems: 'center',
  },
  slotFilled: {
    width: 68,
    height: 68,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  slotSelected: {
    borderWidth: 2,
    borderColor: '#3CA241',
  },
  slotImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotEmpty: {
    width: 68,
    height: 68,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagerView: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  page: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  scrollPage: {
    flex: 1,
  },
  gridContent: {
    flexGrow: 1,
    paddingBottom: 24,
    paddingHorizontal: GRID_PADDING,
    paddingTop: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    position: 'relative',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
  },
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  badgeCard: {
    width: BADGE_CARD_WIDTH,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  badgeImageContainer: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  badgeImageCircleWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeImage: {
    width: '100%',
    height: '100%',
  },
  badgeTitleContainer: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  badgeTitleText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default EditHighlightBadgesScreen;
