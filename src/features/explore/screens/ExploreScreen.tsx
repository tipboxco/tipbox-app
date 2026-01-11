import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ActivityIndicator, Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  withTiming,
} from 'react-native-reanimated';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  Input,
  InputField,
  Image
} from '@gluestack-ui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import Carousel, { ICarouselInstance, Pagination } from 'react-native-reanimated-carousel';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaValues, toImageSource } from '@/src/utils';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { HottestTab, NewsTab } from '../components';
import { useMarketplaceBanners } from '../api/hooks';
import type { MarketplaceBanner } from '../types';
import type { ExploreStackParamList } from '../navigation';
import { deepLinkService } from '@/src/services/DeepLinkService';
import { navigationService } from '@/src/services/NavigationService';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { ProductInfoType } from '@/src/types/common';
import * as Linking from 'expo-linking';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

// Banner Carousel Component (CardImageCarousel style)
interface BannerCarouselProps {
  banners: MarketplaceBanner[];
  isDark: boolean;
  onBannerPress?: (linkUrl: string) => void;
}

const BannerCarouselComponent: React.FC<BannerCarouselProps> = ({ banners, isDark, onBannerPress }) => {
  const carouselRef = useRef<ICarouselInstance>(null);
  const carouselPadding = 16; // Sağdan soldan padding
  const itemSpacing = 12; // Görseller arası boşluk
  const carouselWidth = Dimensions.get('window').width;
  const carouselHeight = 200; // Banner için sabit yükseklik
  const itemWidth = carouselWidth - (carouselPadding * 2); // Her item'ın genişliği
  const autoPlayInterval = 5000; // 5 saniye

  if (!banners?.length) return null;

  // Tek banner varsa sadece göster, carousel kullanma
  if (banners.length === 1) {
    const imageSource = toImageSource(banners[0].imageUrl);
    const defaultBannerImage = require('@/assets/defaultImages/default-banner.png');
    return (
      <Box
        w={carouselWidth}
        h={carouselHeight}
        px={carouselPadding}
        overflow="hidden"
        position="relative"
        alignSelf="center"
      >
        <Pressable
          onPress={() => {
            if (onBannerPress && banners[0].linkUrl) {
              onBannerPress(banners[0].linkUrl);
            }
          }}
          style={{
            position: 'relative',
          }}
        >
          <Image
            source={imageSource || defaultBannerImage}
            alt={banners[0].title}
            resizeMode="cover"
            width={itemWidth}
            height={carouselHeight}
            borderRadius={12}
          />
          {/* Gradient Overlay */}
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            height={80}
            overflow="hidden"
            style={{
              width: itemWidth,
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
            }}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.4)', 'transparent']}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 80,
                justifyContent: 'flex-end',
                paddingBottom: 12,
                paddingHorizontal: 16,
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
              }}
            >
              <VStack space="xs">
                <Text
                  color="#FFFFFF"
                  fontSize={14}
                  fontWeight="$bold"
                  numberOfLines={1}
                >
                  {banners[0].title}
                </Text>
                <Text
                  color="#FFFFFF"
                  fontSize={12}
                  numberOfLines={2}
                  opacity={0.9}
                >
                  {banners[0].description}
                </Text>
              </VStack>
            </LinearGradient>
          </Box>
        </Pressable>
      </Box>
    );
  }

  return (
    <Box
      w={carouselWidth}
      h={carouselHeight}
      overflow="hidden"
      position="relative"
      alignSelf="center"
    >
      <Carousel
        ref={carouselRef}
        width={carouselWidth}
        height={carouselHeight}
        data={banners}
        autoPlay={banners.length > 1}
        autoPlayInterval={autoPlayInterval}
        loop={true}
        renderItem={({ index }) => {
          const item = banners[index];
          const imageSource = toImageSource(item.imageUrl);
          const defaultBannerImage = require('@/assets/defaultImages/default-banner.png');
          return (
            <Box
              width={carouselWidth}
              alignItems="center"
              justifyContent="center"
            >
              <Pressable
                onPress={() => {
                  if (onBannerPress && item.linkUrl) {
                    onBannerPress(item.linkUrl);
                  }
                }}
                style={{
                  width: itemWidth - itemSpacing,
                  marginHorizontal: itemSpacing / 2,
                  position: 'relative',
                }}
              >
                <Image
                  source={imageSource || defaultBannerImage}
                  alt={item.title}
                  resizeMode="cover"
                  width={itemWidth - itemSpacing}
                  height={carouselHeight}
                  borderRadius={12}
                />
                {/* Gradient Overlay */}
                <Box
                  position="absolute"
                  bottom={0}
                  left={0}
                  right={0}
                  height={80}
                  overflow="hidden"
                  style={{
                    width: itemWidth - itemSpacing,
                    borderBottomLeftRadius: 12,
                    borderBottomRightRadius: 12,
                  }}
                >
                  <LinearGradient
                    colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.4)', 'transparent']}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 80,
                      justifyContent: 'flex-end',
                      paddingBottom: 12,
                      paddingHorizontal: 16,
                      borderBottomLeftRadius: 12,
                      borderBottomRightRadius: 12,
                    }}
                  >
                    <VStack space="xs">
                      <Text
                        color="#FFFFFF"
                        fontSize={14}
                        fontWeight="$bold"
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text
                        color="#FFFFFF"
                        fontSize={12}
                        numberOfLines={2}
                        opacity={0.9}
                      >
                        {item.description}
                      </Text>
                    </VStack>
                  </LinearGradient>
                </Box>
              </Pressable>
            </Box>
          );
        }}
      />

    </Box>
  );
};

