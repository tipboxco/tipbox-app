import React, { useState, useRef, useCallback, useEffect, useReducer } from 'react';
import { Platform, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Pressable, Image, HStack, Input, InputField } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '@/src/components/Header';
import { mock_user_profile } from '@/src/mock/common';
import { Category } from '@/src/mock/catalog/productCatalog/types';
import { ProductCatalogScreen } from './ProductCatalogScreen';
import { BrandScreen } from './BrandScreen';
import { Search } from 'lucide-react-native';
import { CreatePostBottomSheet } from '@/src/components/CreatePostBottomSheet';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { CatalogStackParamList } from '../navigation';
import { RootStackParamList } from '@/src/navigation/navigation.types';
import { ProductInfoType } from '@/src/types/common';
import { useCreatePostFlowStore } from '@/src/features/post/store/createPostFlowStore';
import { useCatalogUIStore } from '../store/catalogUIStore';
import { useBottomOffset } from '@/src/utils';

type CatalogScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList & RootStackParamList> & {
  navigate: (name: any, params?: any) => void;
};

type CatalogScreenRouteProp = RouteProp<CatalogStackParamList, 'CatalogScreen'>;

// PERFORMANCE FIX: CatalogScreen state management refactoring
// Consolidate related state into reducer pattern to reduce re-renders and improve maintainability
interface CatalogScreenState {
  currentMode: 'product' | 'brand-catalog' | 'brand-selection';
  selectedCategory: Category | null;
  selectedProductLocal: any | null;
  breadcrumbItems: any[];
}

type CatalogScreenAction =
  | { type: 'SET_CURRENT_MODE'; payload: 'product' | 'brand-catalog' | 'brand-selection' }
  | { type: 'SET_SELECTED_CATEGORY'; payload: Category | null }
  | { type: 'SET_SELECTED_PRODUCT_LOCAL'; payload: any | null }
  | { type: 'SET_BREADCRUMB_ITEMS'; payload: any[] }
  | { type: 'RESET_PRODUCT_STATE' };

const catalogScreenReducer = (state: CatalogScreenState, action: CatalogScreenAction): CatalogScreenState => {
  switch (action.type) {
    case 'SET_CURRENT_MODE':
      return { ...state, currentMode: action.payload };
    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.payload };
    case 'SET_SELECTED_PRODUCT_LOCAL':
      return { ...state, selectedProductLocal: action.payload };
    case 'SET_BREADCRUMB_ITEMS':
      return { ...state, breadcrumbItems: action.payload };
    case 'RESET_PRODUCT_STATE':
      return { ...state, selectedProductLocal: null, breadcrumbItems: [] };
    default:
      return state;
  }
};

const initialState: CatalogScreenState = {
  currentMode: 'product',
  selectedCategory: null,
  selectedProductLocal: null,
  breadcrumbItems: [],
};

