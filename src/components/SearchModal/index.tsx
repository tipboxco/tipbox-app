import React, { useState, useCallback, useMemo, useEffect, useRef, useReducer, memo } from 'react';
import { Platform, Keyboard, ActivityIndicator, Dimensions, Pressable as RNPressable } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolateColor,
  interpolate,
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
import {
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
} from 'react-native-heroicons/outline';
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

// 🎯 PERFORMANCE: Hızlı ve smooth açılma/kapanma animasyonu
// OPTIMIZATION 2: 250ms → 150ms (100ms kazanç, hala smooth)
const ANIMATION_DURATION = 150; // ms - daha hızlı
const TIMING_CONFIG = {
  duration: ANIMATION_DURATION,
};

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

// 🎯 OPTIMIZATION: State reducer - tüm state'leri birleştir
interface ModalState {
  searchQuery: string;
  debouncedQuery: string;
  selectedFilter: SearchFilter;
  shouldRender: boolean;
  isAnimating: boolean;
  tabContainerWidth: number;
  currentPage: number;
}

type ModalAction =
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_DEBOUNCED_QUERY'; payload: string }
  | { type: 'SET_SELECTED_FILTER'; payload: SearchFilter }
  | { type: 'SET_SHOULD_RENDER'; payload: boolean }
  | { type: 'SET_IS_ANIMATING'; payload: boolean }
  | { type: 'SET_TAB_CONTAINER_WIDTH'; payload: number }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'RESET_SEARCH' };

const initialState: ModalState = {
  searchQuery: '',
  debouncedQuery: '',
  selectedFilter: 'users',
  shouldRender: false,
  isAnimating: false,
  tabContainerWidth: 0,
  currentPage: 0,
};

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_DEBOUNCED_QUERY':
      return { ...state, debouncedQuery: action.payload };
    case 'SET_SELECTED_FILTER':
      return { ...state, selectedFilter: action.payload };
    case 'SET_SHOULD_RENDER':
      return { ...state, shouldRender: action.payload };
    case 'SET_IS_ANIMATING':
      return { ...state, isAnimating: action.payload };
    case 'SET_TAB_CONTAINER_WIDTH':
      return { ...state, tabContainerWidth: action.payload };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'RESET_SEARCH':
      return { ...state, searchQuery: '', debouncedQuery: '' };
    default:
      return state;
  }
};

// 🎯 OPTIMIZATION: Memoized User Item Component
interface UserItemProps {
  user: any;
  isDark: boolean;
  onPress: (userId: string) => void;
}

const UserItem = memo<UserItemProps>(({ user, isDark, onPress }) => {
  const avatarSource = useMemo(
    () => toImageSource(user.avatar) || require('@/assets/avatar/default-useravatar.png'),
    [user.avatar]
  );

  const cosmeticParts = useMemo(() => {
    if (!user.cosmetic) return null;
    const parts = user.cosmetic.split(' - ');
    return {
      first: parts[0] || user.cosmetic,
      rest: parts.length > 1 ? parts.slice(1).join(' - ') : null,
    };
  }, [user.cosmetic]);

  return (
    <Pressable onPress={() => onPress(user.id)}>
      <HStack alignItems="center" space="md" py="$2" px="$4">
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
          <Image source={avatarSource} alt={user.name} width={52} height={52} resizeMode="cover" />
        </Box>
        <VStack flex={1} space="xs">
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize="$sm"
            fontWeight="$bold"
            numberOfLines={1}
          >
            {user.name}
          </Text>
          {cosmeticParts && (
            <VStack space="xs">
              <Text
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                fontSize="$xs"
                numberOfLines={1}
                lineHeight={18}
              >
                {cosmeticParts.first}
              </Text>
              {cosmeticParts.rest && (
                <Text
                  color={isDark ? '#8C8C8C' : '#8C8C8C'}
                  fontSize="$xs"
                  numberOfLines={1}
                  lineHeight={18}
                >
                  {cosmeticParts.rest}
                </Text>
              )}
            </VStack>
          )}
        </VStack>
      </HStack>
    </Pressable>
  );
});

