import React, { useCallback, useMemo, useRef } from 'react';
import { FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { Box, VStack, HStack, Text, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { EventSkeleton } from '@/src/components/Skeletons';
import EventCard from '@/src/components/EventCard';
import BrandCard from '../../BrandCard';
import ProductCard from '../../ProductCard';
import type { ProductCardData } from '../../ProductCard';
import { useExploreEvents, useNewBrands, useNewProducts } from '../../../api/hooks';
import type { EventCardData } from '@/src/types/EventCard';
import { toImageSource   } from '@/src/utils';

interface NewsTabProps {
  searchQuery?: string;
  onEventPress?: (eventId: string) => void;
  onBrandPress?: (brandId: string) => void;
  onProductPress?: (productId: string) => void;
  onSeeAllEvents?: () => void;
  onSeeAllBrands?: () => void;
  onSeeAllProducts?: () => void;
  headerComponent?: React.ReactElement | null;
}

const NewsTabComponent: React.FC<NewsTabProps> = ({
  searchQuery,
  onEventPress,
  onBrandPress,
  onProductPress,
  onSeeAllEvents,
  onSeeAllBrands,
  onSeeAllProducts,
  headerComponent,
}) => {
  const { colorMode } = useColorMode();
  const { t } = useTranslation('explore');
  const isDark = colorMode === 'dark';

  // Explore Events API hook with infinite scroll
  const {
    data: eventsData,
    fetchNextPage: fetchNextEventsPage,
    hasNextPage: hasNextEventsPage,
    isFetchingNextPage: isFetchingNextEventsPage,
    isLoading: isLoadingEvents,
  } = useExploreEvents(10, searchQuery);
  
  // onEndReached loop'unu önlemek için ref
  const isLoadingMoreEventsRef = useRef(false);

  // New Brands API hook with infinite scroll
  const {
    data: brandsData,
    fetchNextPage: fetchNextBrandsPage,
    hasNextPage: hasNextBrandsPage,
    isFetchingNextPage: isFetchingNextBrandsPage,
    isLoading: isLoadingBrands,
  } = useNewBrands(10, searchQuery);

  // New Products API hook with infinite scroll
  const {
    data: productsData,
    fetchNextPage: fetchNextProductsPage,
    hasNextPage: hasNextProductsPage,
    isFetchingNextPage: isFetchingNextProductsPage,
    isLoading: isLoadingProducts,
  } = useNewProducts(10);
  
  // onEndReached loop'unu önlemek için ref'ler
  const isLoadingMoreBrandsRef = useRef(false);
  const isLoadingMoreProductsRef = useRef(false);

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
      };

      return `${formatDate(start)} - ${formatDate(end)}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  // Map API event data to EventCardData format
  const mapEventToCardData = (event: any): EventCardData => {
    const defaultEventImage = require('@/assets/defaultImages/default-banner.png');
    const imageSource = event.image ? toImageSource(event.image) : null;
    
    return {
      id: event.eventId,
      title: event.title,
      description: event.description,
      image: imageSource || defaultEventImage,
      dateRange: formatDateRange(event.startDate, event.endDate),
      interaction: event.interaction,
      avatars: event.participants.map((p: any) => p.avatar),
      eventType: event.eventType || 'default',
    };
  };

  // Flatten all pages into a single array and remove duplicates by ID for events
  const events = useMemo(() => {
    if (!eventsData?.pages) return [];
    
    const allItems = eventsData.pages.flatMap((page) => page.items);
    
    // Remove duplicates by ID
    const uniqueItemsMap = new Map<string, any>();
    for (const item of allItems) {
      const itemId = item.eventId;
      if (!uniqueItemsMap.has(itemId)) {
        uniqueItemsMap.set(itemId, item);
      }
    }
    
    return Array.from(uniqueItemsMap.values()).map(mapEventToCardData);
  }, [eventsData?.pages]);

  // Map API brand data to BrandCard format
  const mapBrandToCardData = (brand: any) => {
    const imageSource = toImageSource(brand.images);
    return {
      id: brand.brandId,
      name: brand.title,
      description: brand.description,
      logo: imageSource || require('@/assets/avatar/default-useravatar.png'),
      followers: '',
      bannerImage: undefined,
      isJoined: false,
    };
  };

  // Map API product data to ProductCardData format
  const mapProductToCardData = (product: any, index: number): ProductCardData => {
    const imageSource = product.images ? toImageSource(product.images) : null;
    return {
      id: product.productId,
      name: product.title,
      description: product.description || '',
      image: imageSource || require('@/assets/inventory/product_01.png'),
    };
  };

  // Flatten all pages into a single array and remove duplicates by ID for brands
  const brands = useMemo(() => {
    if (!brandsData?.pages) return [];
    
    const allItems = brandsData.pages.flatMap((page) => page.items);
    
    // Remove duplicates by ID
    const uniqueItemsMap = new Map<string, any>();
    for (const item of allItems) {
      const itemId = item.brandId;
      if (!uniqueItemsMap.has(itemId)) {
        uniqueItemsMap.set(itemId, item);
      }
    }
    
    return Array.from(uniqueItemsMap.values()).map(mapBrandToCardData);
  }, [brandsData?.pages]);

  // Flatten all pages into a single array and remove duplicates by ID for products
  const products = useMemo(() => {
    if (!productsData?.pages) return [];
    
    const allItems = productsData.pages.flatMap((page) => page.items);
    
    // Remove duplicates by ID
    const uniqueItemsMap = new Map<string, any>();
    for (const item of allItems) {
      const itemId = item.productId;
      if (!uniqueItemsMap.has(itemId)) {
        uniqueItemsMap.set(itemId, item);
      }
    }
    
    return Array.from(uniqueItemsMap.values()).map((item, index) => mapProductToCardData(item, index));
  }, [productsData?.pages]);

  // Item sayısı değiştiğinde ref'leri güncelle
  React.useEffect(() => {
    isLoadingMoreEventsRef.current = false;
  }, [events.length]);

  React.useEffect(() => {
    isLoadingMoreBrandsRef.current = false;
  }, [brands.length]);

  React.useEffect(() => {
    isLoadingMoreProductsRef.current = false;
  }, [products.length]);

  const handleLoadMoreEvents = useCallback(() => {
    if (isLoadingMoreEventsRef.current) {
      return;
    }

    if (!hasNextEventsPage || isFetchingNextEventsPage) {
      return;
    }

    isLoadingMoreEventsRef.current = true;

    fetchNextEventsPage()
      .finally(() => {
        setTimeout(() => {
          isLoadingMoreEventsRef.current = false;
        }, 1000);
      });
  }, [hasNextEventsPage, isFetchingNextEventsPage, fetchNextEventsPage]);

  const handleLoadMoreBrands = useCallback(() => {
    if (isLoadingMoreBrandsRef.current) {
      return;
    }

    if (!hasNextBrandsPage || isFetchingNextBrandsPage) {
      return;
    }

    isLoadingMoreBrandsRef.current = true;

    fetchNextBrandsPage()
      .finally(() => {
        setTimeout(() => {
          isLoadingMoreBrandsRef.current = false;
        }, 1000);
      });
  }, [hasNextBrandsPage, isFetchingNextBrandsPage, fetchNextBrandsPage]);

  const handleLoadMoreProducts = useCallback(() => {
    if (isLoadingMoreProductsRef.current) {
      return;
    }

    if (!hasNextProductsPage || isFetchingNextProductsPage) {
      return;
    }

    isLoadingMoreProductsRef.current = true;

    fetchNextProductsPage()
      .finally(() => {
        setTimeout(() => {
          isLoadingMoreProductsRef.current = false;
        }, 1000);
      });
  }, [hasNextProductsPage, isFetchingNextProductsPage, fetchNextProductsPage]);

  const handleEventPress = (eventId: string) => {
    onEventPress?.(eventId);
  };

  const handleBrandPress = (brandId: string) => {
    onBrandPress?.(brandId);
  };

  const handleProductPress = (productId: string) => {
    onProductPress?.(productId);
  };

  const handleSeeAllEvents = () => {
    console.log('[NewsTab] handleSeeAllEvents called, onSeeAllEvents:', !!onSeeAllEvents);
    onSeeAllEvents?.();
  };

  const handleSeeAllBrands = () => {
    console.log('[NewsTab] handleSeeAllBrands called, onSeeAllBrands:', !!onSeeAllBrands);
    onSeeAllBrands?.();
  };

  const handleSeeAllProducts = () => {
    console.log('[NewsTab] handleSeeAllProducts called, onSeeAllProducts:', !!onSeeAllProducts);
    onSeeAllProducts?.();
  };

  // PERFORMANCE FIX: Memoize footer components to prevent re-renders
  const EventsFooter = useMemo(() => {
    if (!isFetchingNextEventsPage) return null;
    return (
      <Box width={60} height={60} alignItems="center" justifyContent="center" alignSelf="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }, [isFetchingNextEventsPage, isDark]);

  const BrandsFooter = useMemo(() => {
    if (!isFetchingNextBrandsPage) return null;
    return (
      <Box width={60} height={60} alignItems="center" justifyContent="center" alignSelf="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }, [isFetchingNextBrandsPage, isDark]);

  const ProductsFooter = useMemo(() => {
    if (!isFetchingNextProductsPage) return null;
    return (
      <Box width={60} height={60} alignItems="center" justifyContent="center" alignSelf="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }, [isFetchingNextProductsPage, isDark]);

  // PERFORMANCE FIX: Memoize ItemSeparatorComponent
  const ItemSeparator = useCallback(() => <Box width={12} />, []);

  return (
    <ScrollView
      showsVerticalScrollIndicator={true}
      nestedScrollEnabled={true}
      contentContainerStyle={{ paddingBottom: 16 }}
    >
      {headerComponent}
      <VStack space="sm" mb="$2" pt={16} mt={0}>
        {/* New Community Events Section */}
      {(isLoadingEvents || events.length > 0) && (
        <Box pl="$4">
          <VStack space="sm" mb="$1">
            <HStack justifyContent="space-between" alignItems="center" mt="$2" pr="$4">
              <Text
                color={isDark ? '#FFFFFF' : '#B9B9B9'}
                fontSize={14}
                fontWeight="$bold"
              >
                {t('news.sections.events.title')}
              </Text>
              <Pressable onPress={handleSeeAllEvents}>
                <Text
                  color="#A3A3A3"
                  fontSize={12}
                  fontWeight="$medium"
                  textDecorationLine="underline"
                >
                  {t('news.sections.events.seeAll')}
                </Text>
              </Pressable>
            </HStack>
            {isLoadingEvents ? (
              <Box pl="$4">
                <EventSkeleton count={3} isHorizontal={true} />
              </Box>
            ) : (
            <FlatList
              data={events}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16, paddingBottom: 8 }}
              ItemSeparatorComponent={ItemSeparator}
              renderItem={({ item }) => (
                <EventCard
                  data={item}
                  isGrid={false}
                  onPress={() => handleEventPress(item.id)}
                />
              )}
              keyExtractor={(item) => `event-${item.id}`}
              nestedScrollEnabled={true}
              onEndReached={handleLoadMoreEvents}
              onEndReachedThreshold={0.5}
              removeClippedSubviews={true}
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={5}
              ListFooterComponent={EventsFooter}
            />
            )}
          </VStack>
        </Box>
      )}

      {/* New Brands Section */}
      {(isLoadingBrands || brands.length > 0) && (
        <Box pl="$4">
          <VStack space="sm" mb="$2">
            <HStack justifyContent="space-between" alignItems="center" mt="$2" pr="$4">
              <Text
                color={isDark ? '#FFFFFF' : '#B9B9B9'}
                fontSize={14}
                fontWeight="$bold"
              >
                {t('news.sections.brands.title')}
              </Text>
              <Pressable onPress={handleSeeAllBrands}>
                <Text
                  color="#A3A3A3"
                  fontSize={12}
                  fontWeight="$medium"
                  textDecorationLine="underline"
                >
                  {t('news.sections.brands.seeAll')}
                </Text>
              </Pressable>
            </HStack>
            {isLoadingBrands ? (
              <Box pl="$4">
                <HStack space="md">
                  {Array.from({ length: 3 }).map((_, index) => {
                    const skeletonColor = isDark ? '#2A2A2A' : '#FDFDFD';
                    const shimmerColor = isDark ? '#404040' : '#E9E9E9';
                    return (
                      <Box
                        key={index}
                        width={120}
                        height={150}
                        bg={skeletonColor}
                        borderWidth={1}
                        borderColor={isDark ? '#404040' : '#E9E9E9'}
                        borderRadius={10}
                        p="$2"
                      >
                        <VStack space="sm" alignItems="center">
                          <Box
                            width={80}
                            height={80}
                            borderRadius={40}
                            bg={shimmerColor}
                          />
                          <Box
                            width={90}
                            height={12}
                            borderRadius={3}
                            bg={shimmerColor}
                          />
                          <Box
                            width={70}
                            height={10}
                            borderRadius={3}
                            bg={shimmerColor}
                          />
                        </VStack>
                      </Box>
                    );
                  })}
                </HStack>
              </Box>
            ) : (
            <FlatList
              data={brands}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
              ItemSeparatorComponent={ItemSeparator}
              renderItem={({ item }) => (
                <BrandCard
                  data={item}
                  onPress={() => handleBrandPress(item.id)}
                />
              )}
              keyExtractor={(item) => `brand-${item.id}`}
              nestedScrollEnabled={true}
              onEndReached={handleLoadMoreBrands}
              onEndReachedThreshold={0.5}
              removeClippedSubviews={true}
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={5}
              ListFooterComponent={BrandsFooter}
            />
            )}
          </VStack>
        </Box>
      )}

      {/* New Products Section */}
      {(isLoadingProducts || products.length > 0) && (
        <Box pl="$4">
          <VStack space="sm">
            <HStack justifyContent="space-between" alignItems="center" mt="$2" pr="$4">
              <Text
                color={isDark ? '#FFFFFF' : '#B9B9B9'}
                fontSize={14}
                fontWeight="$bold"
              >
                {t('news.sections.products.title')}
              </Text>
              <Pressable onPress={handleSeeAllProducts}>
                <Text
                  color="#A3A3A3"
                  fontSize={12}
                  fontWeight="$medium"
                  textDecorationLine="underline"
                >
                  {t('news.sections.products.seeAll')}
                </Text>
              </Pressable>
            </HStack>
            {isLoadingProducts ? (
              <Box pl="$4">
                <HStack space="md">
                  {Array.from({ length: 3 }).map((_, index) => {
                    const skeletonColor = isDark ? '#2A2A2A' : '#FDFDFD';
                    const shimmerColor = isDark ? '#404040' : '#E9E9E9';
                    return (
                      <Box
                        key={index}
                        width={120}
                        height={150}
                        bg={skeletonColor}
                        borderWidth={1}
                        borderColor={isDark ? '#404040' : '#E9E9E9'}
                        borderRadius={10}
                        p="$2"
                      >
                        <VStack space="sm" alignItems="center">
                          <Box
                            width={86}
                            height={86}
                            borderRadius={5}
                            bg={shimmerColor}
                          />
                          <Box
                            width={90}
                            height={12}
                            borderRadius={3}
                            bg={shimmerColor}
                          />
                          <Box
                            width={70}
                            height={10}
                            borderRadius={3}
                            bg={shimmerColor}
                          />
                        </VStack>
                      </Box>
                    );
                  })}
                </HStack>
              </Box>
            ) : (
            <FlatList
              data={products}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16, paddingBottom: 8 }}
              ItemSeparatorComponent={ItemSeparator}
              renderItem={({ item }) => (
                <ProductCard
                  data={item}
                  onPress={() => handleProductPress(item.id)}
                />
              )}
              keyExtractor={(item) => `product-${item.id}`}
              nestedScrollEnabled={true}
              onEndReached={handleLoadMoreProducts}
              onEndReachedThreshold={0.5}
              removeClippedSubviews={true}
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={5}
              ListFooterComponent={ProductsFooter}
            />
            )}
          </VStack>
        </Box>
      )}
      </VStack>
    </ScrollView>
  );
};

// React.memo ile sarmalayarak gereksiz re-render'ları önle
export const NewsTab = React.memo(NewsTabComponent, (prevProps, nextProps) => {
  // Callback fonksiyonlarının referanslarını karşılaştır
  // Eğer callback'ler değişmediyse re-render yapma
  const callbacksChanged = 
    prevProps.onEventPress !== nextProps.onEventPress ||
    prevProps.onBrandPress !== nextProps.onBrandPress ||
    prevProps.onProductPress !== nextProps.onProductPress ||
    prevProps.onSeeAllEvents !== nextProps.onSeeAllEvents ||
    prevProps.onSeeAllBrands !== nextProps.onSeeAllBrands ||
    prevProps.onSeeAllProducts !== nextProps.onSeeAllProducts;
  
  // Callback'ler değişmediyse re-render yapma
  return !callbacksChanged;
});

export default NewsTab;