// React.memo ile sarmalayarak gereksiz re-render'ları önle
const BannerCarousel = React.memo(BannerCarouselComponent, (prevProps, nextProps) => {
  // Sadece banners array'inin uzunluğu, isDark veya onBannerPress değiştiğinde re-render
  // banners array referansı aynıysa re-render yapma
  if (
    prevProps.banners === nextProps.banners && 
    prevProps.isDark === nextProps.isDark &&
    prevProps.onBannerPress === nextProps.onBannerPress
  ) {
    return true; // Re-render yapma
  }
  return false; // Re-render yap
});

const ExploreScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList & RootStackParamList>>();
  const pagerRef = useRef<PagerView>(null);
  const tabContainerRef = useRef<any>(null);
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  
  // 🎯 CORE: Shared progress value (0 = Hottest, 1 = News)
  const progress = useSharedValue(0);
  
  // Tab state - currentPage'e göre hesaplanıyor
  const activeCategory: 'hottest' | 'news' = currentPage === 0 ? 'hottest' : 'news';
  
  const bottomInset = useSafeAreaValues('bottom');
  const [searchBarHeight, setSearchBarHeight] = useState(0);
  const [bannerHeight, setBannerHeight] = useState(0);
  const [tabsHeight, setTabsHeight] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  // PERFORMANCE FIX: Memoize background colors to prevent re-renders
  const backgroundColor = useMemo(() => isDark ? '$backgroundDark950' : '$backgroundLight0', [isDark]);
  const tabHeaderBgColor = useMemo(() => isDark ? '#000' : '#FFF', [isDark]);

  // Debounce search query for API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Marketplace Banners API hook
  const {
    data: banners,
    isLoading: isLoadingBanners,
  } = useMarketplaceBanners();

  // Callback fonksiyonlarını useCallback ile sarmalayarak referanslarını stabilize et
  const handleEventPress = useCallback((eventId: string) => {
    // Events stack'ine navigate et
    navigationService.navigateNested(TAB_ROUTES.EVENTS, 'EventDetail' as any, { eventId });
  }, []);

  // Banner navigation handler
  const handleBannerPress = useCallback(async (linkUrl: string) => {
    try {
      // Internal deep link kontrolü (tipboxapp://)
      if (linkUrl.startsWith('tipboxapp://')) {
        const route = deepLinkService.parseURL(linkUrl);
        if (route) {
          // Tab route ise navigateNested kullan
          const tabRouteValues = Object.values(TAB_ROUTES) as string[];
          if (tabRouteValues.includes(route.screen)) {
            const tabRoute = route.screen as keyof typeof TAB_ROUTES;
            const screenName = route.params?.screen || 'CatalogScreen';
            const screenParams = route.params?.params || route.params || {};
            navigationService.navigateNested(tabRoute as any, screenName as any, screenParams);
          } else {
            // Root route ise navigate kullan
            navigationService.navigate(route.screen as any, route.params);
          }
        } else {
          console.warn('[ExploreScreen] ⚠️ Could not parse banner URL:', linkUrl);
        }
      } else if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
        // External URL - browser'da aç
        const canOpen = await Linking.canOpenURL(linkUrl);
        if (canOpen) {
          await Linking.openURL(linkUrl);
        } else {
          console.warn('[ExploreScreen] ⚠️ Cannot open external URL:', linkUrl);
        }
      } else {
        console.warn('[ExploreScreen] ⚠️ Invalid banner URL format:', linkUrl);
      }
    } catch (error) {
      console.error('[ExploreScreen] ❌ Error handling banner press:', error);
    }
  }, []);

  // See All Buttons - Navigation handlers
  const handleSeeAllEvents = useCallback(() => {
    // Catalog tab'ına Event listesine git (Events tab'ına navigate et)
    navigationService.navigateNested(TAB_ROUTES.EVENTS, 'EventsScreen' as any, undefined);
  }, []);

  const handleSeeAllBrands = useCallback(() => {
    // Catalog tab'ına Brand listesine git
    navigationService.navigateNested(TAB_ROUTES.CATALOG, 'CatalogScreen' as any, { view: 'brands' });
  }, []);

  const handleSeeAllProducts = useCallback(() => {
    // Catalog tab'ına Product listesine git
    navigationService.navigateNested(TAB_ROUTES.CATALOG, 'CatalogScreen' as any, { view: 'products' });
  }, []);

  // Item Press Handlers - Navigation
  const handleBrandPress = useCallback((brandId: string) => {
    // BrandPostListScreen'e navigate et (Catalog stack içinde)
    navigationService.navigateNested(TAB_ROUTES.CATALOG, 'BrandPostListScreen' as any, { brandId });
  }, []);

  const handleProductPress = useCallback((productId: string) => {
    // PostsScreen'e navigate et (Post stack içinde, product context ile)
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'PostsScreen',
      params: {
        stage: 'Product',
        name: '', // Product name API'den gelecek veya PostsScreen'de gösterilmeyecek
        productInfo: {
          image: require('@/assets/inventory/product_01.png'), // Placeholder, API'den gelecek
          title: '', // Placeholder, API'den gelecek
        },
        selectedProduct: {
          id: productId,
          name: '', // Placeholder, API'den gelecek
          description: '',
          image: require('@/assets/inventory/product_01.png'), // Placeholder
        },
        contextType: ProductInfoType.PRODUCT,
        contextId: productId, // Product ID'yi contextId olarak gönder
      },
    });
  }, []);

  // PERFORMANCE FIX: Memoize onLayout handlers to prevent unnecessary re-renders
  const handleSearchBarLayout = useCallback((event: any) => {
    const { height } = event.nativeEvent.layout;
    if (searchBarHeight === 0) {
      setSearchBarHeight(height);
    }
  }, [searchBarHeight]);

  const handleBannerLayout = useCallback((event: any) => {
    const { height } = event.nativeEvent.layout;
    if (bannerHeight === 0) {
      setBannerHeight(height);
    }
  }, [bannerHeight]);

  const handleTabsLayout = useCallback((event: any) => {
    const { height } = event.nativeEvent.layout;
    if (tabsHeight === 0) {
      setTabsHeight(height);
    }
  }, [tabsHeight]);

  // Tab press handler - PagerView native animasyonu ile geçiş
  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
  }, []);

  // PagerView scroll handler - realtime progress güncelleme
  const handlePageScroll = useCallback(
    (e: any) => {
      'worklet';
      const { position, offset } = e.nativeEvent;
      progress.value = position + offset;
    },
    [progress]
  );

  // PagerView page selected handler - snap sonrası progress'i sync et
  const handlePageSelected = useCallback(
    (e: any) => {
      const position = e.nativeEvent.position;
      progress.value = withTiming(position, { duration: 0 });
      setCurrentPage(position);
    },
    [progress]
  );

  // Tab 1 (Hottest) label color animation
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

  // Tab 2 (News) label color animation
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
  const indicatorWidth = tabWidth * 0.8; // Tab genişliğinin %80'i
  const indicatorStyle = useAnimatedStyle(() => {
    // Indicator'ı tab genişliğine göre translate et
    // Her tab'in ortasına yerleştirmek için: tabWidth * progress + (tabWidth - indicatorWidth) / 2
    const translateX = progress.value * tabWidth + (tabWidth - indicatorWidth) / 2;
    return {
      transform: [{ translateX }],
    };
  });

  // PERFORMANCE FIX: ExploreScreen uses ScrollView for heterogeneous content
  // Converting to FlashList would require major refactoring (array of different content types)
  // ScrollView is acceptable here because:
  // 1. Content is relatively static (Search Bar, Banner, Tabs, Tab Content)
  // 2. Tab content (HottestTab, NewsTab) already uses FlatList internally
  // 3. Nested scrolling is required
  // For better performance, consider migrating HottestTab and NewsTab internal FlatLists to FlashList
  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={backgroundColor}>
        <Header
          title="Explore"
          leftAction="menu"
        />

        <VStack flex={1} space="md">
          {/* Search Bar - Fixed at top */}
          <VStack
            px="$4"
            py="$2"
            onLayout={handleSearchBarLayout}
          >
            <HStack
              alignItems="center"
              bg={isDark ? '#1A1A1A' : '#FDFDFD'}
              borderWidth={1}
              borderColor="#E9E9E9"
              borderRadius={23}
              px={12}
              space="sm"
            >
              <Feather
                name="search"
                size={24}
                color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'}
              />
              <Input flex={1} borderWidth={0} bg="transparent">
                <InputField
                  placeholder="Select product group or search product name"
                  placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
                  color={isDark ? '#fff' : '#000'}
                  fontSize={11}
                />
              </Input>
            </HStack>
          </VStack>

          {/* Category Tabs - Fixed */}
          <VStack
            bg={tabHeaderBgColor}
            pt="$4"
            onLayout={handleTabsLayout}
          >
            <HStack
              ref={tabContainerRef}
              borderBottomWidth={1}
              borderColor="#E9E9E9"
              p={0}
              m={0}
              position="relative"
              onLayout={(event) => {
                const width = event.nativeEvent.layout.width;
                setTabContainerWidth(width);
              }}
            >
              {/* Hottest Tab Label */}
              <Pressable
                flex={1}
                onPress={() => handleTabPress(0)}
                alignItems="center"
                pb="$1"
              >
                <VStack alignItems="center" space="xs">
                  <Animated.Text
                    style={[
                      {
                        fontSize: 12,
                        fontWeight: 'bold',
                      },
                      tab1Style,
                    ]}
                  >
                    Hottest
                  </Animated.Text>
                </VStack>
              </Pressable>

              {/* What's News Tab Label */}
              <Pressable
                flex={1}
                onPress={() => handleTabPress(1)}
                alignItems="center"
                pb="$1"
              >
                <VStack alignItems="center" space="xs">
                  <Animated.Text
                    style={[
                      {
                        fontSize: 14,
                        fontWeight: 'bold',
                      },
                      tab2Style,
                    ]}
                  >
                    What's News
                  </Animated.Text>
                </VStack>
              </Pressable>

              {/* Animated Indicator */}
              {tabWidth > 0 && (
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: indicatorWidth,
                      height: 2,
                      backgroundColor: isDark ? '#FFFFFF' : '#000000',
                    },
                    indicatorStyle,
                  ]}
                />
              )}
            </HStack>
          </VStack>

          {/* PagerView - Native swipe tab switching */}
          <AnimatedPagerView
            ref={pagerRef}
            style={{ flex: 1 }}
            initialPage={0}
            onPageScroll={handlePageScroll}
            onPageSelected={handlePageSelected}
          >
            {/* Hottest Tab */}
            <Box key="0" flex={1}>
              <HottestTab 
                searchQuery={debouncedSearchQuery}
                headerComponent={
                  /* Marketplace Banners Carousel - Scrollable */
                  !isLoadingBanners && banners && banners.length > 0 ? (
                    <Box
                      mb="$4"
                      onLayout={handleBannerLayout}
                    >
                      <BannerCarousel banners={banners} isDark={isDark} onBannerPress={handleBannerPress} />
                    </Box>
                  ) : null
                }
              />
            </Box>

            {/* News Tab */}
            <Box key="1" flex={1}>
              <NewsTab
                searchQuery={debouncedSearchQuery}
                onEventPress={handleEventPress}
                onBrandPress={handleBrandPress}
                onProductPress={handleProductPress}
                onSeeAllEvents={handleSeeAllEvents}
                onSeeAllBrands={handleSeeAllBrands}
                onSeeAllProducts={handleSeeAllProducts}
                headerComponent={
                  /* Marketplace Banners Carousel - Scrollable */
                  !isLoadingBanners && banners && banners.length > 0 ? (
                    <Box
                      mb="$4"
                      onLayout={handleBannerLayout}
                    >
                      <BannerCarousel banners={banners} isDark={isDark} onBannerPress={handleBannerPress} />
                    </Box>
                  ) : null
                }
              />
            </Box>
          </AnimatedPagerView>
        </VStack>
      </Box>
    </SafeAreaView>
  );
};

ExploreScreen.displayName = 'ExploreScreen';

// PERFORMANCE FIX: Memoize ExploreScreen to prevent unnecessary re-renders during tab transitions
export default React.memo(ExploreScreen);