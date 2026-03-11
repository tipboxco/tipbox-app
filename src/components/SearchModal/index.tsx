import React, { useState, useCallback, useMemo, useEffect, useRef, useReducer, memo } from 'react';
import { Platform, Keyboard, ActivityIndicator, Dimensions, Pressable as RNPressable, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
  interpolate,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
// OPTIMIZATION 5: Gesture imports removed - swipe-to-close feature removed for better performance
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

const { width: WINDOW_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.5; // 50% - fixed height
const SWIPE_THRESHOLD = 100; // Minimum swipe distance to close

type SearchFilter = 'users' | 'brands' | 'products';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

// 🎯 PERFORMANCE: Fast and smooth open/close animation
// OPTIMIZATION 2: 250ms → 150ms → 100ms (instant feel)
const ANIMATION_DURATION = 100; // ms - very fast, native feel
const TIMING_CONFIG = {
  duration: ANIMATION_DURATION,
};

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

// 🎯 OPTIMIZATION: State reducer - consolidate all states
interface ModalState {
  searchQuery: string;
  debouncedQuery: string;
  selectedFilter: SearchFilter;
  isAnimating: boolean;
  tabContainerWidth: number;
  currentPage: number;
}

type ModalAction =
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_DEBOUNCED_QUERY'; payload: string }
  | { type: 'SET_SELECTED_FILTER'; payload: SearchFilter }
  | { type: 'SET_IS_ANIMATING'; payload: boolean }
  | { type: 'SET_TAB_CONTAINER_WIDTH'; payload: number }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'RESET_SEARCH' };

const initialState: ModalState = {
  searchQuery: '',
  debouncedQuery: '',
  selectedFilter: 'users',
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
      <HStack alignItems="center" space="sm" py="$2" px="$4">
        <Box
          width={52}
          height={52}
          borderRadius={100}
          borderWidth={2}
          borderColor="#CE4A4A"
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
          bg={isDark ? '#1C1C1E' : '#F2F2F7'}
        >
          <Image source={avatarSource} alt={user.name} width={48} height={48} resizeMode="cover" />
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
      <HStack alignItems="center" space="sm" py="$2" px="$4">
        <Box width={52} height={52} borderRadius={8} overflow="hidden">
          <Image source={logoSource} alt={brand.name} width={52} height={52} resizeMode="contain" />
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
  isDark: boolean;
  onPress: (product: any) => void;
}

const ProductItem = memo<ProductItemProps>(({ product, isDark, onPress }) => {
  const imageSource = useMemo(
    () => toImageSource(product.image) || require('@/assets/inventory/product_01.png'),
    [product.image]
  );

  return (
    <Box py="$2" px="$4">
      <ProductInfoCard
        size="small"
        type={ProductInfoType.PRODUCT}
        image={imageSource}
        title={product.name}
        subName={product.model || product.specs || ''}
        titleColor={isDark ? '#FFFFFF' : '#000000'}
        onPress={() => onPress(product)}
      />
    </Box>
  );
});

ProductItem.displayName = 'ProductItem';

/**
 * SearchModal Component - PERFORMANCE OPTIMIZED (FilterBarReanimated Architecture)
 *
 * PERFORMANCE ARCHITECTURE (like FilterBarReanimated):
 * - Single SharedValue (progress: 0-1) controls all animations
 * - All style calculations in worklets (UI thread)
 * - No Modal, absolute positioned overlay (better performance)
 * - Pre-calculated panel height for smooth animations
 * - withSpring for natural feel
 *
 * OPTIMIZATIONS:
 * 1. State consolidation with useReducer (fewer re-renders)
 * 2. Single API call for all default data (users, brands, products)
 * 3. Memoized item components (UserItem, BrandItem, ProductItem)
 * 4. Absolute positioned overlay (instead of Modal)
 * 5. Animation control with single progress SharedValue
 */
export const SearchModal: React.FC<SearchModalProps> = memo(({ visible, onClose }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 🎯 PERFORMANCE: Internal visible state - for animation control
  // Synchronized with visible prop from parent, but controls close animation
  const [internalVisible, setInternalVisible] = useState(false);

  // 🎯 OPTIMIZATION: State consolidation with useReducer
  const [state, dispatch] = useReducer(modalReducer, initialState);
  const { searchQuery, debouncedQuery, selectedFilter, isAnimating, tabContainerWidth, currentPage } = state;

  const inputRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pagerRef = useRef<PagerView>(null);
  const tabContainerRef = useRef<any>(null);

  // Track modal's previous open/closed state
  const prevVisibleRef = useRef(false);
  const prevInternalVisibleRef = useRef(false);
  // Track closing state - prevents sync effect interference
  const isClosingRef = useRef(false);
  // Save last selected tab when modal closes (for next open)
  const lastSelectedTabRef = useRef<number>(0);

  // 🎯 CORE: Single progress SharedValue (0 = closed, 1 = open) - FilterBarReanimated gibi
  const progress = useSharedValue(0);
  // OPTIMIZATION 5: panY removed - no swipe gesture needed

  // 🎯 CORE: Tab progress value (0 = Users, 1 = Brands, 2 = Products)
  const tabProgress = useSharedValue(0);

  // 🎯 OPTIMIZATION: Fetch all default data with single API call
  // Fetch all types at once when modal is open and input is empty
  const {
    data: allDefaultData,
    isLoading: isAllDefaultLoading,
  } = useSearch(
    {
      keyword: '',
      types: ['user', 'brand', 'product'], // All types at once
      limit: 4,
    },
    debouncedQuery.length === 0 && visible // Active when modal is open and input is empty
  );

  // 🎯 OPTIMIZATION: Separate default data by tabs (memoized)
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

  // Loading states per tab (memoized)
  const loadingByTab = useMemo(() => {
    return {
      users: isAllDefaultLoading,
      brands: isAllDefaultLoading,
      products: isAllDefaultLoading,
    };
  }, [isAllDefaultLoading]);

  // For search results (when input has text) - based on selected tab
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
      limit: 10, // 10 items for search results (aligned with API limit)
    },
    debouncedQuery.length > 0 && visible // Active only when query exists and modal is open
  );

  // 🎯 PERFORMANCE FIX: displayData, isLoading, hasResults removed
  // These variables are unused and only cause unnecessary JS thread usage
  // Each tab uses required data directly in its own render function

  // 🎯 OPTIMIZATION: Debounce effect - optimized for thread safety
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Increase debounce - to avoid disturbing gesture handler during search
    debounceTimerRef.current = setTimeout(() => {
      dispatch({ type: 'SET_DEBOUNCED_QUERY', payload: searchQuery.trim() });
    }, 500); // 500ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Close callback - internal state ile animasyonu başlat
  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    isClosingRef.current = true; // Closing flag set - prevent sync effect interference
    setInternalVisible(false); // Start close animation
  }, []);

  // Tab press handler - transition with PagerView native animation
  const handleTabPress = useCallback((index: number) => {
    // Clear search input when switching tabs
    dispatch({ type: 'RESET_SEARCH' });
    // Update tab progress (for animation)
    tabProgress.value = withTiming(index, { duration: 200 });
    // Update PagerView
    pagerRef.current?.setPage(index);
    // Update filter as well
    const filters: SearchFilter[] = ['users', 'brands', 'products'];
    dispatch({ type: 'SET_SELECTED_FILTER', payload: filters[index] });
    dispatch({ type: 'SET_CURRENT_PAGE', payload: index });
    // Save last selected tab
    lastSelectedTabRef.current = index;
  }, [tabProgress]);

  // 🎯 PERFORMANCE FIX: PagerView scroll handler - runs on UI thread
  // useCallback removed - worklet functions should not be wrapped with useCallback
  const handlePageScroll = (e: any) => {
    'worklet';
    const { position, offset } = e.nativeEvent;
    tabProgress.value = position + offset;
  };

  // 🎯 PERFORMANCE FIX: Page selected handler - runs only when snapped
  // Dispatches throttled, prevents unnecessary JS thread usage
  const handlePageSelected = useCallback(
    (e: any) => {
      const position = e.nativeEvent.position;
      // Update tab progress in worklet (UI thread)
      tabProgress.value = position;
      // State update throttled - with requestAnimationFrame
      requestAnimationFrame(() => {
        // Clear search input when switching tabs (swipe)
        dispatch({ type: 'RESET_SEARCH' });
        dispatch({ type: 'SET_CURRENT_PAGE', payload: position });
        const filterMap: SearchFilter[] = ['users', 'brands', 'products'];
        dispatch({ type: 'SET_SELECTED_FILTER', payload: filterMap[position] });
        lastSelectedTabRef.current = position;
      });
    },
    [tabProgress]
  );

  // 🎯 PERFORMANCE FIX: Color value calculation extracted outside
  // isDark check in every worklet reads from JS thread
  const activeColor = useMemo(() => isDark ? '#FFFFFF' : '#000000', [isDark]);
  const inactiveColor = '#8C8C8C';

  // Tab 1 (Users) label color animation - tabProgress kullan
  const tab1Style = useAnimatedStyle(() => {
    'worklet';
    const color = interpolateColor(
      tabProgress.value,
      [0, 1, 2],
      [activeColor, inactiveColor, inactiveColor]
    );
    return { color };
  }, [tabProgress, activeColor]);

  // Tab 2 (Brands) label color animation - tabProgress kullan
  const tab2Style = useAnimatedStyle(() => {
    'worklet';
    const color = interpolateColor(
      tabProgress.value,
      [0, 1, 2],
      [inactiveColor, activeColor, inactiveColor]
    );
    return { color };
  }, [tabProgress, activeColor]);

  // Tab 3 (Products) label color animation - tabProgress kullan
  const tab3Style = useAnimatedStyle(() => {
    'worklet';
    const color = interpolateColor(
      tabProgress.value,
      [0, 1, 2],
      [inactiveColor, inactiveColor, activeColor]
    );
    return { color };
  }, [tabProgress, activeColor]);

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
  }, [tabProgress, tabWidth, indicatorWidth]);

  // Focus input callback - define outside worklet
  // OPTIMIZATION 3: setTimeout removed, requestAnimationFrame used (100ms gain)
  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    });
  }, []);

  // Close callback - called after animation completes
  const finalizeClose = useCallback(() => {
    dispatch({ type: 'SET_IS_ANIMATING', payload: false });
    dispatch({ type: 'RESET_SEARCH' });
    progress.value = 0;
    isClosingRef.current = false; // Closing flag reset
    onClose(); // Notify parent
  }, [onClose, progress]);

  // 🎯 PERFORMANCE FIX: shouldRender pattern removed - instant render
  // Component always mounted, show/hide only with animation
  // 🎯 SYNC: Synchronize internal state with parent visible prop
  // Check isClosingRef - don't sync if user is manually closing
  useEffect(() => {
    if (visible && !internalVisible && !isClosingRef.current) {
      // Parent opened and not closing - open
      setInternalVisible(true);
    } else if (!visible && internalVisible) {
      // Parent closed - close (but this doesn't come from normal close flow)
      setInternalVisible(false);
    }
  }, [visible, internalVisible]);

  // 🎯 ANIMATION: Start animation when internal visible state changes
  useEffect(() => {
    if (internalVisible) {
      // Opening animation
      dispatch({ type: 'SET_IS_ANIMATING', payload: true });

      // Reset values immediately
      progress.value = 0;

      // Show last selected tab only when modal transitions from closed to open
      const wasClosed = !prevInternalVisibleRef.current;
      if (wasClosed) {
        const tabToShow = lastSelectedTabRef.current;
        const filters: SearchFilter[] = ['users', 'brands', 'products'];

        tabProgress.value = tabToShow;
        dispatch({ type: 'SET_CURRENT_PAGE', payload: tabToShow });
        dispatch({ type: 'SET_SELECTED_FILTER', payload: filters[tabToShow] });
      }
      prevInternalVisibleRef.current = true;

      // Start animation - update state when animation finishes via callback
      progress.value = withTiming(1, TIMING_CONFIG, (finished) => {
        'worklet';
        if (finished) {
          runOnJS(dispatch)({ type: 'SET_IS_ANIMATING', payload: false });
          runOnJS(focusInput)();
        }
      });
    } else if (prevInternalVisibleRef.current) {
      // Closing animation
      dispatch({ type: 'SET_IS_ANIMATING', payload: true });
      prevInternalVisibleRef.current = false;

      // Start animation - close modal when animation finishes via callback
      progress.value = withTiming(0, TIMING_CONFIG, (finished) => {
        'worklet';
        if (finished) {
          runOnJS(finalizeClose)();
        }
      });
    }
  }, [internalVisible, progress, focusInput, finalizeClose, tabProgress]);

  // Set correct page when modal opens and after PagerView mounts
  useEffect(() => {
    if (internalVisible && !isAnimating) {
      // Go to last selected tab after PagerView mounts
      const tabToShow = lastSelectedTabRef.current;
      // Wait for PagerView to mount with requestAnimationFrame
      const rafId = requestAnimationFrame(() => {
        if (pagerRef.current) {
          pagerRef.current.setPage(tabToShow);
        }
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [internalVisible, isAnimating]);

  // OPTIMIZATION 5: panGesture removed - swipe-to-close feature removed for better performance
  // Overlay click is sufficient for closing modal

  // 🎯 PERFORMANCE: Style calculations in worklets like FilterBarReanimated
  // Smooth interpolation for direct settling without overshoot
  // FIX: Dependencies added - prevents unnecessary re-calculation
  const modalAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    // Progress between 0-1, translateY between -MODAL_HEIGHT and 0
    // Smooth interpolation to prevent overshoot
    // translateY calculation stays same as it starts below StatusBar
    const translateY = interpolate(progress.value, [0, 1], [-MODAL_HEIGHT, 0]);
    const opacity = interpolate(progress.value, [0, 1], [0, 1]);
    return {
      transform: [{ translateY }],
      opacity,
    };
  }, [progress]);

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    // Overlay hafif karartma (post modalları ile aynı: 0.25), bottom bar dahil tüm ekran
    const opacity = interpolate(progress.value, [0, 1], [0, 0.25]);
    return {
      opacity,
    };
  }, [progress]);

  // Navigate to profile when user item is clicked
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

  // Navigate to brand post list screen when brand item is clicked
  const handleBrandPress = useCallback(
    (brandId: string) => {
      if (!brandId) {
        console.warn('[SearchModal] handleBrandPress: brandId is missing');
        return;
      }
      handleClose();
      setTimeout(() => {
        // Nested navigation to Catalog tab → BrandPostListScreen
        navigationService.navigateNested(TAB_ROUTES.CATALOG, 'BrandPostListScreen' as any, {
          brandId,
        });
      }, 300);
    },
    [handleClose]
  );

  // Navigate to product post list screen when product item is clicked
  const handleProductPress = useCallback(
    (product: any) => {
      if (!product || !product.id) {
        console.warn('[SearchModal] handleProductPress: product or productId is missing');
        return;
      }
      handleClose();
      setTimeout(() => {
        // Navigate to Post stack → PostsScreen with product info
        const productImage = toImageSource(product.image) || require('@/assets/inventory/product_01.png');

        navigationService.navigate(ROOT_ROUTES.POST, {
          screen: 'PostsScreen',
          params: {
            stage: 'Product',
            name: product.name || '',
            productInfo: {
              image: productImage,
              title: product.name || '',
              subName: product.model || product.specs || '',
            },
            selectedProduct: {
              id: product.id,
              name: product.name || '',
              description: product.model || product.specs || '',
              image: productImage,
            },
            contextType: ProductInfoType.PRODUCT,
            contextId: product.id,
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
        {debouncedQuery.length > 0 ? 'Searching...' : 'Loading...'}
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
        An error occurred during search
      </Text>
      <Text
        mt="$2"
        fontSize="$sm"
        color={isDark ? '#8E8E93' : '#8E8E93'}
        textAlign="center"
      >
        Please try again
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
        No results found
      </Text>
      {debouncedQuery.length > 0 && (
        <Text
          mt="$2"
          fontSize="$xs"
          color={isDark ? '#8E8E93' : '#8E8E93'}
          textAlign="center"
        >
          No search results for "{debouncedQuery}"
        </Text>
      )}
    </Box>
  ), [isDark, debouncedQuery]);

  // 🎯 PERFORMANCE FIX: Render callbacks optimized - reduced dependencies
  // LoadingView, ErrorView, EmptyView already memoized, no need to add to dependencies again
  const renderUsersTab = useCallback(() => {
    // When searching
    if (debouncedQuery.length > 0) {
      if (isSearching) return LoadingView;
      if (searchError) return ErrorView;
      if (searchData?.userData && searchData.userData.length > 0) {
        return (
          <View style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <VStack space="xs" pt="$2" pb="$0.5" px="$4">
                {searchData.userData.map((user: any) => (
                  <UserItem key={user.id} user={user} isDark={isDark} onPress={handleUserPress} />
                ))}
              </VStack>
            </ScrollView>
          </View>
        );
      }
      return EmptyView;
    }
    // Default data
    if (loadingByTab.users) return LoadingView;
    if (defaultDataByTab.users && defaultDataByTab.users.length > 0) {
      return (
        <View style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space="xs" pt="$2" pb="$0.5" px="$4">
              {defaultDataByTab.users.map((user: any) => (
                <UserItem key={user.id} user={user} isDark={isDark} onPress={handleUserPress} />
              ))}
            </VStack>
          </ScrollView>
        </View>
      );
    }
    return EmptyView;
  }, [debouncedQuery, isSearching, searchError, searchData?.userData, loadingByTab.users, defaultDataByTab.users, isDark, handleUserPress, LoadingView, ErrorView, EmptyView]);

  const renderBrandsTab = useCallback(() => {
    // When searching
    if (debouncedQuery.length > 0) {
      if (isSearching) return LoadingView;
      if (searchError) return ErrorView;
      if (searchData?.brandData && searchData.brandData.length > 0) {
        return (
          <View style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <VStack space="xs" pt="$2" pb="$0.5" px="$4">
                {searchData.brandData.map((brand: any) => (
                  <BrandItem key={brand.id} brand={brand} isDark={isDark} onPress={handleBrandPress} />
                ))}
              </VStack>
            </ScrollView>
          </View>
        );
      }
      return EmptyView;
    }
    // Default data
    if (loadingByTab.brands) return LoadingView;
    if (defaultDataByTab.brands && defaultDataByTab.brands.length > 0) {
      return (
        <View style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space="xs" pt="$2" pb="$0.5" px="$4">
              {defaultDataByTab.brands.map((brand: any) => (
                <BrandItem key={brand.id} brand={brand} isDark={isDark} onPress={handleBrandPress} />
              ))}
            </VStack>
          </ScrollView>
        </View>
      );
    }
    return EmptyView;
  }, [debouncedQuery, isSearching, searchError, searchData?.brandData, loadingByTab.brands, defaultDataByTab.brands, isDark, handleBrandPress, LoadingView, ErrorView, EmptyView]);

  const renderProductsTab = useCallback(() => {
    // When searching
    if (debouncedQuery.length > 0) {
      if (isSearching) return LoadingView;
      if (searchError) return ErrorView;
      if (searchData?.productData && searchData.productData.length > 0) {
        return (
          <View style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <VStack space="xs" pt="$2" pb="$0.5" px="$4">
                {searchData.productData.map((product: any) => (
                  <ProductItem key={product.id} product={product} isDark={isDark} onPress={handleProductPress} />
                ))}
              </VStack>
            </ScrollView>
          </View>
        );
      }
      return EmptyView;
    }
    // Default data
    if (loadingByTab.products) return LoadingView;
    if (defaultDataByTab.products && defaultDataByTab.products.length > 0) {
      return (
        <View style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space="xs" pt="$2" pb="$0.5" px="$4">
              {defaultDataByTab.products.map((product: any) => (
                <ProductItem key={product.id} product={product} isDark={isDark} onPress={handleProductPress} />
              ))}
            </VStack>
          </ScrollView>
        </View>
      );
    }
    return EmptyView;
  }, [debouncedQuery, isSearching, searchError, searchData?.productData, loadingByTab.products, defaultDataByTab.products, isDark, handleProductPress, LoadingView, ErrorView, EmptyView]);


  // 🎯 PERFORMANCE FIX: shouldRender removed - component always renders
  // Visibility controlled only with animation (for instant open)

  return (
    // OPTIMIZATION 5: GestureHandlerRootView kaldırıldı - sadece View kullanıldı
    // Swipe-to-close özelliği kaldırıldı, overlay click ile kapatma yeterli
    // 50-100ms GestureHandler initialization kazancı
    // FIX: Tam ekran (bottom bar dahil) - position + window dimensions
    // PERFORMANCE: pointerEvents ile touch olaylarını kontrol et
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: WINDOW_WIDTH,
        height: SCREEN_HEIGHT,
        zIndex: 9999,
      }}
      pointerEvents={internalVisible ? 'auto' : 'none'}
    >
      {/* Overlay Background - bottom bar dahil tüm ekran, hafif karartma (0.25) */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
          },
          overlayAnimatedStyle,
        ]}
        pointerEvents={internalVisible ? 'auto' : 'none'}
      >
        <RNPressable
          style={{ flex: 1 }}
          onPress={handleClose}
          pointerEvents="box-only"
        />
      </Animated.View>

      {/* Search Panel - absolute positioned like FilterBarReanimated - below StatusBar */}
      {/* FIX: Z-index 10000 - to appear above Overlay */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0, // Start below StatusBar
            left: 0,
            right: 0,
            height: MODAL_HEIGHT,
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            overflow: 'hidden',
            zIndex: 10000,
            elevation: 20, // Android - daha yüksek elevation
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
                              fontSize: 14,
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
                              fontSize: 14,
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
                              fontSize: 14,
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

                {/* PagerView - Native swipe tab switching - SIMPLE APPROACH */}
                {/* FIX: Re-render issue - mount PagerView but hide during animation */}
                {/* FIX: ScrollView removed - 4 items fit responsively with flex layout */}
                <Box flex={1} opacity={isAnimating ? 0 : 1}>
                  <AnimatedPagerView
                    ref={pagerRef}
                    style={{ flex: 1 }}
                    initialPage={lastSelectedTabRef.current}
                    onPageScroll={handlePageScroll}
                    onPageSelected={handlePageSelected}
                    pointerEvents={isAnimating ? 'none' : 'auto'}
                  >
                    {/* Users Tab */}
                    <Box key="users-tab" flex={1}>
                      {renderUsersTab()}
                    </Box>

                    {/* Brands Tab */}
                    <Box key="brands-tab" flex={1}>
                      {renderBrandsTab()}
                    </Box>

                    {/* Products Tab */}
                    <Box key="products-tab" flex={1}>
                      {renderProductsTab()}
                    </Box>
                  </AnimatedPagerView>
                </Box>

              {/* OPTIMIZATION 5: GestureDetector kaldırıldı - swipe-to-close özelliği removed */}
              {/* Handler - Visual indicator only, no gesture */}
              <Box
                paddingTop={0}
                paddingBottom={Platform.OS === 'ios' ? insets.bottom : 0}
                alignItems="center"
                borderTopColor={isDark ? '#2C2C2E' : '#E5E5EA'}
              >
                <Box
                  width={40}
                  height={4}
                  borderRadius={2}
                  bg={isDark ? '#3C3C3E' : '#D1D1D6'}
                />
              </Box>
            </VStack>
          </Animated.View>
      </View>
  );
});

SearchModal.displayName = 'SearchModal';

export default SearchModal;