UserItem.displayName = 'UserItem';

// 🎯 OPTIMIZATION: Memoized Brand Item Component
interface BrandItemProps {
  brand: any;
  isDark: boolean;
  onPress: (brandId: string) => void;
}

const BrandItem = memo<BrandItemProps>(({ brand, isDark, onPress }) => {
  const logoSource = useMemo(
    () => toImageSource(brand.logo) || require('@/assets/inventory/product_01.png'),
    [brand.logo]
  );

  return (
    <Pressable onPress={() => onPress(brand.id)}>
      <HStack alignItems="center" space="md" py="$2" px="$4">
        <Box width={54} height={54} borderRadius={8} overflow="hidden">
          <Image source={logoSource} alt={brand.name} width={54} height={54} resizeMode="contain" />
        </Box>
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
  );
});

BrandItem.displayName = 'BrandItem';

// 🎯 OPTIMIZATION: Memoized Product Item Component
interface ProductItemProps {
  product: any;
  onPress: (productId: string) => void;
}

const ProductItem = memo<ProductItemProps>(({ product, onPress }) => {
  const imageSource = useMemo(
    () => toImageSource(product.image) || require('@/assets/inventory/product_01.png'),
    [product.image]
  );

  return (
    <Box py="$2" px="$4">
      <ProductInfoCard
        size="big"
        type={ProductInfoType.PRODUCT}
        image={imageSource}
        title={product.name}
        subName={product.model || product.specs || ''}
        onPress={() => onPress(product.id)}
      />
    </Box>
  );
});

ProductItem.displayName = 'ProductItem';

/**
 * SearchModal Component - PERFORMANCE OPTIMIZED (FilterBarReanimated Architecture)
 * 
 * PERFORMANCE ARCHITECTURE (FilterBarReanimated gibi):
 * - Single SharedValue (progress: 0-1) controls all animations
 * - All style calculations in worklets (UI thread)
 * - No Modal, absolute positioned overlay (better performance)
 * - Pre-calculated panel height for smooth animations
 * - withSpring for natural feel
 * 
 * OPTIMIZATIONS:
 * 1. useReducer ile state birleştirme (daha az re-render)
 * 2. Tek API çağrısı ile tüm default veriler (users, brands, products)
 * 3. Memoized item components (UserItem, BrandItem, ProductItem)
 * 4. Absolute positioned overlay (Modal yerine)
 * 5. Single progress SharedValue ile animasyon kontrolü
 */
