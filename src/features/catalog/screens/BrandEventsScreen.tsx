import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, VStack, ActivityIndicator, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import EventCard from '../components/EventCard';
import { useSafeAreaValues } from '@/src/utils';
import { useBrandEvents } from '../api/hooks';
import type { Event } from '../types';
import type { EventCardData } from '../components/EventCard';
import { navigationService } from '@/src/services/NavigationService';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';

type BrandEventsScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandEventsScreen'>;
type BrandEventsScreenRouteProp = RouteProp<CatalogStackParamList, 'BrandEventsScreen'>;

const BrandEventsScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<BrandEventsScreenNavigationProp>();
  const route = useRoute<BrandEventsScreenRouteProp>();
  const bottomInset = useSafeAreaValues('bottom');
  
  const { brandId } = route.params;

  // API hook
  const { data: eventsData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useBrandEvents(brandId, 20);

  // Transform API events data to EventCard format
  const events = useMemo(() => {
    if (!eventsData?.pages) {
      return [];
    }
    const allEvents: EventCardData[] = [];
    eventsData.pages.forEach((page) => {
      if (page.items) {
        page.items.forEach((item: Event) => {
          const eventCard: EventCardData = {
            id: item.id,
            title: item.title || '',
            description: item.description || '',
            image: item.image || null,
            startDate: item.startDate || '',
            endDate: item.endDate || '',
            status: item.status || 'upcoming',
            participants: item.participants || 0,
            rewards: item.rewards || [],
          };
          allEvents.push(eventCard);
        });
      }
    });
    return allEvents;
  }, [eventsData]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Header */}
        <Header
          title="Etkinlikler"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          flex={1}
          contentContainerStyle={{ paddingBottom: bottomInset }}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
            if (isCloseToBottom && hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          scrollEventThrottle={400}
        >
          <VStack p="$4">
            {isLoading ? (
              <VStack alignItems="center" py="$8">
                <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                <Text mt="$4" fontSize={14} color="$textLight500" $dark-color="$textDark400">
                  Loading events...
                </Text>
              </VStack>
            ) : events.length === 0 ? (
              <VStack alignItems="center" py="$8">
                <Text fontSize={14} color="$textLight500" $dark-color="$textDark400">
                  No events found
                </Text>
              </VStack>
            ) : (
              <>
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPress={() => {
                      // EventDetailScreen'e yönlendir (Events tab'ı içinde)
                      navigationService.navigateNested(TAB_ROUTES.EVENTS, 'EventDetail', { eventId: event.id });
                    }}
                  />
                ))}
                {isFetchingNextPage && (
                  <VStack alignItems="center" py="$4">
                    <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                  </VStack>
                )}
              </>
            )}
          </VStack>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

export default BrandEventsScreen;
