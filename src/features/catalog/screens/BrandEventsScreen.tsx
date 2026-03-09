import React, { useMemo } from 'react';
import { View } from 'react-native-safe-area-context';
import { ScrollView, VStack, Text } from '@gluestack-ui/themed';
import { ActivityIndicator } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import EventCard from '../components/EventCard';
import { useSafeAreaValues, toImageSource } from '@/src/utils';
import { useBrandEvents } from '../api/hooks';
import type { Event } from '../types';
import { EventStatus } from '../types';
import type { EventCardData } from '../components/EventCard';
import { navigationService } from '@/src/services/NavigationService';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';

type BrandEventsScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandEventsScreen'>;
type BrandEventsScreenRouteProp = RouteProp<CatalogStackParamList, 'BrandEventsScreen'>;

const BrandEventsScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('catalog');
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
          // Format date range from startDate and endDate
          const formatDateRange = (startDate: string, endDate: string): string => {
            try {
              const start = new Date(startDate);
              const end = new Date(endDate);
              const formatDate = (date: Date): string => {
                const day = date.getDate().toString().padStart(2, '0');
                const month = date.toLocaleDateString('tr-TR', { month: 'short' });
                return `${day} ${month}`;
              };
              return `${formatDate(start)} - ${formatDate(end)}`;
            } catch {
              return '';
            }
          };

          // Map EventStatus to EventCardData status
          const mapStatus = (status: EventStatus): 'joined' | 'join' | 'completed' => {
            switch (status) {
              case EventStatus.JOINED:
                return 'joined';
              case EventStatus.JOIN:
                return 'join';
              default:
                return 'join';
            }
          };

          // Convert image string to ImageSourcePropType
          const imageSource = item.image ? toImageSource(item.image) : null;
          const defaultImage = require('@/assets/defaultImages/default-event.png');

          const eventCard: EventCardData = {
            id: item.id,
            title: item.title || '',
            description: item.description || '',
            dateRange: formatDateRange(item.startDate || '', item.endDate || ''),
            status: mapStatus(item.status),
            image: imageSource || defaultImage,
          };
          allEvents.push(eventCard);
        });
      }
    });
    return allEvents;
  }, [eventsData]);

  return (
    <View style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Header */}
        <Header
          title={t('brandEvents.title')}
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
                <Text mt="$4" fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
                  {t('brandEvents.loading')}
                </Text>
              </VStack>
            ) : events.length === 0 ? (
              <VStack alignItems="center" py="$8">
                <Text fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
                  {t('brandEvents.noEvents')}
                </Text>
              </VStack>
            ) : (
              <>
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPress={() => {
                      // RootNavigator'dan EventDetailScreen'e navigate et (full screen banner için)
                      navigationService.navigate('Event', { 
                        screen: 'EventDetailScreen', 
                        params: { eventId: event.id } 
                      });
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
    </View>
  );
};

export default BrandEventsScreen;