export const SearchModal: React.FC<SearchModalProps> = ({ visible, onClose }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 🎯 OPTIMIZATION: useReducer ile state birleştirme
  const [state, dispatch] = useReducer(modalReducer, initialState);
  const { searchQuery, debouncedQuery, selectedFilter, shouldRender, isAnimating, tabContainerWidth, currentPage } = state;

  const inputRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pagerRef = useRef<PagerView>(null);
  const tabContainerRef = useRef<any>(null);
  
  // Modal'ın önceki açık/kapalı durumunu takip et
  const prevVisibleRef = useRef(false);
  // Modal kapandığında son seçili tab'ı sakla (bir sonraki açılışta kullanılacak)
  const lastSelectedTabRef = useRef<number>(0);

  // 🎯 CORE: Single progress SharedValue (0 = closed, 1 = open) - FilterBarReanimated gibi
  const progress = useSharedValue(0);
  const panY = useSharedValue(0);
  
  // 🎯 CORE: Tab progress value (0 = Users, 1 = Brands, 2 = Products)
  const tabProgress = useSharedValue(0);

  // 🎯 OPTIMIZATION: Tek API çağrısı ile tüm default verileri çek
  // Modal açıkken ve input boşken tüm tipleri tek seferde çek
  const {
    data: allDefaultData,
    isLoading: isAllDefaultLoading,
  } = useSearch(
    {
      keyword: '',
      types: ['user', 'brand', 'product'], // Tüm tipleri tek seferde
      limit: 4,
    },
    debouncedQuery.length === 0 && visible // Modal açıkken ve input boşken aktif
  );

  // 🎯 OPTIMIZATION: Default verileri tab'lara göre ayır (memoized)
  const defaultDataByTab = useMemo(() => {
    if (!allDefaultData) {
      return {
        users: null,
        brands: null,
        products: null,
      };
    }
    return {
      users: allDefaultData.userData || null,
      brands: allDefaultData.brandData || null,
      products: allDefaultData.productData || null,
    };
  }, [allDefaultData]);

  // Loading state'leri tab bazında (memoized)
  const loadingByTab = useMemo(() => {
    return {
      users: isAllDefaultLoading,
      brands: isAllDefaultLoading,
      products: isAllDefaultLoading,
    };
  }, [isAllDefaultLoading]);

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

  // 🎯 OPTIMIZATION: Display data'yı seçili tab'a göre belirle (memoized)
  const displayData = useMemo(() => {
    if (debouncedQuery.length > 0) {
      return searchData;
    }
    // Input boşken, seçili tab'a göre cache'den veri al
    switch (selectedFilter) {
      case 'users':
        return defaultDataByTab.users ? { userData: defaultDataByTab.users } : null;
      case 'brands':
        return defaultDataByTab.brands ? { brandData: defaultDataByTab.brands } : null;
      case 'products':
        return defaultDataByTab.products ? { productData: defaultDataByTab.products } : null;
      default:
        return defaultDataByTab.users ? { userData: defaultDataByTab.users } : null;
    }
  }, [debouncedQuery.length, searchData, selectedFilter, defaultDataByTab]);

  // 🎯 OPTIMIZATION: Loading state'i seçili tab'a göre belirle (memoized)
  const isLoading = useMemo(() => {
    if (debouncedQuery.length > 0) {
      return isSearching;
    }
    return loadingByTab[selectedFilter];
  }, [debouncedQuery.length, isSearching, selectedFilter, loadingByTab]);

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

  // 🎯 OPTIMIZATION: Debounce effect - thread safety için optimize edildi
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce'u artır - search sırasında gesture handler'ı rahatsız etmemek için
    debounceTimerRef.current = setTimeout(() => {
      dispatch({ type: 'SET_DEBOUNCED_QUERY', payload: searchQuery.trim() });
    }, 500); // 500ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Close callback
  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    dispatch({ type: 'RESET_SEARCH' });
    onClose();
  }, [onClose]);

  // Tab press handler - PagerView native animasyonu ile geçiş
  const handleTabPress = useCallback((index: number) => {
    // Tab progress'i güncelle (animasyon için)
    tabProgress.value = withTiming(index, { duration: 200 });
    // PagerView'i güncelle
    pagerRef.current?.setPage(index);
    // Filter'ı da güncelle
    const filters: SearchFilter[] = ['users', 'brands', 'products'];
    dispatch({ type: 'SET_SELECTED_FILTER', payload: filters[index] });
    dispatch({ type: 'SET_CURRENT_PAGE', payload: index });
    // Son seçili tab'ı kaydet
    lastSelectedTabRef.current = index;
  }, [tabProgress]);

  // PagerView scroll handler - realtime progress güncelleme
  const handlePageScroll = useCallback(
    (e: any) => {
      'worklet';
      const { position, offset } = e.nativeEvent;
      tabProgress.value = position + offset;
    },
    [tabProgress]
  );

  // PagerView page selected handler - snap sonrası progress'i sync et
  const handlePageSelected = useCallback(
    (e: any) => {
      const position = e.nativeEvent.position;
      // Tab progress'i güncelle
      tabProgress.value = withTiming(position, { duration: 0 });
      // State'leri güncelle
      dispatch({ type: 'SET_CURRENT_PAGE', payload: position });
      const filterMap: SearchFilter[] = ['users', 'brands', 'products'];
      dispatch({ type: 'SET_SELECTED_FILTER', payload: filterMap[position] });
      // Son seçili tab'ı kaydet
      lastSelectedTabRef.current = position;
    },
    [tabProgress]
  );

  // Tab 1 (Users) label color animation - tabProgress kullan
  const tab1Style = useAnimatedStyle(() => {
    'worklet';
    const activeColor = isDark ? '#FFFFFF' : '#000000';
    const inactiveColor = '#8C8C8C';
    const color = interpolateColor(
      tabProgress.value,
      [0, 1, 2],
      [activeColor, inactiveColor, inactiveColor]
    );
    return { color };
  });

  // Tab 2 (Brands) label color animation - tabProgress kullan
  const tab2Style = useAnimatedStyle(() => {
    'worklet';
    const activeColor = isDark ? '#FFFFFF' : '#000000';
    const inactiveColor = '#8C8C8C';
    const color = interpolateColor(
      tabProgress.value,
      [0, 1, 2],
      [inactiveColor, activeColor, inactiveColor]
    );
    return { color };
  });

  // Tab 3 (Products) label color animation - tabProgress kullan
  const tab3Style = useAnimatedStyle(() => {
    'worklet';
    const activeColor = isDark ? '#FFFFFF' : '#000000';
    const inactiveColor = '#8C8C8C';
    const color = interpolateColor(
      tabProgress.value,
      [0, 1, 2],
      [inactiveColor, inactiveColor, activeColor]
    );
    return { color };
  });

  // Indicator position animation - tabProgress kullan (0=Users, 1=Brands, 2=Products)
  const tabWidth = tabContainerWidth / 3 || 0;
  const indicatorWidth = tabWidth * 0.8; // Tab genişliğinin %80'i
  const indicatorStyle = useAnimatedStyle(() => {
    'worklet';
    // Indicator'ı tab genişliğine göre translate et
    const translateX = tabProgress.value * tabWidth + (tabWidth - indicatorWidth) / 2;
    return {
      transform: [{ translateX }],
    };
  });

  // Focus input callback - worklet dışında tanımla
  // OPTIMIZATION 3: setTimeout kaldırıldı, requestAnimationFrame kullanıldı (100ms kazanç)
  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    });
  }, []);

  // Close callback - worklet dışında tanımla (thread safety için)
  // useEffect'ten önce tanımlanmalı (hoisting sorunu için)
  const closeModal = useCallback(() => {
    handleClose();
    dispatch({ type: 'SET_SHOULD_RENDER', payload: false });
    dispatch({ type: 'SET_IS_ANIMATING', payload: false });
    // Shared value'ları reset et (worklet dışında direkt erişim)
    progress.value = 0;
    panY.value = 0;
    // Modal kapandığında search query'yi temizle ama tab state'ini koru
    dispatch({ type: 'RESET_SEARCH' });
    // lastSelectedTabRef zaten mevcut tab'ı tutuyor, bir sonraki açılışta kullanılacak
  }, [handleClose, progress, panY]);

  // 🎯 PERFORMANCE: Hızlı ve smooth animasyon - callback'siz yaklaşım
  useEffect(() => {
    if (visible) {
      dispatch({ type: 'SET_SHOULD_RENDER', payload: true });
      dispatch({ type: 'SET_IS_ANIMATING', payload: true });
      
      // Reset values immediately
      progress.value = 0;
      panY.value = 0;
      
      // Sadece modal kapalıdan açığa geçtiğinde son seçili tab'ı göster
      // Modal açıkken tab değişikliklerinde mevcut tab'ı koru
      const wasClosed = !prevVisibleRef.current;
      if (wasClosed) {
        // Modal yeni açıldı, son seçili tab'ı göster (veya ilk açılışsa Users)
        const tabToShow = lastSelectedTabRef.current;
        const filters: SearchFilter[] = ['users', 'brands', 'products'];
        
        tabProgress.value = tabToShow;
        dispatch({ type: 'SET_CURRENT_PAGE', payload: tabToShow });
        dispatch({ type: 'SET_SELECTED_FILTER', payload: filters[tabToShow] });
      }
      // Modal açık olduğunu işaretle (her zaman)
      prevVisibleRef.current = true;
      
      // Animasyonu başlat
      const rafId = requestAnimationFrame(() => {
        progress.value = withTiming(1, TIMING_CONFIG);
      });

      // Animasyon bittiğinde state güncelle
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_IS_ANIMATING', payload: false });
        focusInput();
      }, ANIMATION_DURATION);

      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timer);
      };
    } else if (shouldRender) {
      dispatch({ type: 'SET_IS_ANIMATING', payload: true });
      // Modal kapandı, durumu güncelle
      prevVisibleRef.current = false;
      
      // Animasyonu başlat
      progress.value = withTiming(0, TIMING_CONFIG);

      // Animasyon bittiğinde modal'ı temizle
      const timer = setTimeout(() => {
        closeModal();
      }, ANIMATION_DURATION);

      return () => clearTimeout(timer);
    }
  }, [visible, progress, panY, shouldRender, focusInput, closeModal, tabProgress]);

  // Modal açıldığında ve PagerView mount olduktan sonra doğru sayfayı ayarla
  // OPTIMIZATION 3: setTimeout kaldırıldı, requestAnimationFrame kullanıldı (100ms kazanç)
  useEffect(() => {
    if (visible && shouldRender && !isAnimating) {
      // PagerView mount olduktan sonra son seçili tab'a git
      const tabToShow = lastSelectedTabRef.current;
      // requestAnimationFrame ile PagerView'in mount olmasını bekle
      const rafId = requestAnimationFrame(() => {
        if (pagerRef.current) {
          pagerRef.current.setPage(tabToShow);
        }
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [visible, shouldRender, isAnimating]);

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
          // Progress değerini panY'ye göre hesapla (0-1 arası)
          const currentProgress = progress.value;
          const panProgress = panY.value / MODAL_HEIGHT; // Negatif değer, progress'i azaltır
          const totalProgress = Math.max(0, Math.min(1, currentProgress + panProgress));

          // Eğer yeterince yukarı çekildiyse kapat (alttan yukarı çekme)
          if (totalProgress < 0.3 || event.velocityY < -500) {
            // Kapat - animasyonları başlat
            panY.value = 0;
            progress.value = withTiming(0, TIMING_CONFIG);
            // Kapanma işlemini handleClose ile yap
            runOnJS(handleClose)();
          } else {
            // 🎯 PERFORMANCE: Hızlı geri dönüş
            panY.value = withTiming(0, TIMING_CONFIG);
          }
        })
        .enabled(visible && shouldRender && !isAnimating), // Sadece modal açık ve animasyon yokken aktif
    [visible, shouldRender, isAnimating, panY, progress, closeModal]
  );

  // 🎯 PERFORMANCE: FilterBarReanimated gibi worklet'lerde style hesaplamaları
  // Overshoot olmadan doğrudan yerine oturma için smooth interpolation
  const modalAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    // Progress 0-1 arası, translateY -MODAL_HEIGHT ile 0 arası
    // Overshoot olmaması için smooth interpolation
    // StatusBar'ın altında başladığı için translateY hesaplaması aynı kalıyor
    const translateY = interpolate(progress.value, [0, 1], [-MODAL_HEIGHT, 0]);
    const opacity = interpolate(progress.value, [0, 1], [0, 1]);
    return {
      transform: [{ translateY: translateY + panY.value }],
      opacity,
    };
  }, [progress, panY]);

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const opacity = interpolate(progress.value, [0, 1], [0, 0.5]);
    return {
      opacity,
    };
  }, [progress]);

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

  // 🎯 OPTIMIZATION: Memoized loading component
  const LoadingView = useMemo(() => (
    <Box flex={1} justifyContent="center" alignItems="center" py="$20">
      <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
      <Text
        mt="$4"
        fontSize="$xs"
        color={isDark ? '#8E8E93' : '#8E8E93'}
        textAlign="center"
      >
        {debouncedQuery.length > 0 ? 'Aranıyor...' : 'Yükleniyor...'}
      </Text>
    </Box>
  ), [isDark, debouncedQuery.length]);

  // 🎯 OPTIMIZATION: Memoized error component
  const ErrorView = useMemo(() => (
    <Box flex={1} justifyContent="center" alignItems="center" px="$4" py="$20">
      <ExclamationCircleIcon width={48} height={48} color="#CE4A4A" />
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
  ), [isDark]);

  // 🎯 OPTIMIZATION: Memoized empty state component
  const EmptyView = useMemo(() => (
    <Box flex={1} justifyContent="center" alignItems="center" py="$20">
      <MagnifyingGlassIcon width={56} height={56} color={isDark ? '#48484A' : '#D1D1D6'} />
      <Text
        mt="$4"
        fontSize="$sm"
        color={isDark ? '#8E8E93' : '#8E8E93'}
        textAlign="center"
        fontWeight="$medium"
      >
        Sonuç bulunamadı
      </Text>
      {debouncedQuery.length > 0 && (
        <Text
          mt="$2"
          fontSize="$xs"
          color={isDark ? '#8E8E93' : '#8E8E93'}
          textAlign="center"
        >
          "{debouncedQuery}" için arama sonucu yok
        </Text>
      )}
    </Box>
  ), [isDark, debouncedQuery]);

  // 🎯 BASIT YAKLAŞIM: Her tab için ayrı render fonksiyonları
  const renderUsersTab = useCallback(() => {
    // Arama yapıldığında
    if (debouncedQuery.length > 0) {
      if (isSearching) return LoadingView;
      if (searchError) return ErrorView;
      if (searchData?.userData && searchData.userData.length > 0) {
        return (
          <VStack space="sm" flex={1}>
            {searchData.userData.map((user: any) => (
              <UserItem key={user.id} user={user} isDark={isDark} onPress={handleUserPress} />
            ))}
          </VStack>
        );
      }
      return EmptyView;
    }
    // Default veriler
    if (loadingByTab.users) return LoadingView;
    if (defaultDataByTab.users && defaultDataByTab.users.length > 0) {
      return (
        <VStack space="sm" flex={1}>
          {defaultDataByTab.users.map((user: any) => (
            <UserItem key={user.id} user={user} isDark={isDark} onPress={handleUserPress} />
          ))}
        </VStack>
      );
    }
    return null;
  }, [debouncedQuery, isSearching, searchError, searchData, LoadingView, ErrorView, EmptyView, loadingByTab.users, defaultDataByTab.users, isDark, handleUserPress]);

  const renderBrandsTab = useCallback(() => {
    // Arama yapıldığında
    if (debouncedQuery.length > 0) {
      if (isSearching) return LoadingView;
      if (searchError) return ErrorView;
      if (searchData?.brandData && searchData.brandData.length > 0) {
        return (
          <VStack space="sm" flex={1}>
            {searchData.brandData.map((brand: any) => (
              <BrandItem key={brand.id} brand={brand} isDark={isDark} onPress={handleBrandPress} />
            ))}
          </VStack>
        );
      }
      return EmptyView;
    }
    // Default veriler
    if (loadingByTab.brands) return LoadingView;
    if (defaultDataByTab.brands && defaultDataByTab.brands.length > 0) {
      return (
        <VStack space="sm" flex={1}>
          {defaultDataByTab.brands.map((brand: any) => (
            <BrandItem key={brand.id} brand={brand} isDark={isDark} onPress={handleBrandPress} />
          ))}
        </VStack>
      );
    }
    return null;
  }, [debouncedQuery, isSearching, searchError, searchData, LoadingView, ErrorView, EmptyView, loadingByTab.brands, defaultDataByTab.brands, isDark, handleBrandPress]);

  const renderProductsTab = useCallback(() => {
    // Arama yapıldığında
    if (debouncedQuery.length > 0) {
      if (isSearching) return LoadingView;
      if (searchError) return ErrorView;
      if (searchData?.productData && searchData.productData.length > 0) {
        return (
          <VStack space="sm" flex={1}>
            {searchData.productData.map((product: any) => (
              <ProductItem key={product.id} product={product} onPress={handleProductPress} />
            ))}
          </VStack>
        );
      }
      return EmptyView;
    }
    // Default veriler
    if (loadingByTab.products) return LoadingView;
    if (defaultDataByTab.products && defaultDataByTab.products.length > 0) {
      return (
        <VStack space="sm" flex={1}>
          {defaultDataByTab.products.map((product: any) => (
            <ProductItem key={product.id} product={product} onPress={handleProductPress} />
          ))}
        </VStack>
      );
    }
    return null;
  }, [debouncedQuery, isSearching, searchError, searchData, LoadingView, ErrorView, EmptyView, loadingByTab.products, defaultDataByTab.products, handleProductPress]);


  // 🎯 PERFORMANCE: FilterBarReanimated gibi - Modal yerine absolute positioned overlay
  if (!shouldRender && !visible) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
      {/* Overlay Background - FilterBarReanimated gibi */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
          overlayAnimatedStyle,
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <RNPressable
          style={{ flex: 1 }}
          onPress={handleClose}
          pointerEvents="box-only"
        />
      </Animated.View>

      {/* Search Panel - FilterBarReanimated gibi absolute positioned - StatusBar'ın altında */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0, // StatusBar'ın altında başla
            left: 0,
            right: 0,
            height: MODAL_HEIGHT,
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            overflow: 'hidden',
            zIndex: 1001,
            elevation: 10, // Android
          },
          modalAnimatedStyle,
        ]}
        pointerEvents="box-none"
      >
            <VStack flex={1} bg={isDark ? '#000000' : '#FFFFFF'} pointerEvents="auto">
              {/* Header */}
              <VStack space="sm" px="$4" pt={8} pb="$2">
                  {/* Search Bar */}
                  <HStack
                    alignItems="center"
                    bg={isDark ? '#2A2A2A' : '#F2F2F2'}
                    borderRadius={12}
                    px="$3"
                    space="sm"
                    h={48}
                  >
                    <MagnifyingGlassIcon width={20} height={20} color={isDark ? '#8E8E93' : '#8E8E93'} />
                    <Input flex={1} borderWidth={0} bg="transparent">
                      <InputField
                        ref={inputRef}
                        placeholder="Search..."
                        placeholderTextColor={isDark ? '#8E8E93' : '#8E8E93'}
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize="$xs"
                        value={searchQuery}
                        onChangeText={(text) => dispatch({ type: 'SET_SEARCH_QUERY', payload: text })}
                        returnKeyType="search"
                        autoFocus={false}
                      />
                    </Input>
                    {searchQuery.length > 0 && (
                      <Pressable onPress={() => dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })} p="$1">
                        <XCircleIcon width={18} height={18} color={isDark ? '#8E8E93' : '#8E8E93'} />
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
                      dispatch({ type: 'SET_TAB_CONTAINER_WIDTH', payload: width });
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

                {/* PagerView - Native swipe tab switching - BASIT YAKLAŞIM */}
                {/* OPTIMIZATION 4: Lazy Rendering - animasyon bitene kadar ağır component'leri render etme */}
                {!isAnimating ? (
                  <AnimatedPagerView
                    ref={pagerRef}
                    style={{ flex: 1 }}
                    initialPage={lastSelectedTabRef.current}
                    onPageScroll={handlePageScroll}
                    onPageSelected={handlePageSelected}
                    pointerEvents="auto"
                  >
                    {/* Users Tab */}
                    <Box key="users-tab" flex={1}>
                      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
                        {renderUsersTab()}
                      </ScrollView>
                    </Box>

                    {/* Brands Tab */}
                    <Box key="brands-tab" flex={1}>
                      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
                        {renderBrandsTab()}
                      </ScrollView>
                    </Box>

                    {/* Products Tab */}
                    <Box key="products-tab" flex={1}>
                      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
                        {renderProductsTab()}
                      </ScrollView>
                    </Box>
                  </AnimatedPagerView>
                ) : (
                  <Box flex={1} />
                )}

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
      </GestureHandlerRootView>
  );
};

export default SearchModal;
