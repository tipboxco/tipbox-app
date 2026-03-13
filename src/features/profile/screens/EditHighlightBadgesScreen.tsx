import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import {
  VStack,
  HStack,
  Text,
  Image,
  Box,
  Pressable,
  ScrollView,
} from '@gluestack-ui/themed';
import { XMarkIcon, PlusIcon, CheckIcon } from 'react-native-heroicons/solid';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { ProfileStackParamList } from '../navigation';
import { useHighlightBadges, useUpdateHighlightBadges, useUserCollectionBridges } from '../api/hooks';
import { toImageSource, useCurrentUserIdOrLogout } from '@/src/utils';
import type { Badge } from '@/src/mock/profile/badges/types';
import type { CollectionBadgeApiItem } from '../types';
import { useTranslation } from '@/src/hooks/useTranslation';

type ProfileEditHighlightBadgesNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'EditHighlightBadges'>;
type ProfileEditHighlightBadgesRouteProp = RouteProp<ProfileStackParamList, 'EditHighlightBadges'>;

const SLOT_COUNT = 4;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 10;
const BADGE_CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 2) / 3;

const mapApiItemToBadge = (item: CollectionBadgeApiItem, category: 'achievement' | 'bridge'): Badge => ({
  id: item.id,
  title: item.title,
  icon: toImageSource(item.image ?? '') || require('@/assets/defaultImages/default-badge.png'),
  rarity: item.rarity,
  category,
  earnedDate: item.earnedDate,
  totalEarned: item.totalEarned,
  isClaimed: item.isClaimed,
  nftAddress: item.nftAddress,
  tasks: item.tasks,
});

const EditHighlightBadgesScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<ProfileEditHighlightBadgesNavigationProp>();
  const route = useRoute<ProfileEditHighlightBadgesRouteProp>();
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const currentUserId = useCurrentUserIdOrLogout();
  const { t } = useTranslation('profile');

  // Fetch highlight badges to get current selected IDs
  const { data: highlightData, isLoading: isLoadingHighlights } = useHighlightBadges();

  // Fetch all available badges (achievements + bridges) for selection
  const { data: bridgesData, isLoading: isLoadingBadges } = useUserCollectionBridges(currentUserId, 50);

  const { mutateAsync: saveHighlightBadges } = useUpdateHighlightBadges();

  // Derive badge lists from API data
  const eventBadges: Badge[] = useMemo(() => {
    const allPages = bridgesData?.pages ?? [];
    const items = allPages.flatMap((page) => page.achievement?.items ?? []);
    const unique = new Map<string, CollectionBadgeApiItem>();
    for (const item of items) {
      if (!unique.has(item.id)) unique.set(item.id, item);
    }
    return Array.from(unique.values()).map((item) => mapApiItemToBadge(item, 'achievement'));
  }, [bridgesData]);

  const collectionBadges: Badge[] = useMemo(() => {
    const allPages = bridgesData?.pages ?? [];
    const items = allPages.flatMap((page) => page.brand?.items ?? []);
    const unique = new Map<string, CollectionBadgeApiItem>();
    for (const item of items) {
      if (!unique.has(item.id)) unique.set(item.id, item);
    }
    return Array.from(unique.values()).map((item) => mapApiItemToBadge(item, 'bridge'));
  }, [bridgesData]);

  // All badges combined for slot lookup
  const allBadges = useMemo(() => [...eventBadges, ...collectionBadges], [eventBadges, collectionBadges]);

  // Initialize slots from route params or highlight API response
  const initialBadgeIds = useMemo(() => {
    const routeIds = route.params?.initialBadgeIds;
    if (routeIds && routeIds.length > 0) return routeIds;
    return highlightData?.badgeIds ?? [];
  }, [route.params?.initialBadgeIds, highlightData?.badgeIds]);

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
  }, []);

  const handlePageSelected = useCallback((e: { nativeEvent: { position: number } }) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

  const tabBorderColor = isDark ? '#FFFFFF' : '#000000';
  const tabInactiveColor = '#9D9D9D';
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const cardBorder = isDark ? '#2A2A2A' : '#F0F0F0';

  const isLoading = isLoadingHighlights || isLoadingBadges;

  const renderBadgeGrid = (badges: Badge[]) => {
    if (badges.length === 0) {
      return (
        <Text color={isDark ? '#9D9D9D' : '#8A8A8A'} fontSize="$sm" textAlign="center" mt="$4">
          {currentPage === 0
            ? t('editHighlightBadges.noEventBadges')
            : t('editHighlightBadges.noCollectionBadges')}
        </Text>
      );
    }

    return (
      <View style={styles.gridWrapper}>
        {badges.map((badge) => {
          const selected = isBadgeInSlots(badge.id);
          return (
            <Pressable
              key={badge.id}
              onPress={() => handleBadgePress(badge)}
              style={[
                styles.badgeCard,
                {
                  backgroundColor: selected
                    ? (isDark ? '#2A2A2A' : '#F0F0F0')
                    : cardBg,
                  borderColor: selected
                    ? (isDark ? '#444' : '#E0E0E0')
                    : cardBorder,
                },
              ]}
            >
              <View style={styles.badgeImageContainer}>
                <Image
                  source={badge.icon}
                  alt={badge.title}
                  style={styles.badgeImage}
                  resizeMode="contain"
                />
                {selected && (
                  <View style={[styles.checkBadge, { backgroundColor: '#C8E600' }]}>
                    <CheckIcon width={10} height={10} color="#000000" />
                  </View>
                )}
              </View>
              <Text
                fontSize={11}
                fontWeight="$semibold"
                color={isDark ? '#FFFFFF' : '#000000'}
                textAlign="center"
                numberOfLines={2}
                mt="$1"
              >
                {badge.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
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

      {/* Tabs */}
      <HStack borderBottomWidth={1} borderColor={isDark ? '#262626' : '#E9E9E9'}>
        <Pressable
          flex={1}
          py="$3"
          alignItems="center"
          borderBottomWidth={2}
          borderBottomColor={currentPage === 0 ? tabBorderColor : 'transparent'}
          onPress={() => handleTabPress(0)}
        >
          <Text
            fontSize="$sm"
            fontWeight={currentPage === 0 ? '$bold' : '$normal'}
            color={currentPage === 0 ? (isDark ? '#FFFFFF' : '#000000') : tabInactiveColor}
          >
            {t('editHighlightBadges.eventBadges')}
          </Text>
        </Pressable>
        <Pressable
          flex={1}
          py="$3"
          alignItems="center"
          borderBottomWidth={2}
          borderBottomColor={currentPage === 1 ? tabBorderColor : 'transparent'}
          onPress={() => handleTabPress(1)}
        >
          <Text
            fontSize="$sm"
            fontWeight={currentPage === 1 ? '$bold' : '$normal'}
            color={currentPage === 1 ? (isDark ? '#FFFFFF' : '#000000') : tabInactiveColor}
          >
            {t('editHighlightBadges.collections')}
          </Text>
        </Pressable>
      </HStack>

      {/* Badge grid pages */}
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        <View key="0" style={styles.page}>
          <ScrollView
            style={styles.scrollPage}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
          >
            {renderBadgeGrid(eventBadges)}
          </ScrollView>
        </View>
        <View key="1" style={styles.page}>
          <ScrollView
            style={styles.scrollPage}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
          >
            {renderBadgeGrid(collectionBadges)}
          </ScrollView>
        </View>
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
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  badgeCard: {
    width: BADGE_CARD_WIDTH,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeImageContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeImage: {
    width: 64,
    height: 64,
  },
  checkBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default EditHighlightBadgesScreen;
