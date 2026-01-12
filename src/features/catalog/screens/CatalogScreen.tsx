import React, { useState, useRef, useCallback, useEffect, useReducer, useMemo } from 'react';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Pressable, Image, HStack, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '@/src/components/Header';
import { mock_user_profile } from '@/src/mock/common';
import { Category } from '@/src/mock/catalog/productCatalog/types';
import { ProductCatalogScreen } from './ProductCatalogScreen';
import { BrandScreen } from './BrandScreen';
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
  
  // Get initial mode from route params
  const initialMode = route.params?.view === 'brands' ? 'brand-catalog' : 'product';
  
  // PERFORMANCE FIX: Use reducer for related state management
  const [catalogState, dispatch] = useReducer(catalogScreenReducer, {
    ...initialState,
    currentMode: initialMode,
  });
  const { currentMode, selectedCategory, selectedProductLocal, breadcrumbItems } = catalogState;
  
  // Update mode when route params change (not when currentMode changes)
  // CONTROL FIX: Always update mode when route params change, regardless of current mode
  // This ensures that when navigating from "See All Brands" or "See All Products",
  // the correct mode is set immediately
  const routeView = route.params?.view;
  useEffect(() => {
    const newMode = routeView === 'brands' ? 'brand-catalog' : 'product';
    
    // CONTROL FIX: Always update mode when route params change
    // This ensures correct mode is set when navigating from ExploreScreen
    if (newMode !== currentMode) {
      dispatch({ type: 'SET_CURRENT_MODE', payload: newMode });
    }
  }, [routeView, currentMode]); // CONTROL FIX: Added currentMode to dependencies to ensure updates
  
  // UI-specific state (keep as useState for simplicity)
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
  

  const handleBrandCategorySelection = (category: Category) => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category });
    // Brand catalog modunda kal, sadece seçilen kategoriyi güncelle
    // Kullanıcı floating button ile brand-selection moduna geçebilir
  };

  const handleViewChange = useCallback((view: 'options' | 'experience' | 'product-selection') => {
    // View change is handled internally by CreatePostBottomSheet
  }, []);

  const handlePostTypeSelect = useCallback((type: string, experienceOption?: 'own' | 'tried') => {
    // Close bottom sheet first
    closeBottomSheet();
    
    // Navigate to appropriate screen based on post type
    if (type === 'free') {
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
      } else if (selectedProductGroupId && currentView === 'productgroups') {
        // ProductGroup selected
        determinedContextType = ProductInfoType.PRODUCT_GROUP;
        determinedContextId = selectedProductGroupId;
      } else if (selectedSubCategoryId) {
        // SubCategory selected - Check if SubCategory is selected (currentView can be 'subcategories' or 'productgroups')
        // If we're in productgroups view but have a selectedSubCategoryId, it means SubCategory was selected
        determinedContextType = ProductInfoType.SUB_CATEGORY;
        determinedContextId = selectedSubCategoryId;
      }
      
      // Save to flow store if context is available
      if (determinedContextType && determinedContextId) {
        setFlowContext(determinedContextType, determinedContextId, productInfoSnapshot);
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

  const handleCreatePost = useCallback(() => {
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
  }, [openBottomSheet, closeBottomSheet, bottomSheetKey, currentView, selectedProductLocal, isDark, selectedProductId, selectedProductGroupId, selectedSubCategoryId, bottomOffset, handlePostTypeSelect, handleViewChange]);

  const handleFloatingButtonPress = () => {
    if (currentMode === 'brand-selection') {
      // Brand selection modundan brand catalog moduna geri dön
      dispatch({ type: 'SET_CURRENT_MODE', payload: 'brand-catalog' });
    } else if (currentMode === 'brand-catalog') {
      // Brand catalog modundan normal moda geri dön
      dispatch({ type: 'SET_CURRENT_MODE', payload: 'product' });
      dispatch({ type: 'SET_SELECTED_CATEGORY', payload: null });
    } else {
      // Normal moddan brand catalog moduna geç
      dispatch({ type: 'SET_CURRENT_MODE', payload: 'brand-catalog' });
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

  const renderContent = () => {
    const paddingBottom = 52;
    // CONTROL FIX: Log current mode and route params for debugging
    console.log('[CatalogScreen] renderContent:', {
      currentMode,
      routeParams: route.params,
      routeView: route.params?.view,
    });
    
    switch (currentMode) {
      case 'brand-catalog':
        console.log('[CatalogScreen] Rendering BrandScreen');
        return (
          <BrandScreen
            selectedCategory={selectedCategory}
            onCategorySelect={handleBrandCategorySelection}
            scrollViewPaddingBottom={paddingBottom}
            showHeader={false}
          />
        );
      case 'brand-selection':
        return (
          <BrandScreen
            selectedCategory={selectedCategory}
            onCategorySelect={handleBrandCategorySelection}
            scrollViewPaddingBottom={paddingBottom}
            showHeader={false}
          />
        );
      default:
        console.log('[CatalogScreen] Rendering ProductCatalogScreen');
        return (
          <ProductCatalogScreen
            onStateChange={handleProductCatalogStateChange}
            scrollViewPaddingBottom={paddingBottom}
          />
        );
    }
  };

  // PERFORMANCE FIX: Memoize background color to prevent re-renders
  const backgroundColor = useMemo(() => isDark ? '#1A1A1A' : '#FAFAFA', [isDark]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={backgroundColor}>
        <Header
          title={getTitle()}
          leftAction="menu"
        />

        <VStack flex={1}>
          {/* Content Area */}
      <Box flex={1}>
        {renderContent()}
      </Box>

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
        </VStack>
      </Box>
    </SafeAreaView>
  );
};

// PERFORMANCE FIX: Memoize CatalogScreen to prevent unnecessary re-renders during tab transitions
export const CatalogScreen = React.memo(CatalogScreenComponent);
