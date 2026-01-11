import React, { useCallback, useMemo, useRef } from 'react';
import { FlatList, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import EventCard from '@/src/components/EventCard';
import { useActiveEvents, useUpcomingEvents } from '../../api/hooks';
import type { EventApiItem, UpcomingEventApiItem } from '@/src/types/EventCard';
import type { EventCardData, UpcomingEventCardData } from '@/src/types/EventCard';
import { useSafeAreaValues } from '@/src/utils';
import { EventSkeleton } from '@/src/components/Skeletons';

const { width } = Dimensions.get('window');
// EventCard genişliği: isGrid=false (horizontal) için CARD_WIDTH kullanılıyor
const CARD_WIDTH = (width - 48) / 2;

type CommunityTabProps = {
  onEventPress: (eventId: string) => void;
};

// Format date range from startDate and endDate
const formatDateRange = (startDate: string, endDate: string): string => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    
    const formatDate = (date: Date): string => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    }

    return `${formatDate(start)} - ${formatDate(end)}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

// Map API event data to EventCardData format (Active Events için)
const mapEventToCardData = (event: EventApiItem): EventCardData => {
  return {
    id: event.eventId,
    title: event.title,
    description: event.description,
    image: event.image || null,
    dateRange: formatDateRange(event.startDate, event.endDate),
    interaction: event.interaction,
    avatars: event.participants.map(p => p.avatar),
    eventType: event.eventType || 'default',
  };
};

// Map API upcoming event data to UpcomingEventCardData format (Upcoming Events için - interaction ve participants yok)
const mapUpcomingEventToCardData = (event: UpcomingEventApiItem): UpcomingEventCardData => {
  return {
    id: event.eventId,
    title: event.title,
    description: event.description,
    image: event.image || null,
    dateRange: formatDateRange(event.startDate, event.endDate),
    eventType: event.eventType || 'default',
  };
};

export const CommunityTab: React.FC<CommunityTabProps> = ({ onEventPress }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const bottomInset = useSafeAreaValues('bottom');

  // Active Events API hook
  const {
    data: activeEventsData,
    fetchNextPage: fetchNextActivePage,
    hasNextPage: hasNextActivePage,
    isFetchingNextPage: isFetchingNextActivePage,
    isLoading: isActiveEventsLoading,
    error: activeEventsError,
    refetch: refetchActiveEvents, // Pull-to-refresh için
    isRefetching: isRefetchingActiveEvents, // Refresh durumu
  } = useActiveEvents(20);

  // Upcoming Events API hook - 4'erli veri gelecek
  const {
    data: upcomingEventsData,
    fetchNextPage: fetchNextUpcomingPageOriginal,
    hasNextPage: hasNextUpcomingPage,
    isFetchingNextPage: isFetchingNextUpcomingPage,
    isLoading: isUpcomingEventsLoading,
    error: upcomingEventsError,
    refetch: refetchUpcomingEvents, // Pull-to-refresh için
    isRefetching: isRefetchingUpcomingEvents, // Refresh durumu
  } = useUpcomingEvents(4);

  // Transform events data for display (flatten all pages and remove duplicates)
  const activeEvents = useMemo(() => {
    if (!activeEventsData?.pages) return [];
    
    const allEvents = activeEventsData.pages.flatMap((page) => 
      (page.items && Array.isArray(page.items))
        ? page.items.map(mapEventToCardData)
        : []
    );
    
    // Remove duplicates by ID (cursor pagination'da aynı item tekrar gelebilir)
    const uniqueEventsMap = new Map<string, EventCardData>();
    for (const event of allEvents) {
      if (!uniqueEventsMap.has(event.id)) {
        uniqueEventsMap.set(event.id, event);
      }
    }
    
    const uniqueEvents = Array.from(uniqueEventsMap.values());
    
    // Debug: Duplicate kontrolü
    if (allEvents.length !== uniqueEvents.length) {
      console.warn('[Active Events] Duplicate events detected:', {
        total: allEvents.length,
        unique: uniqueEvents.length,
        duplicates: allEvents.length - uniqueEvents.length,
      });
    }
    
    return uniqueEvents;
  }, [activeEventsData?.pages]);

  const upcomingEvents = useMemo(() => {
    if (!upcomingEventsData?.pages) return [];
    
    const allEvents = upcomingEventsData.pages.flatMap((page) => 
      (page.items && Array.isArray(page.items))
        ? page.items.map(mapUpcomingEventToCardData)
        : []
    );
    
    // Remove duplicates by ID
    const uniqueEventsMap = new Map<string, UpcomingEventCardData>();
    for (const event of allEvents) {
      if (!uniqueEventsMap.has(event.id)) {
        uniqueEventsMap.set(event.id, event);
      }
    }
    
    return Array.from(uniqueEventsMap.values());
  }, [upcomingEventsData?.pages]);

  // fetchNextUpcomingPage'i wrap edip loop koruması ekliyoruz
  const isLoadingMoreRef = useRef(false);
  const fetchNextUpcomingPage = useCallback(() => {
    if (isLoadingMoreRef.current) {
      return;
    }
    
    if (!hasNextUpcomingPage || isFetchingNextUpcomingPage) {
      return;
    }
    
    isLoadingMoreRef.current = true;
    fetchNextUpcomingPageOriginal();
    
    // 1 saniye sonra flag'i sıfırla
    setTimeout(() => {
      isLoadingMoreRef.current = false;
    }, 1000);
  }, [fetchNextUpcomingPageOriginal, hasNextUpcomingPage, isFetchingNextUpcomingPage, upcomingEvents.length]);

  // Pull-to-Refresh handler - Smart refresh pattern
  // Cache'den anında göster, arka planda fresh data fetch et
  const isRefetching = isRefetchingActiveEvents || isRefetchingUpcomingEvents;
  const handleRefresh = useCallback(async () => {
    // Cache'den göster (zaten gösteriliyor - React Query otomatik yapıyor)
    // Arka planda fresh data fetch et
    await Promise.all([
      refetchActiveEvents(),    // Active events refresh
      refetchUpcomingEvents(),  // Upcoming events refresh
    ]);
    // Fresh data geldiğinde React Query otomatik UI'ı günceller
  }, [refetchActiveEvents, refetchUpcomingEvents]);

  // Upcoming Events için scroll handler - nested scroll durumunda onEndReached düzgün çalışmayabilir
  const handleUpcomingEventsScroll = useCallback(
    (event: any) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const paddingToBottom = 20;
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

      if (isCloseToBottom && hasNextUpcomingPage && !isFetchingNextUpcomingPage) {
        fetchNextUpcomingPage();
      }
    },
    [hasNextUpcomingPage, isFetchingNextUpcomingPage, fetchNextUpcomingPage]
  );

  // Initial loading state - hem active hem upcoming ilk yüklemede ise tüm ekran için skeleton göster
  // Cache'den veri varsa skeleton gösterme
  const isInitialLoading = (isActiveEventsLoading && !activeEventsData) || 
                           (isUpcomingEventsLoading && !upcomingEventsData);

  // İlk yüklemede ve cache'den veri yoksa tüm ekran için skeleton göster
  if (isInitialLoading && !activeEventsData && !upcomingEventsData) {
    return (
      <VStack flex={1} px="$4" py="$4" space="md">
        {/* Active Events Section Skeleton */}
        <VStack space="sm">
          <Box
            bg={isDark ? '#2A2A2A' : '#E9E9E9'}
            width={100}
            height={16}
            borderRadius={4}
          />
          <EventSkeleton count={3} isHorizontal={true} />
        </VStack>

        {/* Upcoming Events Section Skeleton */}
        <VStack space="sm">
          <Box
            bg={isDark ? '#2A2A2A' : '#E9E9E9'}
            width={120}
            height={16}
            borderRadius={4}
          />
          <EventSkeleton count={4} isGrid={true} />
        </VStack>
      </VStack>
    );
  }

  return (
    <VStack flex={1}>
      <FlatList
        data={upcomingEvents}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 24, paddingHorizontal: 16 }}
        ItemSeparatorComponent={() => <Box height={12} />}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <Box flex={1}>
            <EventCard
              data={item}
              isGrid={true}
              onPress={() => onEventPress(item.id)}
            />
          </Box>
        )}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#E2FF46' : '#8B5CF6'}
          />
        }
        ListHeaderComponent={
          <VStack space="md" pb="$4">
            {/* Active Events Section - Horizontal Scroll */}
            <Box>
              <VStack space="sm">
                <Text
                  color={isDark ? '#FFFFFF' : '#B9B9B9'}
                  fontSize="$sm"
                  fontWeight="$bold"
                >
                  Active Events
                </Text>
                {isActiveEventsLoading && !activeEventsData ? (
                  <EventSkeleton count={3} isHorizontal={true} />
                ) : activeEventsError ? (
                  <Box py="$4" alignItems="center">
                    <Text color="#CE4A4A" fontSize="$xs">
                      Hata: {activeEventsError.message}
                    </Text>
                  </Box>
                ) : activeEvents.length === 0 ? (
                  <Box py="$4" alignItems="center">
                    <Text color={isDark ? '#FFFFFF' : '#B9B9B9'} fontSize="$xs">
                      No active events yet
                    </Text>
                  </Box>
                ) : (
                  <FlatList
                    data={activeEvents}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    ItemSeparatorComponent={() => <Box width={12} />}
                    contentContainerStyle={{ 
                      paddingRight: isFetchingNextActivePage ? 16 : 16,
                    }}
                    renderItem={({ item }) => (
                      <EventCard
                        data={item}
                        isGrid={false}
                        onPress={() => onEventPress(item.id)}
                      />
                    )}
                    keyExtractor={(item) => item.id}
                    ListFooterComponent={
                      isFetchingNextActivePage ? (
                        <Box 
                          justifyContent="center" 
                          alignItems="center" 
                          pl={12}
                          style={{ 
                            width: 60, // Loading indicator için küçük genişlik
                            height: 210, // EventCard'ın yüksekliği ile aynı
                          }}
                        >
                          <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                        </Box>
                      ) : null
                    }
                    onEndReached={() => {
                      if (hasNextActivePage && !isFetchingNextActivePage) {
                        fetchNextActivePage();
                      }
                    }}
                    onEndReachedThreshold={0.5}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                  />
                )}
              </VStack>
            </Box>

            {/* Upcoming Events Section Header */}
            <Box>
              <Text
                color={isDark ? '#FFFFFF' : '#B9B9B9'}
                fontSize="$sm"
                fontWeight="$bold"
              >
                Upcoming Events
              </Text>
            </Box>

            {/* Upcoming Events Loading State */}
            {isUpcomingEventsLoading && !upcomingEventsData && (
              <Box pt="$4">
                <EventSkeleton count={4} isGrid={true} />
              </Box>
            )}

            {/* Upcoming Events Error State */}
            {upcomingEventsError && (
              <Box pt="$4" alignItems="center" px="$4">
                <Text color="#CE4A4A" fontSize="$xs">
                  Hata: {upcomingEventsError.message}
                </Text>
              </Box>
            )}

            {/* Upcoming Events Empty State */}
            {!isUpcomingEventsLoading && upcomingEvents.length === 0 && !upcomingEventsError && (
              <Box pt="$4" alignItems="center" px="$4">
                  <Text color={isDark ? '#FFFFFF' : '#B9B9B9'} fontSize="$xs">
                  No upcoming events yet
                </Text>
              </Box>
            )}
          </VStack>
        }
        ListFooterComponent={
          isFetchingNextUpcomingPage ? (
            <Box pt="$4" alignItems="center" width="100%">
              <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
          ) : null
        }
        onScroll={handleUpcomingEventsScroll}
        scrollEventThrottle={400}
        onEndReached={() => {
          // onEndReached sürekli tetiklenmesini önlemek için kontrol
          if (hasNextUpcomingPage && !isFetchingNextUpcomingPage && !isLoadingMoreRef.current) {
            fetchNextUpcomingPage();
          }
        }}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        nestedScrollEnabled={true}
      />
    </VStack>
  );
};

