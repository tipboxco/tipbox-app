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

type ProfileEditHighlightBadgesNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'EditHighlightBadges'>;
type ProfileEditHighlightBadgesRouteProp = RouteProp<ProfileStackParamList, 'EditHighlightBadges'>;

const SLOT_COUNT = 4;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  const isLoading = isLoadingHighlights || isLoadingBadges;

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
      {/* Header: X | Edit Highlight Badges | Save */}
      <HStack
        alignItems="center"
        justifyContent="space-between"
        px="$4"
        py="$3"
        borderBottomWidth={1}
        borderColor={isDark ? '#262626' : '#E9E9E9'}
      >
        <Pressable onPress={handleClose} hitSlop={12} p="$2">
          <XMarkIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text fontSize="$lg" fontWeight="$bold" color={isDark ? '#FFFFFF' : '#000000'}>
          Edit Highlight Badges
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          bg="#3CA241"
          borderRadius={8}
          px="$4"
          py="$2"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text color="#FFFFFF" fontSize="$sm" fontWeight="$bold">
              Save
            </Text>
          )}
        </Pressable>
      </HStack>

      {/* 4 slot row */}
      <HStack px="$4" py="$4" space="md" justifyContent="space-between">
        {Array.from({ length: SLOT_COUNT }, (_, index) => {
          const badgeId = slots[index];
          const badge = badgeId ? allBadges.find((b) => b.id === badgeId) : null;
          const isSelectedSlot = selectedSlotIndex === index;
          return (
            <Box key={index} flex={1} alignItems="center">
              {badge ? (
                <Pressable
                  onPress={() => handleRemoveFromSlot(index)}
                  position="relative"
                  w={72}
                  h={72}
                  borderRadius={10}
                  overflow="hidden"
                  bg={isDark ? '#1A1A1A' : '#F5F5F5'}
                  alignItems="center"
                  justifyContent="center"
                  borderWidth={isSelectedSlot ? 2 : 0}
                  borderColor="#3CA241"
                >
                  <Image
                    source={badge.icon}
                    alt={badge.title}
                    w={56}
                    h={56}
                    resizeMode="contain"
                  />
                  <Box
                    position="absolute"
                    top={4}
                    right={4}
                    w={20}
                    h={20}
                    borderRadius={10}
                    bg="#E53935"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <XMarkIcon width={12} height={12} color="#FFFFFF" />
                  </Box>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => handleEmptySlotPress(index)}
                  w={72}
                  h={72}
                  borderRadius={10}
                  borderWidth={2}
                  borderStyle="dashed"
                  borderColor={isDark ? '#555' : '#CCC'}
                  bg={isDark ? 'transparent' : 'transparent'}
                  alignItems="center"
                  justifyContent="center"
                >
                  <PlusIcon width={28} height={28} color={isDark ? '#666' : '#999'} />
                </Pressable>
              )}
            </Box>
          );
        })}
      </HStack>

      {/* Tabs: Event Badges | Collections */}
      <HStack borderBottomWidth={1} borderColor="#E9E9E9" px="$4" mb="$2">
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
            Event Badges
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
            Collections
          </Text>
        </Pressable>
      </HStack>

      {/* PagerView: Event Badges grid | Collections grid */}
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
            <VStack p="$4" space="lg">
              {eventBadges.length === 0 ? (
                <Text color={isDark ? '#9D9D9D' : '#8A8A8A'} fontSize="$sm" textAlign="center" mt="$4">
                  No event badges yet.
                </Text>
              ) : (
                Array.from({ length: Math.ceil(eventBadges.length / 3) }, (_, rowIndex) => (
                  <HStack key={rowIndex} space="md" justifyContent="flex-start">
                    {eventBadges.slice(rowIndex * 3, rowIndex * 3 + 3).map((badge) => {
                      const selected = isBadgeInSlots(badge.id);
                      return (
                        <Pressable
                          key={badge.id}
                          onPress={() => handleBadgePress(badge)}
                          flex={1}
                          alignItems="center"
                          py="$2"
                        >
                          <Box position="relative" w={72} h={72} alignItems="center" justifyContent="center">
                            <Box
                              w={72}
                              h={72}
                              borderRadius={10}
                              overflow="hidden"
                              bg={isDark ? '#1A1A1A' : '#F5F5F5'}
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Image source={badge.icon} alt={badge.title} w={56} h={56} resizeMode="contain" />
                            </Box>
                            {selected && (
                              <Box
                                position="absolute"
                                top={4}
                                right={4}
                                w={22}
                                h={22}
                                borderRadius={11}
                                bg="#3CA241"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <CheckIcon width={14} height={14} color="#FFFFFF" />
                              </Box>
                            )}
                          </Box>
                          <Text
                            fontSize="$xs"
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
                  </HStack>
                ))
              )}
            </VStack>
          </ScrollView>
        </View>
        <View key="1" style={styles.page}>
          <ScrollView
            style={styles.scrollPage}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
          >
            <VStack p="$4" space="lg">
              {collectionBadges.length === 0 ? (
                <Text color={isDark ? '#9D9D9D' : '#8A8A8A'} fontSize="$sm" textAlign="center" mt="$4">
                  No collection badges yet.
                </Text>
              ) : (
                Array.from({ length: Math.ceil(collectionBadges.length / 3) }, (_, rowIndex) => (
                  <HStack key={rowIndex} space="md" justifyContent="flex-start">
                    {collectionBadges.slice(rowIndex * 3, rowIndex * 3 + 3).map((badge) => {
                      const selected = isBadgeInSlots(badge.id);
                      return (
                        <Pressable
                          key={badge.id}
                          onPress={() => handleBadgePress(badge)}
                          flex={1}
                          alignItems="center"
                          py="$2"
                        >
                          <Box position="relative" w={72} h={72} alignItems="center" justifyContent="center">
                            <Box
                              w={72}
                              h={72}
                              borderRadius={10}
                              overflow="hidden"
                              bg={isDark ? '#1A1A1A' : '#F5F5F5'}
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Image source={badge.icon} alt={badge.title} w={56} h={56} resizeMode="contain" />
                            </Box>
                            {selected && (
                              <Box
                                position="absolute"
                                top={4}
                                right={4}
                                w={22}
                                h={22}
                                borderRadius={11}
                                bg="#3CA241"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <CheckIcon width={14} height={14} color="#FFFFFF" />
                              </Box>
                            )}
                          </Box>
                          <Text
                            fontSize="$xs"
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
                  </HStack>
                ))
              )}
            </VStack>
          </ScrollView>
        </View>
      </PagerView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  pagerView: { flex: 1, width: SCREEN_WIDTH },
  page: { flex: 1, width: SCREEN_WIDTH },
  scrollPage: { flex: 1 },
  gridContent: { flexGrow: 1, paddingBottom: 24 },
});

export default EditHighlightBadgesScreen;
