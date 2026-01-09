import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Platform, Keyboard, ActivityIndicator, Dimensions, Modal, StyleSheet, Pressable as RNPressable } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputField,
  Pressable,
  ScrollView,
  Image,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useSearch } from '@/src/features/search/api/hooks';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { toImageSource } from '@/src/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { navigationService } from '@/src/services/NavigationService';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.5; // %50
const SWIPE_THRESHOLD = 100; // Kapatma için minimum kayma mesafesi

type SearchFilter = 'users' | 'brands' | 'products';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * SearchModal Component
 * React Native Modal + Reanimated + Gesture Handler kullanarak
 * yukarıdan aşağıya açılan, handler'dan sürüklenebilen arama modal'ı
 */
export const SearchModal: React.FC<SearchModalProps> = ({ visible, onClose }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<SearchFilter>('users');
  const inputRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const pagerRef = useRef<PagerView>(null);
  const tabContainerRef = useRef<any>(null);
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // Debounced search query - API çağrısını optimize et
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Animation values
  const translateY = useSharedValue(-MODAL_HEIGHT);
  const opacity = useSharedValue(0);
  const panY = useSharedValue(0);
  
  // 🎯 CORE: Shared progress value (0 = Users, 1 = Brands, 2 = Products)
  const progress = useSharedValue(0);

  // Her tab için önceden verileri çek ve cache'le - tab değiştiğinde önceki tab'ın verileri görünmesin
  // Users tab için
  const {
    data: usersDefaultData,
    isLoading: isUsersLoading,
  } = useSearch(
    {
      keyword: '',
      types: ['user'],
      limit: 4,
    },
    debouncedQuery.length === 0 && visible // Modal açıkken ve input boşken aktif
  );

  // Brands tab için
  const {
    data: brandsDefaultData,
    isLoading: isBrandsLoading,
  } = useSearch(
    {
      keyword: '',
      types: ['brand'],
      limit: 4,
    },
    debouncedQuery.length === 0 && visible // Modal açıkken ve input boşken aktif
  );

  // Products tab için
  const {
    data: productsDefaultData,
    isLoading: isProductsLoading,
  } = useSearch(
    {
      keyword: '',
      types: ['product'],
      limit: 4,
    },
    debouncedQuery.length === 0 && visible // Modal açıkken ve input boşken aktif
  );

  // Arama sonuçları için (input dolu iken) - seçili tab'a göre
  const searchTypes = useMemo(() => {
    switch (selectedFilter) {
      case 'users':
        return ['user'];
      case 'brands':
        return ['brand'];
      case 'products':
        return ['product'];
      default:
        return ['user'];
    }
  }, [selectedFilter]);

  const {
    data: searchData,
    isLoading: isSearching,
    error: searchError,
  } = useSearch(
    {
      keyword: debouncedQuery,
      types: searchTypes,
      limit: 10, // Arama sonuçları için 10'ar tane (API limit ile uyumlu)
    },
    debouncedQuery.length > 0 && visible // Sadece query varsa ve modal açıkken aktif et
  );

  // Display data'yı seçili tab'a göre belirle - cache'den kullan
  const displayData = useMemo(() => {
    if (debouncedQuery.length > 0) {
      return searchData;
    }
    // Input boşken, seçili tab'a göre cache'den veri al
    switch (selectedFilter) {
      case 'users':
        return usersDefaultData;
      case 'brands':
        return brandsDefaultData;
      case 'products':
        return productsDefaultData;
      default:
        return usersDefaultData;
    }
  }, [debouncedQuery.length, searchData, selectedFilter, usersDefaultData, brandsDefaultData, productsDefaultData]);

  // Loading state'i seçili tab'a göre belirle
  const isLoading = useMemo(() => {
    if (debouncedQuery.length > 0) {
      return isSearching;
    }
    switch (selectedFilter) {
      case 'users':
        return isUsersLoading;
      case 'brands':
        return isBrandsLoading;
      case 'products':
        return isProductsLoading;
      default:
        return isUsersLoading;
    }
  }, [debouncedQuery.length, isSearching, selectedFilter, isUsersLoading, isBrandsLoading, isProductsLoading]);

  // Has results kontrolü - sadece seçili tab'ın verilerini kontrol et
  const hasResults = useMemo(() => {
    if (debouncedQuery.length > 0) {
      // Arama sonuçları için
      return (
        (selectedFilter === 'users' && displayData?.userData && displayData.userData.length > 0) ||
        (selectedFilter === 'brands' && displayData?.brandData && displayData.brandData.length > 0) ||
        (selectedFilter === 'products' && displayData?.productData && displayData.productData.length > 0)
      );
    }
    // Default veriler için - sadece seçili tab'ın verilerini kontrol et
    switch (selectedFilter) {
      case 'users':
        return displayData?.userData && displayData.userData.length > 0;
      case 'brands':
        return displayData?.brandData && displayData.brandData.length > 0;
      case 'products':
        return displayData?.productData && displayData.productData.length > 0;
      default:
        return false;
    }
  }, [debouncedQuery.length, selectedFilter, displayData]);

  // Debounce effect - thread safety için optimize edildi
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce'u artır - search sırasında gesture handler'ı rahatsız etmemek için
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 500); // 500ms debounce (300ms'den artırıldı)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Close callback
  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    setSearchQuery('');
    setDebouncedQuery('');
    onClose();
  }, [onClose]);

  // Tab press handler - PagerView native animasyonu ile geçiş
  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    // Filter'ı da güncelle
    const filters: SearchFilter[] = ['users', 'brands', 'products'];
    setSelectedFilter(filters[index]);
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
      // Filter'ı da güncelle
      const filterMap: SearchFilter[] = ['users', 'brands', 'products'];
      setSelectedFilter(filterMap[position]);
    },
    [progress]
  );

  // Tab 1 (Users) label color animation
  const tab1Style = useAnimatedStyle(() => {
    const activeColor = isDark ? '#FFFFFF' : '#000000';
    const inactiveColor = '#8C8C8C';
    const color = interpolateColor(
      progress.value,
      [0, 1, 2],
      [activeColor, inactiveColor, inactiveColor]
    );
    return { color };
  });

  // Tab 2 (Brands) label color animation
  const tab2Style = useAnimatedStyle(() => {
    const activeColor = isDark ? '#FFFFFF' : '#000000';
    const inactiveColor = '#8C8C8C';
    const color = interpolateColor(
      progress.value,
      [0, 1, 2],
      [inactiveColor, activeColor, inactiveColor]
    );
    return { color };
  });

  // Tab 3 (Products) label color animation
  const tab3Style = useAnimatedStyle(() => {
    const activeColor = isDark ? '#FFFFFF' : '#000000';
    const inactiveColor = '#8C8C8C';
    const color = interpolateColor(
      progress.value,
      [0, 1, 2],
      [inactiveColor, inactiveColor, activeColor]
    );
    return { color };
  });

  // Indicator position animation
  const tabWidth = tabContainerWidth / 3 || 0;
  const indicatorWidth = tabWidth * 0.8; // Tab genişliğinin %80'i
  const indicatorStyle = useAnimatedStyle(() => {
    // Indicator'ı tab genişliğine göre translate et
    const translateX = progress.value * tabWidth + (tabWidth - indicatorWidth) / 2;
    return {
      transform: [{ translateX }],
    };
  });

  // Focus input callback - worklet dışında tanımla
  const focusInput = useCallback(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, []);

  // Close callback - worklet dışında tanımla (thread safety için)
  // useEffect'ten önce tanımlanmalı (hoisting sorunu için)
  const closeModal = useCallback(() => {
    handleClose();
    setShouldRender(false);
    setIsAnimating(false);
    // Shared value'ları reset et (worklet dışında direkt erişim)
    translateY.value = -MODAL_HEIGHT;
    panY.value = 0;
  }, [handleClose]);

  // PERFORMANCE FIX: Optimized modal animation with faster spring config and requestAnimationFrame
  // Removed 50ms delay, optimized spring parameters for instant feel
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setIsAnimating(true);
      
      // Reset values immediately
      translateY.value = -MODAL_HEIGHT;
      panY.value = 0;
      progress.value = 0;
      setCurrentPage(0);
      setSelectedFilter('users');
      // PagerView'i de ilk sayfaya al
      pagerRef.current?.setPage(0);
      
      // PERFORMANCE FIX: Use requestAnimationFrame instead of setTimeout for instant start
      // This ensures animation starts on next frame (16ms) instead of 50ms delay
      const rafId = requestAnimationFrame(() => {
        // FIX: Optimized spring config to prevent overshoot (aşağı inip yukarı çıkma sorunu)
        // Higher damping (25) = less overshoot, balanced stiffness (200) = smooth but controlled
        opacity.value = withTiming(1, { duration: 150 }); // Reduced from 200ms to 150ms
        translateY.value = withSpring(
          0,
          {
            damping: 25, // Increased from 15 to prevent overshoot
            stiffness: 200, // Reduced from 300 for smoother, controlled animation
            mass: 0.3, // Kept light for responsiveness
          },
          (finished) => {
            'worklet';
            if (finished) {
              runOnJS(setIsAnimating)(false);
              runOnJS(focusInput)();
            }
          }
        );
      });

      return () => cancelAnimationFrame(rafId);
    } else if (shouldRender) {
      setIsAnimating(true);
      // FIX: Consistent spring config for close animation (no overshoot)
      opacity.value = withTiming(0, { duration: 150 }); // Reduced from 200ms
      translateY.value = withSpring(
        -MODAL_HEIGHT,
        {
          damping: 25, // Consistent with open animation to prevent overshoot
          stiffness: 200,
          mass: 0.3,
        },
        (finished) => {
          'worklet';
          if (finished) {
            runOnJS(closeModal)();
          }
        }
      );
    }
  }, [visible, translateY, opacity, panY, shouldRender, focusInput, closeModal]);

  // Gesture handler - sadece handler'dan sürükleme (yeni Gesture API)
  // useMemo ile memoize et - thread safety için
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          'worklet';
          // Gesture başladığında mevcut pozisyonu kaydet
        })
        .onUpdate((event) => {
          'worklet';
          // Alttan yukarı çekme (kapatma) - translationY negatif olmalı
          // Modal yukarıdan aşağıya açıldığı için, alttan yukarı çekince kapanır
          if (event.translationY < 0) {
            panY.value = event.translationY;
          }
        })
        .onEnd((event) => {
          'worklet';
          const totalTranslation = translateY.value + panY.value;

          // Eğer yeterince yukarı çekildiyse kapat (alttan yukarı çekme)
          if (totalTranslation < -SWIPE_THRESHOLD || event.velocityY < -500) {
            // Kapat - animasyonları başlat
            panY.value = 0;
            translateY.value = withSpring(
              -MODAL_HEIGHT,
              {
                damping: 25, // Consistent with other animations
                stiffness: 200,
                mass: 0.3,
              },
              (finished) => {
                'worklet';
                if (finished) {
                  // JS thread'ine geç - sadece bir kez çağır
                  runOnJS(closeModal)();
                }
              }
            );
            opacity.value = withTiming(0, { duration: 150 }); // Consistent duration
          } else {
            // FIX: Consistent spring config for gesture return (no overshoot)
            panY.value = withSpring(0, {
              damping: 25,
              stiffness: 200,
              mass: 0.3,
            });
          }
        })
        .enabled(visible && shouldRender && !isAnimating), // Sadece modal açık ve animasyon yokken aktif
    [visible, shouldRender, isAnimating, panY, translateY, opacity, closeModal]
  );

  // Animated styles - thread safety için optimize edildi
  const modalAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateY: translateY.value + panY.value }],
    };
  }, [translateY, panY]);

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: opacity.value,
    };
  }, [opacity]);

  // User item'a tıklandığında profile git
  const handleUserPress = useCallback(
    (userId: string) => {
      if (!userId) {
        console.warn('[SearchModal] handleUserPress: userId is missing');
        return;
      }
      handleClose();
      setTimeout(() => {
        (navigation as any).navigate('Profile', {
          screen: 'ProfileMain',
          params: { userId },
        });
      }, 300);
    },
    [navigation, handleClose]
  );

  // Brand item'a tıklandığında brand post list screen'e git
  const handleBrandPress = useCallback(
    (brandId: string) => {
      if (!brandId) {
        console.warn('[SearchModal] handleBrandPress: brandId is missing');
        return;
      }
      handleClose();
      setTimeout(() => {
        // Catalog tab'ına nested navigation → BrandPostListScreen
        navigationService.navigateNested(TAB_ROUTES.CATALOG, 'BrandPostListScreen' as any, {
          brandId,
        });
      }, 300);
    },
    [handleClose]
  );

  // Product item'a tıklandığında product post list screen'e git
  const handleProductPress = useCallback(
    (productId: string) => {
      if (!productId) {
        console.warn('[SearchModal] handleProductPress: productId is missing');
        return;
      }
      handleClose();
      setTimeout(() => {
        // Post stack'ine navigate → PostsScreen (productId contextId olarak)
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
      }, 300);
    },
    [handleClose]
  );

  // Render search results
  const renderSearchResults = () => {
    // Arama yapıldığında (input dolu iken)
    if (debouncedQuery.length > 0) {
      if (isSearching) {
        return (
          <Box flex={1} justifyContent="center" alignItems="center" py="$20">
            <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            <Text
              mt="$4"
              fontSize="$xs"
              color={isDark ? '#8E8E93' : '#8E8E93'}
              textAlign="center"
            >
              Aranıyor...
            </Text>
          </Box>
        );
      }

      if (searchError) {
        return (
          <Box flex={1} justifyContent="center" alignItems="center" px="$4" py="$20">
            <Feather name="alert-circle" size={48} color="#CE4A4A" />
            <Text
              mt="$4"
              fontSize="$xs"
              color="#CE4A4A"
              textAlign="center"
              fontWeight="$semibold"
            >
              Arama sırasında bir hata oluştu
            </Text>
            <Text
              mt="$2"
              fontSize="$sm"
              color={isDark ? '#8E8E93' : '#8E8E93'}
              textAlign="center"
            >
              Lütfen tekrar deneyin
            </Text>
          </Box>
        );
      }

      // Arama sonuçları yoksa
      const hasSearchResults = 
        (selectedFilter === 'users' && searchData?.userData && searchData.userData.length > 0) ||
        (selectedFilter === 'brands' && searchData?.brandData && searchData.brandData.length > 0) ||
        (selectedFilter === 'products' && searchData?.productData && searchData.productData.length > 0);

      if (!hasSearchResults) {
        return (
          <Box flex={1} justifyContent="center" alignItems="center" py="$20">
            <Feather name="search" size={56} color={isDark ? '#48484A' : '#D1D1D6'} />
            <Text
              mt="$4"
              fontSize="$sm"
              color={isDark ? '#8E8E93' : '#8E8E93'}
              textAlign="center"
              fontWeight="$medium"
            >
              Sonuç bulunamadı
            </Text>
            <Text
              mt="$2"
              fontSize="$xs"
              color={isDark ? '#8E8E93' : '#8E8E93'}
              textAlign="center"
            >
              "{debouncedQuery}" için arama sonucu yok
            </Text>
          </Box>
        );
      }

      // Arama sonuçlarını göster - arama sonuçları için displayData yerine searchData kullan
      // Bu kısım aşağıdaki return'de render edilecek
    }

    // Input boşken - default veriler
    // Tab değiştiğinde önceki tab'ın verilerini gösterme - sadece seçili tab'ın verilerini göster
    // Her tab için doğrudan cache'den veri al

    // Arama sonuçları için render
    if (debouncedQuery.length > 0) {
      return (
        <VStack space="sm" flex={1}>
          {/* Users Tab - Arama sonuçları */}
          {selectedFilter === 'users' && searchData?.userData && searchData.userData.length > 0 && (
            <VStack>
              {searchData.userData.map((user: any) => (
                <Pressable key={user.id} onPress={() => handleUserPress(user.id)}>
                  <HStack
                    alignItems="center"
                    space="md"
                    py="$2"
                    px="$4"
                  >
                    {/* Avatar - Circular with red border */}
                    <Box
                      width={56}
                      height={56}
                      borderRadius={100}
                      borderWidth={2}
                      borderColor="#CE4A4A"
                      alignItems="center"
                      justifyContent="center"
                      overflow="hidden"
                      bg={isDark ? '#1C1C1E' : '#F2F2F7'}
                    >
                      <Image
                        source={toImageSource(user.avatar) || require('@/assets/avatar/ozan.png')}
                        alt={user.name}
                        width={52}
                        height={52}
                        resizeMode="cover"
                      />
                    </Box>

                    {/* User Info */}
                    <VStack flex={1} space="xs">
                      <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize="$sm"
                        fontWeight="$bold"
                        numberOfLines={1}
                      >
                        {user.name}
                      </Text>
                      {user.cosmetic && (
                        <VStack space="xs">
                          <Text
                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            fontSize="$xs"
                            numberOfLines={1}
                            lineHeight={18}
                          >
                            {user.cosmetic.split(' - ')[0] || user.cosmetic}
                          </Text>
                          {user.cosmetic.includes(' - ') && user.cosmetic.split(' - ').length > 1 && (
                            <Text
                              color={isDark ? '#8C8C8C' : '#8C8C8C'}
                              fontSize="$xs"
                              numberOfLines={1}
                              lineHeight={18}
                            >
                              {user.cosmetic.split(' - ').slice(1).join(' - ')}
                            </Text>
                          )}
                        </VStack>
                      )}
                    </VStack>
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          )}

          {/* Brands Tab - Arama sonuçları */}
          {selectedFilter === 'brands' && searchData?.brandData && searchData.brandData.length > 0 && (
            <VStack>
              {searchData.brandData.map((brand: any) => (
                <Pressable key={brand.id} onPress={() => handleBrandPress(brand.id)}>
                  <HStack
                    alignItems="center"
                    space="md"
                    py="$2"
                    px="$4"
                  >
                    {/* Brand Logo */}
                    <Box width={54} height={54} borderRadius={8} overflow="hidden">
                      <Image
                        source={
                          toImageSource(brand.logo) || require('@/assets/inventory/product_01.png')
                        }
                        alt={brand.name}
                        width={54}
                        height={54}
                        resizeMode="contain"
                      />
                    </Box>

                    {/* Brand Info */}
                    <VStack flex={1} space="xs">
                      <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize="$xs"
                        fontWeight="$bold"
                        numberOfLines={1}
                      >
                        {brand.name}
                      </Text>
                      {brand.category && (
                        <Text
                          color={isDark ? '#8C8C8C' : '#8C8C8C'}
                          fontSize="$sm"
                          numberOfLines={1}
                        >
                          {brand.category}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          )}

          {/* Products Tab - Arama sonuçları */}
          {selectedFilter === 'products' && searchData?.productData && searchData.productData.length > 0 && (
            <VStack>
              {searchData.productData.map((product: any) => (
                <Box
                  key={product.id}
                  py="$2"
                  px="$4"
                >
                  <ProductInfoCard
                    size="big"
                    type={ProductInfoType.PRODUCT}
                    image={toImageSource(product.image) || require('@/assets/inventory/product_01.png')}
                    title={product.name}
                    subName={product.model || product.specs || ''}
                    onPress={() => handleProductPress(product.id)}
                  />
                </Box>
              ))}
            </VStack>
          )}
        </VStack>
      );
    }

    // Default veriler için render - her tab için doğrudan cache'den veri al
    return (
      <VStack space="sm" flex={1}>
        {/* Users Tab - Sadece users göster - sadece users tab'ı seçiliyse ve veri varsa */}
        {selectedFilter === 'users' && (
          <>
            {isUsersLoading ? (
              <Box flex={1} justifyContent="center" alignItems="center" py="$20">
                <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                <Text
                  mt="$4"
                  fontSize="$xs"
                  color={isDark ? '#8E8E93' : '#8E8E93'}
                  textAlign="center"
                >
                  Yükleniyor...
                </Text>
              </Box>
            ) : usersDefaultData?.userData && usersDefaultData.userData.length > 0 ? (
              <VStack>
                {usersDefaultData.userData.map((user: any) => (
              <Pressable key={user.id} onPress={() => handleUserPress(user.id)}>
                <HStack
                  alignItems="center"
                  space="md"
                  py="$2"
                  px="$4"
                >
                  {/* Avatar - Circular with red border */}
                  <Box
                    width={56}
                    height={56}
                    borderRadius={100}
                    borderWidth={2}
                    borderColor="#CE4A4A"
                    alignItems="center"
                    justifyContent="center"
                    overflow="hidden"
                    bg={isDark ? '#1C1C1E' : '#F2F2F7'}
                  >
                    <Image
                      source={toImageSource(user.avatar) || require('@/assets/avatar/ozan.png')}
                      alt={user.name}
                      width={52}
                      height={52}
                      resizeMode="cover"
                    />
                  </Box>

                  {/* User Info */}
                  <VStack flex={1} space="xs">
                    <Text
                      color={isDark ? '#FFFFFF' : '#000000'}
                      fontSize="$sm"
                      fontWeight="$bold"
                      numberOfLines={1}
                    >
                      {user.name}
                    </Text>
                    {user.cosmetic && (
                      <VStack space="xs">
                        {/* İlk satır */}
                        <Text
                          color={isDark ? '#8C8C8C' : '#8C8C8C'}
                          fontSize="$xs"
                          numberOfLines={1}
                          lineHeight={18}
                        >
                          {user.cosmetic.split(' - ')[0] || user.cosmetic}
                        </Text>
                        {/* İkinci satır - eğer " - " ile ayrılmışsa */}
                        {user.cosmetic.includes(' - ') && user.cosmetic.split(' - ').length > 1 && (
                          <Text
                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            fontSize="$xs"
                            numberOfLines={1}
                            lineHeight={18}
                          >
                            {user.cosmetic.split(' - ').slice(1).join(' - ')}
                          </Text>
                        )}
                      </VStack>
                    )}
                  </VStack>
                  </HStack>
                </Pressable>
              ))}
              </VStack>
            ) : null}
          </>
        )}

        {/* Brands Tab - Sadece brands göster - sadece brands tab'ı seçiliyse ve veri varsa */}
        {selectedFilter === 'brands' && (
          <>
            {isBrandsLoading ? (
              <Box flex={1} justifyContent="center" alignItems="center" py="$20">
                <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                <Text
                  mt="$4"
                  fontSize="$xs"
                  color={isDark ? '#8E8E93' : '#8E8E93'}
                  textAlign="center"
                >
                  Yükleniyor...
                </Text>
              </Box>
            ) : brandsDefaultData?.brandData && brandsDefaultData.brandData.length > 0 ? (
              <VStack>
                {brandsDefaultData.brandData.map((brand: any) => (
              <Pressable key={brand.id} onPress={() => handleBrandPress(brand.id)}>
                <HStack
                  alignItems="center"
                  space="md"
                  py="$2"
                  px="$4"
                >
                  {/* Brand Logo */}
                  <Box width={54} height={54} borderRadius={8} overflow="hidden">
                    <Image
                      source={
                        toImageSource(brand.logo) || require('@/assets/inventory/product_01.png')
                      }
                      alt={brand.name}
                      width={54}
                      height={54}
                      resizeMode="contain"
                    />
                  </Box>

                  {/* Brand Info */}
                  <VStack flex={1} space="xs">
                    <Text
                      color={isDark ? '#FFFFFF' : '#000000'}
                      fontSize="$xs"
                      fontWeight="$bold"
                      numberOfLines={1}
                    >
                      {brand.name}
                    </Text>
                    {brand.category && (
                      <Text
                        color={isDark ? '#8C8C8C' : '#8C8C8C'}
                        fontSize="$sm"
                        numberOfLines={1}
                      >
                        {brand.category}
                      </Text>
                    )}
                  </VStack>
                  </HStack>
                </Pressable>
              ))}
              </VStack>
            ) : null}
          </>
        )}

        {/* Products Tab - Sadece products göster - sadece products tab'ı seçiliyse ve veri varsa */}
        {selectedFilter === 'products' && (
          <>
            {isProductsLoading ? (
              <Box flex={1} justifyContent="center" alignItems="center" py="$20">
                <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                <Text
                  mt="$4"
                  fontSize="$xs"
                  color={isDark ? '#8E8E93' : '#8E8E93'}
                  textAlign="center"
                >
                  Yükleniyor...
                </Text>
              </Box>
            ) : productsDefaultData?.productData && productsDefaultData.productData.length > 0 ? (
              <VStack>
                {productsDefaultData.productData.map((product: any) => (
                <Box
                  key={product.id}
                  py="$2"
                  px="$4"
                >
                  <ProductInfoCard
                    size="big"
                    type={ProductInfoType.PRODUCT}
                    image={toImageSource(product.image) || require('@/assets/inventory/product_01.png')}
                    title={product.name}
                    subName={product.model || product.specs || ''}
                    onPress={() => handleProductPress(product.id)}
                  />
                </Box>
              ))}
              </VStack>
            ) : null}
          </>
        )}
      </VStack>
    );
  };


  if (!shouldRender && !visible) {
    return null;
  }

  return (
    <Modal
      visible={shouldRender}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent
      hardwareAccelerated={true}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Box style={{ flex: 1 }}>
          {/* Overlay Background */}
          <Animated.View
            style={[
              {
                ...StyleSheet.absoluteFillObject,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
              },
              overlayAnimatedStyle,
            ]}
            pointerEvents={visible ? 'auto' : 'none'}
          >
            <RNPressable
              style={StyleSheet.absoluteFillObject}
              onPress={handleClose}
              pointerEvents="box-only"
            />
          </Animated.View>

          {/* Search Panel - Yukarıdan aşağıya */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: MODAL_HEIGHT + insets.top,
                backgroundColor: isDark ? '#000000' : '#FFFFFF',
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24,
                overflow: 'hidden',
              },
              modalAnimatedStyle,
            ]}
            pointerEvents="box-none"
          >
            <VStack flex={1} bg={isDark ? '#000000' : '#FFFFFF'} pointerEvents="auto">
              {/* Header */}
              <VStack space="sm" px="$4" pt={insets.top + 8} pb="$2">
                  {/* Search Bar */}
                  <HStack
                    alignItems="center"
                    bg={isDark ? '#1C1C1E' : '#F2F2F7'}
                    borderRadius={12}
                    px="$3"
                    space="sm"
                    h={48}
                  >
                    <Feather name="search" size={20} color={isDark ? '#8E8E93' : '#8E8E93'} />
                    <Input flex={1} borderWidth={0} bg="transparent">
                      <InputField
                        ref={inputRef}
                        placeholder="Search..."
                        placeholderTextColor={isDark ? '#8E8E93' : '#8E8E93'}
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize="$xs"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                        autoFocus={false}
                      />
                    </Input>
                    {searchQuery.length > 0 && (
                      <Pressable onPress={() => setSearchQuery('')} p="$1">
                        <Feather name="x-circle" size={18} color={isDark ? '#8E8E93' : '#8E8E93'} />
                      </Pressable>
                    )}
                  </HStack>

                </VStack>

                {/* Tab Header */}
                <VStack pt="$2" bg={isDark ? '#000000' : '#FFFFFF'}>
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
                    {/* Users Tab Label */}
                    <Pressable
                      flex={1}
                      onPress={() => handleTabPress(0)}
                      alignItems="center"
                      py="$1"
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
                          Users
                        </Animated.Text>
                      </VStack>
                    </Pressable>

                    {/* Brands Tab Label */}
                    <Pressable
                      flex={1}
                      onPress={() => handleTabPress(1)}
                      alignItems="center"
                      py="$1"
                    >
                      <VStack alignItems="center" space="xs">
                        <Animated.Text
                          style={[
                            {
                              fontSize: 12,
                              fontWeight: 'bold',
                            },
                            tab2Style,
                          ]}
                        >
                          Brands
                        </Animated.Text>
                      </VStack>
                    </Pressable>

                    {/* Products Tab Label */}
                    <Pressable
                      flex={1}
                      onPress={() => handleTabPress(2)}
                      alignItems="center"
                      py="$1"
                    >
                      <VStack alignItems="center" space="xs">
                        <Animated.Text
                          style={[
                            {
                              fontSize: 12,
                              fontWeight: 'bold',
                            },
                            tab3Style,
                          ]}
                        >
                          Products
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
                  pointerEvents="auto"
                >
                  {/* Users Tab */}
                  <Box key={`users-${selectedFilter === 'users' ? 'active' : 'inactive'}`} flex={1}>
                    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
                      {renderSearchResults()}
                    </ScrollView>
                  </Box>

                  {/* Brands Tab */}
                  <Box key={`brands-${selectedFilter === 'brands' ? 'active' : 'inactive'}`} flex={1}>
                    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
                      {renderSearchResults()}
                    </ScrollView>
                  </Box>

                  {/* Products Tab */}
                  <Box key={`products-${selectedFilter === 'products' ? 'active' : 'inactive'}`} flex={1}>
                    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
                      {renderSearchResults()}
                    </ScrollView>
                  </Box>
                </AnimatedPagerView>

              {/* Handler - Altta, sadece buradan sürüklenebilir (alttan yukarı çekme) */}
              <GestureDetector gesture={panGesture}>
                <Animated.View
                  style={{
                    paddingTop: 0,
                    paddingBottom: Platform.OS === 'ios' ? insets.bottom  : 0,
                    alignItems: 'center',
                 
                    borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA',
                  }}
                >
                  <Box
                    width={40}
                    height={4}
                    borderRadius={2}
                    bg={isDark ? '#3C3C3E' : '#D1D1D6'}
                  />
                </Animated.View>
              </GestureDetector>
            </VStack>
          </Animated.View>
        </Box>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default SearchModal;
