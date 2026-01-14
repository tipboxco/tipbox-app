import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { FlatList, Dimensions, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager, ActivityIndicator } from 'react-native';
import { VStack, HStack, Text, Image, Box } from '@gluestack-ui/themed';
import { CheckIcon } from 'react-native-heroicons/solid';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useUserLadderBadges } from '../../api/hooks';
import { useCurrentUserIdOrLogout } from '@/src/utils';
import { toImageSource } from '@/src/utils';
import type { ProfileLadderBadge } from '../../types';
import BadgeDetailModal from '../BadgeDetailModal';

interface LadderTabProps {
  onLadderSelect?: (ladder: ProfileLadderBadge) => void;
}

const { width } = Dimensions.get('window');
const COLUMN_GAP = 10;
const NUM_COLUMNS = 2;
const CARD_MARGIN = 15;
const CARD_WIDTH = (width - (CARD_MARGIN * 2) - (COLUMN_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

// Android için layout animasyonlarını etkinleştir
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LadderTabComponent: React.FC<LadderTabProps> = ({ onLadderSelect }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const userId = useCurrentUserIdOrLogout();
  
  // Render sayısını takip et ve değişen değerleri log'la
  const renderCountRef = useRef(0);
  const prevValuesRef = useRef<any>({});
  
  // Ladder Badges API hook with infinite scroll
  const {
    data: ladderBadgesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useUserLadderBadges(userId, 5);

  useEffect(() => {
    renderCountRef.current += 1;
    const currentValues = {
      userId,
      colorMode,
      dataPagesCount: ladderBadgesData?.pages?.length,
      hasNextPage,
      isFetchingNextPage,
      isLoading,
      error: error?.message,
    };
    
    const changedValues: string[] = [];
    Object.keys(currentValues).forEach((key) => {
      const typedKey = key as keyof typeof currentValues;
      if (prevValuesRef.current[typedKey] !== currentValues[typedKey]) {
        changedValues.push(`${key}: ${prevValuesRef.current[typedKey]} → ${currentValues[typedKey]}`);
      }
    });
    
    console.log(`[LadderTab] Render #${renderCountRef.current}`, {
      changed: changedValues.length > 0 ? changedValues : ['No changes detected'],
      current: currentValues,
    });
    
    prevValuesRef.current = currentValues;
  });

  // Flatten all pages into a single array - Duplicate ID'leri filtrele
  const ladderBadges = useMemo(() => {
    if (!ladderBadgesData?.pages) return [];
    const allItems = ladderBadgesData.pages.flatMap((page) => page.items ?? []);
    
    // Detaylı log: Duplicate filter öncesi
    console.log('[LadderTab] Duplicate Filter Öncesi:', {
      pagesCount: ladderBadgesData.pages.length,
      allItemsCount: allItems.length,
      allItemIds: allItems.map((item) => item.id),
      pagesItemIds: ladderBadgesData.pages.map((page, idx) => ({
        pageIndex: idx,
        itemIds: page.items?.map((item) => item.id) || [],
      })),
    });
    
    // ID'ye göre unique item'ları filtrele
    const uniqueItems = allItems.filter((item, index, self) => 
      index === self.findIndex((t) => t.id === item.id)
    );
    
    // Detaylı log: Duplicate filter sonrası
    console.log('[LadderTab] Duplicate Filter Sonrası:', {
      allItemsCount: allItems.length,
      uniqueItemsCount: uniqueItems.length,
      duplicatesRemoved: allItems.length - uniqueItems.length,
      uniqueItemIds: uniqueItems.map((item) => item.id),
    });
    
    return uniqueItems;
  }, [ladderBadgesData]);

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [selectedBadge, setSelectedBadge] = useState<ProfileLadderBadge | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // onEndReached loop'unu önlemek için ref
  const isLoadingMoreRef = useRef(false);

  // ladderBadges.length değiştiğinde ref'i güncelle
  useEffect(() => {
    // Item sayısı değiştiğinde flag'i reset et (yeni veri geldi demektir)
    isLoadingMoreRef.current = false;
  }, [ladderBadges.length]);

  const handleLoadMore = useCallback(() => {
    // Eğer zaten yükleme yapılıyorsa, tekrar tetikleme
    if (isLoadingMoreRef.current) {
      return;
    }

    // Eğer hasNextPage false ise veya zaten fetch yapılıyorsa, işlem yapma
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    // Flag'i set et
    isLoadingMoreRef.current = true;

    fetchNextPage()
      .finally(() => {
        // Fetch tamamlandığında flag'i reset et
        // Kısa bir delay ekle ki onEndReached tekrar tetiklenmesin
        setTimeout(() => {
          isLoadingMoreRef.current = false;
        }, 1000);
      });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, ladderBadges.length]);

  // Filtreleme değiştiğinde animasyon için
  const handleFilterChange = (newFilter: 'all' | 'in_progress' | 'completed') => {
    // Önce fade out animasyonu
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Layout animasyonunu yapılandır
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      // Filtre değerini güncelle
      setSelectedFilter(newFilter);

      // Fade in animasyonu
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  // Badge seçildiğinde modal'ı aç
  const handleBadgePress = useCallback((badge: ProfileLadderBadge) => {
    setSelectedBadge(badge);
    setIsModalVisible(true);
    onLadderSelect?.(badge);
  }, [onLadderSelect]);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setSelectedBadge(null);
  }, []);

  // isCompleted kontrolü: total >= current
  const getIsCompleted = (badge: ProfileLadderBadge): boolean => {
    return badge.total >= badge.current;
  };

  const renderItem = ({ item: badge }: { item: ProfileLadderBadge }) => {
    const isCompleted = getIsCompleted(badge);
    const imageSource = badge.image ? toImageSource(badge.image) : undefined;
    const defaultImage = require('@/assets/defaultImages/default-badge.png');

    return (
      <TouchableOpacity onPress={() => handleBadgePress(badge)} activeOpacity={0.7}>
        <Box
          bg={isDark ? '$backgroundDark800' : '$white'}
          borderWidth={1}
          borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
          borderRadius={10}
          h={250}
          w={CARD_WIDTH}
          overflow="hidden"
          position="relative"
          shadowColor={isDark ? '$backgroundDark950' : '#000'}
          shadowOffset={{ width: 0, height: 0 }}
          shadowOpacity={0.25}
          shadowRadius={3}
          mb={10}
        >
          <Image
            source={imageSource || defaultImage}
            alt={badge.title}
            w={150}
            h={150}
            resizeMode="contain"
            alignSelf="center"
            mt={5}
          />

          <VStack space="xs" position="absolute" bottom={15} left={15} right={15}>
            <HStack space="sm" alignItems="center">
              <Text
                color={isDark ? '$textDark50' : '#000'}
                fontSize={12}
                fontWeight="$semibold"
                textAlign="center"
                w="100%"
              >
                {badge.title}
              </Text>
            </HStack>

            <Text
              color={isDark ? '$textDark400' : '#575757'}
              fontSize={9}
              lineHeight={11}
              textAlign="center"
              w="100%"
            >
              {badge.description}
            </Text>

            <VStack space="xs" mt={10}>
              <Box
                w="100%"
                h={5}
                bg={isDark ? '$backgroundDark700' : '#E0E0E0'}
                borderRadius={10}
                overflow="hidden"
              >
                <Box
                  w={`${(badge.current / badge.total) * 100}%`}
                  h="100%"
                  bg={isCompleted ? '#0C7A24' : '#686868'}
                />
              </Box>
              <Text
                color={isDark ? '$textDark400' : '#797979'}
                fontSize={9}
                textAlign="center"
              >
                {isCompleted ? 'Completed' : `${badge.current}/${badge.total}`}
              </Text>
            </VStack>
          </VStack>

          {isCompleted && (
            <>
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg="rgba(47, 61, 36, 0.25)"
              />
              <Box
                position="absolute"
                top={12}
                right={12}
                bg="$success600"
                borderRadius={100}
                w={18}
                h={18}
                alignItems="center"
                justifyContent="center"
                zIndex={10}
              >
                <CheckIcon width={16} height={16} color="#fff" />
              </Box>
            </>
          )}
        </Box>
      </TouchableOpacity>
    );
  };

  const filteredBadges = useMemo(() => {
    if (!ladderBadges) return [];
    
    switch (selectedFilter) {
      case 'in_progress':
        return ladderBadges.filter(badge => !getIsCompleted(badge));
      case 'completed':
        return ladderBadges.filter(badge => getIsCompleted(badge));
      default:
        return ladderBadges;
    }
  }, [selectedFilter, ladderBadges]);

  // CACHE FIX: Only show loading when loading and no cached data
  if (isLoading && !ladderBadgesData?.pages?.[0]) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" py={20}>
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        <Text color={isDark ? '#fff' : '#000'} mt="$2">Yükleniyor...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" py={20}>
        <Text color="#CE4A4A">Hata: {error.message}</Text>
      </Box>
    );
  }

  if (!ladderBadges || ladderBadges.length === 0) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" py={20}>
        <Text color={isDark ? '$textDark400' : '#797979'}>No ladder badges yet.</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} position="relative">
      <VStack flex={1} px={CARD_MARGIN} py={10}>
        <HStack space="sm" mb={15}>
          <Box
            bg={selectedFilter === 'all' ? (isDark ? '$backgroundDark800' : 'rgba(229, 229, 229, 0.8)') : 'transparent'}
            borderWidth={1}
            borderColor={isDark ? '$borderDark700' : '#EFEFEF'}
            borderRadius={100}
            px={16}
            py={8}
          >
            <TouchableOpacity onPress={() => handleFilterChange('all')}>
              <Text
                fontSize={12}
                fontWeight="$semibold"
                color={isDark ? '$textDark50' : '#000'}
              >
                All
              </Text>
            </TouchableOpacity>
          </Box>

          <Box
            bg={selectedFilter === 'in_progress' ? (isDark ? '$backgroundDark800' : 'rgba(229, 229, 229, 0.8)') : 'transparent'}
            borderWidth={1}
            borderColor={isDark ? '$borderDark700' : '#EFEFEF'}
            borderRadius={100}
            px={16}
            py={8}
          >
            <TouchableOpacity onPress={() => handleFilterChange('in_progress')}>
              <Text
                fontSize={12}
                fontWeight="$semibold"
                color={isDark ? '$textDark50' : '#000'}
              >
                In Progress
              </Text>
            </TouchableOpacity>
          </Box>

          <Box
            bg={selectedFilter === 'completed' ? (isDark ? '$backgroundDark800' : 'rgba(229, 229, 229, 0.8)') : 'transparent'}
            borderWidth={1}
            borderColor={isDark ? '$borderDark700' : '#EFEFEF'}
            borderRadius={100}
            px={16}
            py={8}
          >
            <TouchableOpacity onPress={() => handleFilterChange('completed')}>
              <Text
                fontSize={12}
                fontWeight="$semibold"
                color={isDark ? '$textDark50' : '#000'}
              >
                Completed
              </Text>
            </TouchableOpacity>
          </Box>
        </HStack>
        <Animated.View style={{ opacity: fadeAnim }}>
          <FlatList
            data={filteredBadges}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={{
              justifyContent: 'space-between',
              gap: COLUMN_GAP,
            }}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            scrollEnabled={true}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <Box py={20} alignItems="center">
                  <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                </Box>
              ) : null
            }
            // Layout animasyonu için
            onLayout={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            }}
          />
        </Animated.View>
      </VStack>

      {/* Badge Detail Modal */}
      <BadgeDetailModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        data={selectedBadge}
      />
    </Box>
  );
};

export const LadderTab = React.memo(LadderTabComponent);
export default LadderTab;
