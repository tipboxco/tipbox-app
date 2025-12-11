import React, { useCallback, useMemo, useRef } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { Box, VStack, HStack, Text, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import EventCard from '@/src/components/EventCard';
import { BrandCard, ProductCard } from '../../';
import type { ProductCardData } from '../../ProductCard';
import { useExploreEvents, useNewBrands, useNewProducts } from '../../../api/hooks';
import type { EventCardData } from '@/src/types/EventCard';
import { toImageSource } from '@/src/utils';

interface NewsTabProps {
  onEventPress?: (eventId: string) => void;
  onBrandPress?: (brandId: string) => void;
  onProductPress?: (productId: string) => void;
  onSeeAllEvents?: () => void;
  onSeeAllBrands?: () => void;
  onSeeAllProducts?: () => void;
}

const NewsTabComponent: React.FC<NewsTabProps> = ({
  onEventPress,
  onBrandPress,
  onProductPress,
  onSeeAllEvents,
  onSeeAllBrands,
  onSeeAllProducts,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Render sayısını takip et
  const renderCountRef = useRef(0);
  const prevValuesRef = useRef<any>({});

  // Explore Events API hook with infinite scroll
  const {
    data: eventsData,
    fetchNextPage: fetchNextEventsPage,
    hasNextPage: hasNextEventsPage,
    isFetchingNextPage: isFetchingNextEventsPage,
    isLoading: isLoadingEvents,
  } = useExploreEvents(10);
  
  // onEndReached loop'unu önlemek için ref
  const isLoadingMoreEventsRef = useRef(false);

  // New Brands API hook with infinite scroll
  const {
    data: brandsData,
    fetchNextPage: fetchNextBrandsPage,
    hasNextPage: hasNextBrandsPage,
    isFetchingNextPage: isFetchingNextBrandsPage,
    isLoading: isLoadingBrands,
  } = useNewBrands(10);

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
    return {
      id: event.eventId,
      title: event.title,
      description: event.description,
      image: event.image || null,
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
    
    const uniqueItems = Array.from(uniqueItemsMap.values());
    
    // Duplicate kontrolü
    if (allItems.length !== uniqueItems.length) {
      console.log('[NewsTab] Events duplicate items detected:', {
        total: allItems.length,
        unique: uniqueItems.length,
        duplicates: allItems.length - uniqueItems.length,
      });
    }
    
    return uniqueItems.map(mapEventToCardData);
  }, [eventsData?.pages]);

  // Map API brand data to BrandCard format
  const mapBrandToCardData = (brand: any) => {
    const imageSource = toImageSource(brand.images);
    return {
      id: brand.brandId,
      name: brand.title,
      description: brand.description,
      logo: imageSource || require('@/assets/avatar/ozan.png'),
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
    
    const uniqueItems = Array.from(uniqueItemsMap.values());
    
    // Duplicate kontrolü
    if (allItems.length !== uniqueItems.length) {
      console.log('[NewsTab] Brands duplicate items detected:', {
        total: allItems.length,
        unique: uniqueItems.length,
        duplicates: allItems.length - uniqueItems.length,
      });
    }
    
    return uniqueItems.map(mapBrandToCardData);
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
    
    const uniqueItems = Array.from(uniqueItemsMap.values());
    
    // Duplicate kontrolü
    if (allItems.length !== uniqueItems.length) {
      console.log('[NewsTab] Products duplicate items detected:', {
        total: allItems.length,
        unique: uniqueItems.length,
        duplicates: allItems.length - uniqueItems.length,
      });
    }
    
    return uniqueItems.map((item, index) => mapProductToCardData(item, index));
  }, [productsData?.pages]);

  React.useEffect(() => {
    renderCountRef.current += 1;
    const currentValues = {
      colorMode,
      eventsPagesCount: eventsData?.pages?.length,
      eventsCount: events.length,
      brandsPagesCount: brandsData?.pages?.length,
      brandsCount: brands.length,
      productsPagesCount: productsData?.pages?.length,
      productsCount: products.length,
      hasNextEventsPage,
      hasNextBrandsPage,
      hasNextProductsPage,
      isFetchingNextEventsPage,
      isFetchingNextBrandsPage,
      isFetchingNextProductsPage,
      isLoadingEvents,
      isLoadingBrands,
      isLoadingProducts,
    };
    
    const changedValues: string[] = [];
    Object.keys(currentValues).forEach((key) => {
      const typedKey = key as keyof typeof currentValues;
      if (prevValuesRef.current[typedKey] !== currentValues[typedKey]) {
        changedValues.push(`${key}: ${prevValuesRef.current[typedKey]} → ${currentValues[typedKey]}`);
      }
    });
    
    console.log(`[NewsTab] Render #${renderCountRef.current}`, {
      changed: changedValues.length > 0 ? changedValues : ['No changes detected'],
      current: currentValues,
    });
    
    prevValuesRef.current = currentValues;
  }, [
    colorMode,
    eventsData?.pages?.length,
    events.length,
    brandsData?.pages?.length,
    brands.length,
    productsData?.pages?.length,
    products.length,
    hasNextEventsPage,
    hasNextBrandsPage,
    hasNextProductsPage,
    isFetchingNextEventsPage,
    isFetchingNextBrandsPage,
    isFetchingNextProductsPage,
    isLoadingEvents,
    isLoadingBrands,
    isLoadingProducts,
  ]); // Dependency array eklendi

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
    onSeeAllEvents?.();
  };

  const handleSeeAllBrands = () => {
    onSeeAllBrands?.();
  };

  const handleSeeAllProducts = () => {
    onSeeAllProducts?.();
  };

  return (
    <VStack space="md" mb="$4" pt={0} mt={0}>
      {/* New Community Events Section */}
      <Box pl="$4">
        <VStack space="sm" mb="$4">
          <HStack justifyContent="space-between" alignItems="center" mt="$2" pr="$4">
            <Text
              color={isDark ? '#FFFFFF' : '#B9B9B9'}
              fontSize={14}
              fontWeight="$bold"
            >
              New Community Events
            </Text>
            <Pressable onPress={handleSeeAllEvents}>
              <Text
                color="#A3A3A3"
                fontSize={12}
                fontWeight="$medium"
                textDecorationLine="underline"
              >
                See Event Catalog
              </Text>
            </Pressable>
          </HStack>
          {isLoadingEvents ? (
            <Box py="$4" alignItems="center">
              <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
          ) : events.length === 0 ? (
            <Box py="$4" alignItems="center">
              <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={12}>
                Henüz etkinlik bulunmuyor.
              </Text>
            </Box>
          ) : (
            <FlatList
              data={events}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16, paddingBottom: 8 }}
              ItemSeparatorComponent={() => <Box width={12} />}
              renderItem={({ item }) => (
                <EventCard
                  data={item}
                  isGrid={false}
                  onPress={() => handleEventPress(item.id)}
                />
              )}
              keyExtractor={(item) => item.id}
              nestedScrollEnabled={true}
              onEndReached={handleLoadMoreEvents}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isFetchingNextEventsPage ? (
                  <Box width={60} height={60} alignItems="center" justifyContent="center" alignSelf="center">
                    <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                  </Box>
                ) : null
              }
            />
          )}
        </VStack>
      </Box>

      {/* New Brands Section */}
      <Box pl="$4">
        <VStack space="sm" mb="$4">
          <HStack justifyContent="space-between" alignItems="center" mt="$2" pr="$4">
            <Text
              color={isDark ? '#FFFFFF' : '#B9B9B9'}
              fontSize={14}
              fontWeight="$bold"
            >
              New Brands
            </Text>
            <Pressable onPress={handleSeeAllBrands}>
              <Text
                color="#A3A3A3"
                fontSize={12}
                fontWeight="$medium"
                textDecorationLine="underline"
              >
                See Brand Catalog
              </Text>
            </Pressable>
          </HStack>
          {isLoadingBrands ? (
            <Box py="$4" alignItems="center">
              <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
          ) : brands.length === 0 ? (
            <Box py="$4" alignItems="center">
              <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={12}>
                Henüz brand bulunmuyor.
              </Text>
            </Box>
          ) : (
            <FlatList
              data={brands}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
              ItemSeparatorComponent={() => <Box width={12} />}
              renderItem={({ item }) => (
                <BrandCard
                  data={item}
                  onPress={() => handleBrandPress(item.id)}
                />
              )}
              keyExtractor={(item) => item.id}
              nestedScrollEnabled={true}
              onEndReached={handleLoadMoreBrands}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isFetchingNextBrandsPage ? (
                  <Box width={60} height={60} alignItems="center" justifyContent="center" alignSelf="center">
                    <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                  </Box>
                ) : null
              }
            />
          )}
        </VStack>
      </Box>

      {/* New Products Section */}
      <Box pl="$4">
        <VStack space="sm">
          <HStack justifyContent="space-between" alignItems="center" mt="$2" pr="$4">
            <Text
              color={isDark ? '#FFFFFF' : '#B9B9B9'}
              fontSize={14}
              fontWeight="$bold"
            >
              New Products
            </Text>
            <Pressable onPress={handleSeeAllProducts}>
              <Text
                color="#A3A3A3"
                fontSize={12}
                fontWeight="$medium"
                textDecorationLine="underline"
              >
                See Product Catalog
              </Text>
            </Pressable>
          </HStack>
          {isLoadingProducts ? (
            <Box py="$4" alignItems="center">
              <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
          ) : products.length === 0 ? (
            <Box py="$4" alignItems="center">
              <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={12}>
                Henüz product bulunmuyor.
              </Text>
            </Box>
          ) : (
            <FlatList
              data={products}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16, paddingBottom: 8 }}
              ItemSeparatorComponent={() => <Box width={12} />}
              renderItem={({ item }) => (
                <ProductCard
                  data={item}
                  onPress={() => handleProductPress(item.id)}
                />
              )}
              keyExtractor={(item) => item.id}
              nestedScrollEnabled={true}
              onEndReached={handleLoadMoreProducts}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isFetchingNextProductsPage ? (
                  <Box width={60} height={60} alignItems="center" justifyContent="center" alignSelf="center">
                    <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                  </Box>
                ) : null
              }
            />
          )}
        </VStack>
      </Box>
    </VStack>
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