const CatalogScreenComponent = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CatalogScreenNavigationProp>();
  const route = useRoute<CatalogScreenRouteProp>();
  const insets = useSafeAreaInsets();
  
  // Get initial mode from route params
  const initialMode = route.params?.view === 'brands' ? 'brand-catalog' : 'product';
  
  // PERFORMANCE FIX: Use reducer for related state management
  const [catalogState, dispatch] = useReducer(catalogScreenReducer, {
    ...initialState,
    currentMode: initialMode,
  });
  const { currentMode, selectedCategory, selectedProductLocal, breadcrumbItems } = catalogState;
  
  // Update mode when route params change (not when currentMode changes)
  const routeView = route.params?.view;
  useEffect(() => {
    const newMode = routeView === 'brands' ? 'brand-catalog' : 'product';
    // Only update if route params actually changed the mode requirement
    if ((routeView === 'brands' && currentMode !== 'brand-catalog') || 
        (routeView !== 'brands' && currentMode === 'brand-catalog')) {
      dispatch({ type: 'SET_CURRENT_MODE', payload: newMode });
    }
  }, [routeView]); // Only depend on route params, not currentMode
  
  // UI-specific state (keep as useState for simplicity)
  const [searchQuery, setSearchQuery] = useState('');
  const [headerHeight, setHeaderHeight] = useState(40); // Default header height
  const [bottomSheetKey, setBottomSheetKey] = useState(0);
  
  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  
  // Bottom offset for bottom sheet padding
  const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 8 });
  
  // Create Post Flow Store
  const setFlowContext = useCreatePostFlowStore((state) => state.setFlowContext);
  
  // Catalog UI Store
  const selectedProductId = useCatalogUIStore((state) => state.selectedProductId);
  const selectedSubCategoryId = useCatalogUIStore((state) => state.selectedSubCategoryId);
  const selectedProductGroupId = useCatalogUIStore((state) => state.selectedProductGroupId);
  const currentView = useCatalogUIStore((state) => state.currentView);
  const setSelectedProduct = useCatalogUIStore((state) => state.setSelectedProduct);
  const setSelectedSubCategory = useCatalogUIStore((state) => state.setSelectedSubCategory);
  const setSelectedProductGroup = useCatalogUIStore((state) => state.setSelectedProductGroup);
  const setCurrentView = useCatalogUIStore((state) => state.setCurrentView);
  
  // Scroll animasyonu için Animated.Value
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Brand isminin pozisyonu (Header Info Box yüksekliği yaklaşık 80-100px)
  const BRAND_TITLE_THRESHOLD = 80;

  const handleBrandCategorySelection = (category: Category) => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category });
    // Brand catalog modunda kal, sadece seçilen kategoriyi güncelle
    // Kullanıcı floating button ile brand-selection moduna geçebilir
  };

  const handleCreatePost = useCallback(() => {
    console.log('Create a Post pressed');
    // Reset bottom sheet key to remount component and reset view
    setBottomSheetKey(prev => prev + 1);
    
    // Determine stage for bottom sheet
    // Priority: Product > ProductGroup > SubCategory
    let stageForBottomSheet: 'subcategories' | 'productgroups' | 'products' | undefined;
    if (currentView === 'categories') {
      stageForBottomSheet = undefined;
    } else if (selectedProductId && currentView === 'products') {
      // Product seçilmişse products stage'i
      stageForBottomSheet = 'products';
    } else if (selectedProductGroupId && (currentView === 'products' || currentView === 'productgroups')) {
      // ProductGroup seçilmiş ama Product seçilmemişse productgroups stage'i (subcategories ile aynı seçenekler)
      stageForBottomSheet = 'subcategories';
    } else if (currentView === 'subcategories') {
      // SubCategory seçilmişse subcategories stage'i
      stageForBottomSheet = 'subcategories';
    } else if (currentView === 'productgroups') {
      // ProductGroups view'deyse subcategories stage'i (aynı seçenekler)
      stageForBottomSheet = 'subcategories';
    } else {
      // Fallback
      stageForBottomSheet = currentView as 'subcategories' | 'products';
    }
    
    openBottomSheet(
      <CreatePostBottomSheet
        key={bottomSheetKey + 1}
        onClose={closeBottomSheet}
        onPostTypeSelect={handlePostTypeSelect}
        onViewChange={handleViewChange}
        stage={stageForBottomSheet}
        selectedProduct={selectedProductLocal ? {
          id: selectedProductLocal.id,
          name: selectedProductLocal.name,
          subName: selectedProductLocal.description || undefined,
          image: selectedProductLocal.image,
          hasDiscount: false,
        } : undefined}
      />,
      {
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        enableDynamicSizing: true,
        animateOnMount: false, // PERFORMANCE FIX: Disabled for instant opening
        paddingBottom: bottomOffset,
        handleIndicatorStyle: {
          backgroundColor: isDark ? '#333333' : '#B8B8B7',
          width: 70,
          height: 5,
        },
        onChange: (index: number) => {
    // Reset bottom sheet key when sheet closes to reset view state
    if (index === -1) {
      setBottomSheetKey(prev => prev + 1);
    }
        },
      }
    );
  }, [openBottomSheet, closeBottomSheet, bottomSheetKey, currentView, selectedProductLocal, isDark]);

  const handlePostTypeSelect = useCallback((type: string, experienceOption?: 'own' | 'tried') => {
    console.log('Post type selected:', type, 'experienceOption:', experienceOption);
    
    // Close bottom sheet first
    closeBottomSheet();
    
    // Navigate to appropriate screen based on post type
    if (type === 'free') {
      // Debug: Store durumunu logla
      console.log('🔍 [CatalogScreen] Store State:', {
        selectedProductId,
        selectedSubCategoryId,
        selectedProductGroupId,
        currentView,
        selectedProductLocal: selectedProductLocal ? { id: selectedProductLocal.id, name: selectedProductLocal.name } : null,
      });
      
      // Determine contextType and contextId based on current selection
      // Priority: Product > ProductGroup > SubCategory
      let determinedContextType: ProductInfoType | undefined;
      let determinedContextId: string | undefined;
      let productInfoSnapshot: { image: any; title: string; subName?: string } | undefined;
      
      // Determine context based on current view and selection (from store)
      // Priority order: Product > ProductGroup > SubCategory
      if (selectedProductId && currentView === 'products') {
        // Product selected
        determinedContextType = ProductInfoType.PRODUCT;
        determinedContextId = selectedProductId;
        // Get product info from local state if available
        if (selectedProductLocal) {
          productInfoSnapshot = {
            image: selectedProductLocal.image,
            title: selectedProductLocal.name,
            subName: selectedProductLocal.description,
          };
        }
        console.log('✅ [CatalogScreen] Context determined: PRODUCT', { determinedContextId });
      } else if (selectedProductGroupId && currentView === 'productgroups') {
        // ProductGroup selected
        determinedContextType = ProductInfoType.PRODUCT_GROUP;
        determinedContextId = selectedProductGroupId;
        // TODO: Get productGroup info from API if needed for snapshot
        console.log('✅ [CatalogScreen] Context determined: PRODUCT_GROUP', { determinedContextId });
      } else if (selectedSubCategoryId) {
        // SubCategory selected - Check if SubCategory is selected (currentView can be 'subcategories' or 'productgroups')
        // If we're in productgroups view but have a selectedSubCategoryId, it means SubCategory was selected
        determinedContextType = ProductInfoType.SUB_CATEGORY;
        determinedContextId = selectedSubCategoryId;
        // TODO: Get subCategory info from API if needed for snapshot
        console.log('✅ [CatalogScreen] Context determined: SUB_CATEGORY', { determinedContextId, currentView });
      }
      
      // Save to flow store if context is available
      if (determinedContextType && determinedContextId) {
        console.log('💾 [CatalogScreen] Saving to flow store:', {
          contextType: determinedContextType,
          contextId: determinedContextId,
          hasSnapshot: !!productInfoSnapshot,
        });
        setFlowContext(determinedContextType, determinedContextId, productInfoSnapshot);
      } else {
        console.error('❌ [CatalogScreen] Cannot determine context:', {
          selectedProductId,
          selectedSubCategoryId,
          selectedProductGroupId,
          currentView,
        });
      }
      
      navigation.navigate('Post', {
        screen: 'CreatePostScreen',
      });
    } else if (type === 'tips') {
      navigation.navigate('Post', {
        screen: 'CreateTipsAndTrickPostScreen',
      });
    } else if (type === 'question') {
      navigation.navigate('Post', {
        screen: 'CreateQuestionPostScreen',
      });
    } else if (type === 'experience') {
      navigation.navigate('Post', {
        screen: 'CreateExperiencePostScreen',
        params: {
          product: selectedProductLocal ? {
            id: selectedProductLocal.id,
            name: selectedProductLocal.name,
            description: selectedProductLocal.description,
            image: selectedProductLocal.image,
            brand: selectedProductLocal.brand,
          } : undefined,
          fromInventory: experienceOption === 'own',
          experienceOption: experienceOption,
        },
      });
    } else if (type === 'comparison') {
      navigation.navigate('Post', {
        screen: 'CreateBenchmarkPostScreen',
        params: {
          product: selectedProductLocal ? {
            id: selectedProductLocal.id,
            name: selectedProductLocal.name,
            description: selectedProductLocal.description,
            image: selectedProductLocal.image,
          } : undefined,
        },
      });
    } else if (type === 'update') {
      navigation.navigate('Post', {
        screen: 'CreateUpdatePostScreen',
        params: {
          product: selectedProductLocal ? {
            id: selectedProductLocal.id,
            name: selectedProductLocal.name,
            description: selectedProductLocal.description,
            image: selectedProductLocal.image,
            brand: selectedProductLocal.brand,
          } : undefined,
        },
      });
    }
  }, [navigation, selectedProductLocal, closeBottomSheet, setFlowContext, currentView, selectedSubCategoryId, selectedProductGroupId, selectedProductId]);

  const handleViewChange = useCallback((view: 'options' | 'experience' | 'product-selection') => {
    console.log('BottomSheet view changed:', view);
    // View change is handled internally by CreatePostBottomSheet
  }, []);

  const handleFloatingButtonPress = () => {
    if (currentMode === 'brand-selection') {
      // Brand selection modundan brand catalog moduna geri dön
      dispatch({ type: 'SET_CURRENT_MODE', payload: 'brand-catalog' });
    } else if (currentMode === 'brand-catalog') {
      // Brand catalog modundan normal moda geri dön
      dispatch({ type: 'SET_CURRENT_MODE', payload: 'product' });
      dispatch({ type: 'SET_SELECTED_CATEGORY', payload: null });
      // Scroll pozisyonunu sıfırla
      scrollY.setValue(0);
    } else {
      // Normal moddan brand catalog moduna geç
      dispatch({ type: 'SET_CURRENT_MODE', payload: 'brand-catalog' });
      // Scroll pozisyonunu sıfırla
      scrollY.setValue(0);
    }
  };

  const getTitle = () => {
    switch (currentMode) {
      case 'brand-catalog':
        return 'Brand Catalog';
      case 'brand-selection':
        return 'Brand Catalog';
      default:
        return 'Product Catalog';
    }
  };

  const handleProductCatalogStateChange = useCallback((data: {
    selectedProduct: any | null;
    currentView: 'categories' | 'subcategories' | 'productgroups' | 'products';
    selectedSubCategoryId?: string;
    selectedProductGroupId?: string;
    breadcrumbItems: any[];
  }) => {
    // Update local state for product object (for UI display)
    dispatch({ type: 'SET_SELECTED_PRODUCT_LOCAL', payload: data.selectedProduct });
    
    // Update store with IDs
    setSelectedProduct(data.selectedProduct?.id);
    setCurrentView(data.currentView);
    setSelectedSubCategory(data.selectedSubCategoryId);
    setSelectedProductGroup(data.selectedProductGroupId);
    dispatch({ type: 'SET_BREADCRUMB_ITEMS', payload: data.breadcrumbItems });
  }, [setSelectedProduct, setCurrentView, setSelectedSubCategory, setSelectedProductGroup]);

  // PERFORMANCE FIX: Throttle scroll handler to reduce JS thread pressure
  // Throttle to ~60fps (16ms) to prevent excessive Animated.Value updates
  const lastScrollUpdateRef = useRef<number>(0);
  const THROTTLE_MS = 16; // ~60fps
  
  const handleBrandScroll = useCallback((event: any) => {
    const now = Date.now();
    if (now - lastScrollUpdateRef.current < THROTTLE_MS) {
      return; // Skip this update
    }
    lastScrollUpdateRef.current = now;
    
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.setValue(offsetY);
  }, [scrollY]);

  // Header opacity animasyonu: Brand ismini geçtikten sonra (80px'de başlar, 120px'de tamamen görünür)
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, BRAND_TITLE_THRESHOLD, BRAND_TITLE_THRESHOLD + 40],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const renderContent = () => {
    const paddingBottom = headerHeight + 12;
    switch (currentMode) {
      case 'brand-catalog':
        return (
          <BrandScreen
            selectedCategory={selectedCategory}
            onCategorySelect={handleBrandCategorySelection}
            scrollViewPaddingBottom={paddingBottom}
            onScroll={handleBrandScroll}
            showHeader={false}
          />
        );
      case 'brand-selection':
        return (
          <BrandScreen
            selectedCategory={selectedCategory}
            onCategorySelect={handleBrandCategorySelection}
            scrollViewPaddingBottom={paddingBottom}
            onScroll={handleBrandScroll}
            showHeader={false}
          />
        );
      default:
        return (
          <ProductCatalogScreen
            onCreatePost={handleCreatePost}
            onStateChange={handleProductCatalogStateChange}
            scrollViewPaddingBottom={paddingBottom}
          />
        );
    }
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box
        flex={1}
        bg={isDark ? '#1A1A1A' : '#FAFAFA'}
        pt={insets.top}
      >
      {/* Görünmez Header - Yükseklik ölçümü için */}
      <Box
        position="absolute"
        opacity={0}
        pointerEvents="none"
        top={insets.top}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setHeaderHeight(height);
        }}
      >
        <Header
          title={getTitle()}
          leftAction="menu"
        />
      </Box>

      {/* Sticky Animated Header */}
      <Animated.View
        style={{
          position: 'absolute',
          top: insets.top,
          left: 0,
          right: 0,
          zIndex: 9999,
          elevation: 10,
          width: '100%',
          pointerEvents: 'box-none',
        }}
        collapsable={false}
      >
        <Animated.View
          style={{
            // Brand ve product katalog görünümlerinde header her zaman görünür olsun
            opacity: 1,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            width: '100%',
            zIndex: 9999,
          }}
        >
          <Box 
            bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
            width="100%"
          >
            <Header
              title={getTitle()}
              leftAction="menu"
            />
          </Box>
        </Animated.View>
      </Animated.View>

      {/* Arama Çubuğu */}
      <Box px="$4" pt={headerHeight > 0 ? headerHeight + 12 : '$3'}>
        <Box
          bg={isDark ? '#2A2A2A' : '#F2F2F2'}
          borderRadius={20}
          height={36}
          px="$4"
          justifyContent="center"
        >
          <HStack alignItems="center" space="sm">
            <Search size={24} color={isDark ? '#FFFFFF' : '#B9B9B9'} />
            <Input flex={1} borderWidth={0} bg="transparent">
              <InputField
                placeholder="Select product group or search product name"
                placeholderTextColor={isDark ? '#8C8C8C' : '#B9B9B9'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={9}
              />
            </Input>
          </HStack>
        </Box>
      </Box>

      {/* Content Area */}
      {renderContent()}

      {/* Floating Action Button */}
      <Pressable
        position="absolute"
        bottom={Platform.OS === 'ios' ? 34 + 28 : 45 + 28}
        right={16}
        width={60}
        height={60}
        borderRadius={30}
        bg="#4619B1"
        justifyContent="center"
        alignItems="center"
        onPress={handleFloatingButtonPress}
      >
        <Image
          source={require('@/assets/catalog_change.png')}
          alt="Change catalog"
          width={27}
          height={27}
        />
      </Pressable>

      </Box>
    </SafeAreaView>
  );
};

// PERFORMANCE FIX: Memoize CatalogScreen to prevent unnecessary re-renders during tab transitions
export const CatalogScreen = React.memo(CatalogScreenComponent);
