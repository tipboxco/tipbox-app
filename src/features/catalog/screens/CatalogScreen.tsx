import React, { useState, useRef, useCallback, useEffect, useReducer, useMemo } from 'react';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Box, Pressable, Image, HStack, VStack, Text, Input, InputField, useToast, Toast, ToastTitle, ToastDescription } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Search, X, Clock } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
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
import { useCatalogNavigationStore, catalogNavigationStore } from '../store/catalogNavigationStore';
import { useBottomOffset } from '@/src/utils';
import { useTranslation } from '@/src/hooks/useTranslation';

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
  const toast = useToast();
  const { t } = useTranslation('catalog');
  
  // Catalog Navigation Store - persist edilmiş state
  const {
    lastCatalogType,
    setLastCatalogType,
    productCatalogState,
    brandCatalogState,
    setProductCatalogState,
    setBrandCatalogState,
  } = useCatalogNavigationStore();
  
  // Get initial mode from route params, fallback to persisted state
  // Route params öncelikli (başka ekrandan geçişte), yoksa store'dan oku
  const routeView = route.params?.view;
  const routeBrandCategoryId = route.params?.brandCategoryId;
  const routeProductCategoryId = route.params?.productCategoryId;
  const routeProductSubCategoryId = route.params?.productSubCategoryId;
  const routeProductGroupId = route.params?.productGroupId;
  
  const initialModeFromRoute = routeView === 'brands' ? 'brand-catalog' : routeView === 'products' ? 'product' : undefined;
  const initialModeFromStore = lastCatalogType === 'brand' ? 'brand-catalog' : 'product';
  const initialMode = initialModeFromRoute ?? initialModeFromStore;
  
  // Route params'tan gelen index'leri store'a kaydet
  useEffect(() => {
    if (routeBrandCategoryId && routeView === 'brands') {
      setBrandCatalogState({
        selectedCategoryId: routeBrandCategoryId,
        currentStep: 'brands',
      });
    }
    if (routeProductCategoryId || routeProductSubCategoryId || routeProductGroupId) {
      // Product catalog için view'ı belirle
      let view: 'categories' | 'subcategories' | 'productgroups' | 'products' = 'categories';
      if (routeProductGroupId) {
        view = 'products';
      } else if (routeProductSubCategoryId) {
        view = 'productgroups';
      } else if (routeProductCategoryId) {
        view = 'subcategories';
      }
      
      setProductCatalogState({
        selectedCategoryId: routeProductCategoryId,
        selectedSubCategoryId: routeProductSubCategoryId,
        selectedProductGroupId: routeProductGroupId,
        currentView: view,
      });
    }
  }, [routeBrandCategoryId, routeProductCategoryId, routeProductSubCategoryId, routeProductGroupId, routeView, setBrandCatalogState, setProductCatalogState]);
  
  // PERFORMANCE FIX: Use reducer for related state management
  const [catalogState, dispatch] = useReducer(catalogScreenReducer, {
    ...initialState,
    currentMode: initialMode,
  });
  const { currentMode, selectedCategory, selectedProductLocal, breadcrumbItems } = catalogState;
  
  // Update mode when route params change or restore from store
  useEffect(() => {
    // newMode can only be 'product' or 'brand-catalog' (never 'brand-selection')
    // 'brand-selection' is only set by user action (FAB button), not by route params
    const newMode: 'product' | 'brand-catalog' = routeView === 'brands' ? 'brand-catalog' : routeView === 'products' ? 'product' : (lastCatalogType === 'brand' ? 'brand-catalog' : 'product');
    
    // CONTROL FIX: Always update mode when route params change
    // This ensures correct mode is set when navigating from ExploreScreen
    // PERFORMANCE FIX: Only dispatch if mode actually changed to prevent re-render loops
    // Note: If currentMode is 'brand-selection', we still update to newMode (from route/store)
    if (newMode !== currentMode) {
      dispatch({ type: 'SET_CURRENT_MODE', payload: newMode });
      
      // Store'a kaydet
      // newMode is always 'product' or 'brand-catalog', never 'brand-selection'
      const catalogType: 'product' | 'brand' = newMode === 'brand-catalog' ? 'brand' : 'product';
      setLastCatalogType(catalogType);
    }
  }, [routeView, lastCatalogType, currentMode, setLastCatalogType]);
  
  // UI-specific state (keep as useState for simplicity)
  const [bottomSheetKey, setBottomSheetKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const RECENT_SEARCHES_KEY = '@catalog_recent_searches';
  const MAX_RECENT = 5;

  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY)
      .then((raw) => { if (raw) setRecentSearches(JSON.parse(raw)); })
      .catch(() => {});
  }, []);

  const saveRecentSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const updated = [trimmed, ...prev.filter((q) => q !== trimmed)].slice(0, MAX_RECENT);
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const removeRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((q) => q !== query);
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const handleSearchBlur = useCallback(() => {
    setIsSearchFocused(false);
    if (searchQuery.trim()) saveRecentSearch(searchQuery);
  }, [searchQuery, saveRecentSearch]);
  
  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  
  // Bottom offset for bottom sheet padding
  const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 8 });
  
  // Create Post Flow Store
  const setFlowContext = useCreatePostFlowStore((state) => state.setFlowContext);

  // Helper function to show error toast
  const showErrorToast = useCallback((title: string, message: string) => {
    toast.show({
      placement: 'top',
      render: ({ id }) => {
        return (
          <Box maxWidth="90%" alignSelf="center" px="$4">
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle>{title}</ToastTitle>
              <ToastDescription>{message}</ToastDescription>
            </Toast>
          </Box>
        );
      },
    });
  }, [toast]);
  
  // Catalog UI Store
  // PERFORMANCE FIX: Use getState() in callbacks instead of subscribing to prevent re-renders
  // Only subscribe to values that are needed for rendering
  const setSelectedProduct = useCatalogUIStore((state) => state.setSelectedProduct);
  const setSelectedSubCategory = useCatalogUIStore((state) => state.setSelectedSubCategory);
  const setSelectedProductGroup = useCatalogUIStore((state) => state.setSelectedProductGroup);
  const setCurrentView = useCatalogUIStore((state) => state.setCurrentView);
  

  const handleBrandCategorySelection = (category: Category) => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category });
    // Brand catalog modunda kal, sadece seçilen kategoriyi güncelle
    // Kullanıcı floating button ile brand-selection moduna geçebilir
    
    // Store'a kaydet
    setBrandCatalogState({
      selectedCategoryId: category.id,
      currentStep: 'brands',
    });
  };

  const handleViewChange = useCallback((view: 'options' | 'experience' | 'product-selection') => {
    // View change is handled internally by CreatePostBottomSheet
  }, []);

  const handlePostTypeSelect = useCallback((type: string, experienceOption?: 'own' | 'tried') => {
    // Close bottom sheet first
    closeBottomSheet();
    
    // Navigate to appropriate screen based on post type
    if (type === 'free') {
      // PERFORMANCE FIX: Get store state directly instead of subscribing
      const storeState = useCatalogUIStore.getState();
      
      // Determine contextType and contextId based on current selection
      // Priority: Product > ProductGroup > SubCategory
      let determinedContextType: ProductInfoType | undefined;
      let determinedContextId: string | undefined;
      let productInfoSnapshot: { image: any; title: string; subName?: string } | undefined;
      
      // Determine context based on current view and selection (from store)
      // Priority order: Product > ProductGroup > SubCategory
      if (storeState.selectedProductId && storeState.currentView === 'products') {
        // Product selected
        determinedContextType = ProductInfoType.PRODUCT;
        determinedContextId = storeState.selectedProductId;
        // Get product info from local state if available
        if (selectedProductLocal) {
          productInfoSnapshot = {
            image: selectedProductLocal.image,
            title: selectedProductLocal.name,
            subName: selectedProductLocal.description,
          };
        }
      } else if (storeState.selectedProductGroupId && storeState.currentView === 'productgroups') {
        // ProductGroup selected
        determinedContextType = ProductInfoType.PRODUCT_GROUP;
        determinedContextId = storeState.selectedProductGroupId;
        
        // ProductGroup için image ve name bilgilerini breadcrumb'dan al
        const productGroupBreadcrumb = breadcrumbItems.find(item => item.type === 'productGroup');
        const subCategoryBreadcrumb = breadcrumbItems.find(item => item.type === 'subCategory');
        
        if (productGroupBreadcrumb?.data) {
          productInfoSnapshot = {
            image: productGroupBreadcrumb.data.image,
            title: productGroupBreadcrumb.name,
            subName: subCategoryBreadcrumb?.name || '',
          };
        }
      } else if (storeState.selectedSubCategoryId) {
        // SubCategory selected - Check if SubCategory is selected (currentView can be 'subcategories' or 'productgroups')
        // If we're in productgroups view but have a selectedSubCategoryId, it means SubCategory was selected
        determinedContextType = ProductInfoType.SUB_CATEGORY;
        determinedContextId = storeState.selectedSubCategoryId;
        
        // SubCategory için image ve name bilgilerini breadcrumb'dan al
        const subCategoryBreadcrumb = breadcrumbItems.find(item => item.type === 'subCategory');
        const categoryBreadcrumb = breadcrumbItems.find(item => item.type === 'category');
        
        if (subCategoryBreadcrumb?.data) {
          productInfoSnapshot = {
            image: subCategoryBreadcrumb.data.image,
            title: subCategoryBreadcrumb.name,
            subName: categoryBreadcrumb?.name || '',
          };
        }
      }
      
      // Save to flow store if context is available
      if (determinedContextType && determinedContextId) {
        setFlowContext(determinedContextType, determinedContextId, productInfoSnapshot);
      }
      
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'CreatePostScreen',
        params: {
          contextType: determinedContextType,
          contextId: determinedContextId,
          productInfo: productInfoSnapshot,
        },
      });
    } else if (type === 'tips') {
      // PERFORMANCE FIX: Get store state directly instead of subscribing
      const storeState = useCatalogUIStore.getState();
      
      // Determine contextType and contextId based on current selection
      // Priority: Product > ProductGroup > SubCategory
      let determinedContextType: ProductInfoType | undefined;
      let determinedContextId: string | undefined;
      let productInfoSnapshot: { image: any; title: string; subName?: string } | undefined;
      
      // Determine context based on current view and selection (from store)
      // Priority order: Product > ProductGroup > SubCategory
      if (storeState.selectedProductId && storeState.currentView === 'products') {
        // Product selected
        determinedContextType = ProductInfoType.PRODUCT;
        determinedContextId = storeState.selectedProductId;
        // Get product info from local state if available
        if (selectedProductLocal) {
          productInfoSnapshot = {
            image: selectedProductLocal.image,
            title: selectedProductLocal.name,
            subName: selectedProductLocal.description,
          };
        }
      } else if (storeState.selectedProductGroupId && storeState.currentView === 'productgroups') {
        // ProductGroup selected
        determinedContextType = ProductInfoType.PRODUCT_GROUP;
        determinedContextId = storeState.selectedProductGroupId;
        
        // ProductGroup için image ve name bilgilerini breadcrumb'dan al
        const productGroupBreadcrumb = breadcrumbItems.find(item => item.type === 'productGroup');
        const subCategoryBreadcrumb = breadcrumbItems.find(item => item.type === 'subCategory');
        
        if (productGroupBreadcrumb?.data) {
          productInfoSnapshot = {
            image: productGroupBreadcrumb.data.image,
            title: productGroupBreadcrumb.name,
            subName: subCategoryBreadcrumb?.name || '',
          };
        }
      } else if (storeState.selectedSubCategoryId) {
        // SubCategory selected - Check if SubCategory is selected (currentView can be 'subcategories' or 'productgroups')
        // If we're in productgroups view but have a selectedSubCategoryId, it means SubCategory was selected
        determinedContextType = ProductInfoType.SUB_CATEGORY;
        determinedContextId = storeState.selectedSubCategoryId;
        
        // SubCategory için image ve name bilgilerini breadcrumb'dan al
        const subCategoryBreadcrumb = breadcrumbItems.find(item => item.type === 'subCategory');
        const categoryBreadcrumb = breadcrumbItems.find(item => item.type === 'category');
        
        if (subCategoryBreadcrumb?.data) {
          productInfoSnapshot = {
            image: subCategoryBreadcrumb.data.image,
            title: subCategoryBreadcrumb.name,
            subName: categoryBreadcrumb?.name || '',
          };
        }
      }
      
      // Store'da ID yoksa hata göster
      if (!determinedContextType || !determinedContextId) {
        console.error('[CatalogScreen] ❌ Missing contextType or contextId for tips. Type:', determinedContextType, 'ID:', determinedContextId);
        showErrorToast(t('catalogScreen.error'), t('catalogScreen.pleaseSelectFirst'));
        return;
      }
      
      // Save to flow store
      setFlowContext(determinedContextType, determinedContextId, productInfoSnapshot);
      
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'CreateTipsAndTrickPostScreen',
      });
    } else if (type === 'question') {
      // PERFORMANCE FIX: Get store state directly instead of subscribing
      const storeState = useCatalogUIStore.getState();
      
      // Determine contextType and contextId based on current selection
      // Priority: Product > ProductGroup > SubCategory
      let determinedContextType: ProductInfoType | undefined;
      let determinedContextId: string | undefined;
      let productInfoSnapshot: { image: any; title: string; subName?: string } | undefined;
      
      // Determine context based on current view and selection (from store)
      // Priority order: Product > ProductGroup > SubCategory
      if (storeState.selectedProductId && storeState.currentView === 'products') {
        // Product selected
        determinedContextType = ProductInfoType.PRODUCT;
        determinedContextId = storeState.selectedProductId;
        // Get product info from local state if available
        if (selectedProductLocal) {
          productInfoSnapshot = {
            image: selectedProductLocal.image,
            title: selectedProductLocal.name,
            subName: selectedProductLocal.description,
          };
        }
      } else if (storeState.selectedProductGroupId && storeState.currentView === 'productgroups') {
        // ProductGroup selected
        determinedContextType = ProductInfoType.PRODUCT_GROUP;
        determinedContextId = storeState.selectedProductGroupId;
        
        // ProductGroup için image ve name bilgilerini breadcrumb'dan al
        const productGroupBreadcrumb = breadcrumbItems.find(item => item.type === 'productGroup');
        const subCategoryBreadcrumb = breadcrumbItems.find(item => item.type === 'subCategory');
        
        if (productGroupBreadcrumb?.data) {
          productInfoSnapshot = {
            image: productGroupBreadcrumb.data.image,
            title: productGroupBreadcrumb.name,
            subName: subCategoryBreadcrumb?.name || '',
          };
        }
      } else if (storeState.selectedSubCategoryId) {
        // SubCategory selected - Check if SubCategory is selected (currentView can be 'subcategories' or 'productgroups')
        // If we're in productgroups view but have a selectedSubCategoryId, it means SubCategory was selected
        determinedContextType = ProductInfoType.SUB_CATEGORY;
        determinedContextId = storeState.selectedSubCategoryId;
        
        // SubCategory için image ve name bilgilerini breadcrumb'dan al
        const subCategoryBreadcrumb = breadcrumbItems.find(item => item.type === 'subCategory');
        const categoryBreadcrumb = breadcrumbItems.find(item => item.type === 'category');
        
        if (subCategoryBreadcrumb?.data) {
          productInfoSnapshot = {
            image: subCategoryBreadcrumb.data.image,
            title: subCategoryBreadcrumb.name,
            subName: categoryBreadcrumb?.name || '',
          };
        }
      }
      
      // Store'da ID yoksa hata göster
      if (!determinedContextType || !determinedContextId) {
        console.error('[CatalogScreen] ❌ Missing contextType or contextId for question. Type:', determinedContextType, 'ID:', determinedContextId);
        showErrorToast(t('catalogScreen.error'), t('catalogScreen.pleaseSelectFirst'));
        return;
      }
      
      // Save to flow store
      setFlowContext(determinedContextType, determinedContextId, productInfoSnapshot);
      
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'CreateQuestionPostScreen',
      });
    } else if (type === 'experience') {
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'CreateExperiencePostScreen',
        params: {
          product: selectedProductLocal ? {
            id: selectedProductLocal.id,
            name: selectedProductLocal.name,
            description: selectedProductLocal.description,
            image: selectedProductLocal.image,
            brand: selectedProductLocal.brand,
          } : undefined,
          fromInventory: false,
          experienceOption: experienceOption,
        },
      });
    } else if (type === 'benchmark') {
      navigationService.navigate(ROOT_ROUTES.POST, {
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
      const storeState = useCatalogUIStore.getState();
      let determinedContextType: ProductInfoType | undefined;
      let determinedContextId: string | undefined;
      let productInfoSnapshot: { image: any; title: string; subName?: string } | undefined;
      if (storeState.selectedProductId && storeState.currentView === 'products') {
        determinedContextType = ProductInfoType.PRODUCT;
        determinedContextId = storeState.selectedProductId;
        if (selectedProductLocal) {
          productInfoSnapshot = {
            image: selectedProductLocal.image,
            title: selectedProductLocal.name,
            subName: selectedProductLocal.description,
          };
        }
      } else if (storeState.selectedProductGroupId && storeState.currentView === 'productgroups') {
        determinedContextType = ProductInfoType.PRODUCT_GROUP;
        determinedContextId = storeState.selectedProductGroupId;
        const productGroupBreadcrumb = breadcrumbItems.find(item => item.type === 'productGroup');
        const subCategoryBreadcrumb = breadcrumbItems.find(item => item.type === 'subCategory');
        if (productGroupBreadcrumb?.data) {
          productInfoSnapshot = {
            image: productGroupBreadcrumb.data.image,
            title: productGroupBreadcrumb.name,
            subName: subCategoryBreadcrumb?.name || '',
          };
        }
      } else if (storeState.selectedSubCategoryId) {
        determinedContextType = ProductInfoType.SUB_CATEGORY;
        determinedContextId = storeState.selectedSubCategoryId;
        const subCategoryBreadcrumb = breadcrumbItems.find(item => item.type === 'subCategory');
        const categoryBreadcrumb = breadcrumbItems.find(item => item.type === 'category');
        if (subCategoryBreadcrumb?.data) {
          productInfoSnapshot = {
            image: subCategoryBreadcrumb.data.image,
            title: subCategoryBreadcrumb.name,
            subName: categoryBreadcrumb?.name || '',
          };
        }
      }
      if (!determinedContextType || !determinedContextId) {
        return;
      }
      setFlowContext(determinedContextType, determinedContextId, productInfoSnapshot);
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'SelectExperienceForUpdateScreen',
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
  }, [navigation, selectedProductLocal, closeBottomSheet, setFlowContext, breadcrumbItems, showErrorToast]);

  const handleCreatePost = useCallback(() => {
    // Reset bottom sheet key to remount component and reset view
    setBottomSheetKey(prev => prev + 1);
    
    // PERFORMANCE FIX: Get store state directly instead of subscribing
    const storeState = useCatalogUIStore.getState();
    
    // Determine stage for bottom sheet
    // Priority: Product > ProductGroup > SubCategory
    let stageForBottomSheet: 'subcategories' | 'productgroups' | 'products' | undefined;
    if (storeState.currentView === 'categories') {
      stageForBottomSheet = undefined;
    } else if (storeState.selectedProductId && storeState.currentView === 'products') {
      // Product seçilmişse products stage'i
      stageForBottomSheet = 'products';
    } else if (storeState.selectedProductGroupId && (storeState.currentView === 'products' || storeState.currentView === 'productgroups')) {
      // ProductGroup seçilmiş ama Product seçilmemişse productgroups stage'i (subcategories ile aynı seçenekler)
      stageForBottomSheet = 'subcategories';
    } else if (storeState.currentView === 'subcategories') {
      // SubCategory seçilmişse subcategories stage'i
      stageForBottomSheet = 'subcategories';
    } else if (storeState.currentView === 'productgroups') {
      // ProductGroups view'deyse subcategories stage'i (aynı seçenekler)
      stageForBottomSheet = 'subcategories';
    } else {
      // Fallback
      stageForBottomSheet = storeState.currentView as 'subcategories' | 'products';
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
  }, [openBottomSheet, closeBottomSheet, bottomSheetKey, selectedProductLocal, isDark, bottomOffset, handlePostTypeSelect, handleViewChange]);

  const handleFloatingButtonPress = () => {
    if (currentMode === 'brand-selection') {
      // Brand selection modundan brand catalog moduna geri dön
      dispatch({ type: 'SET_CURRENT_MODE', payload: 'brand-catalog' });
      setLastCatalogType('brand');
    } else if (currentMode === 'brand-catalog') {
      // Brand catalog modundan normal moda geri dön
      dispatch({ type: 'SET_CURRENT_MODE', payload: 'product' });
      dispatch({ type: 'SET_SELECTED_CATEGORY', payload: null });
      setLastCatalogType('product');
    } else {
      // Normal moddan brand catalog moduna geç
      dispatch({ type: 'SET_CURRENT_MODE', payload: 'brand-catalog' });
      setLastCatalogType('brand');
    }
  };

  const getTitle = () => {
    switch (currentMode) {
      case 'brand-catalog':
        return t('catalogScreen.brandCatalog');
      case 'brand-selection':
        return t('catalogScreen.brandCatalog');
      default:
        return t('catalogScreen.productCatalog');
    }
  };

  const handleProductCatalogStateChange = useCallback((data: {
    selectedProduct: any | null;
    currentView: 'categories' | 'subcategories' | 'productgroups' | 'products';
    selectedSubCategoryId?: string;
    selectedProductGroupId?: string;
    breadcrumbItems: any[];
  }) => {
    // PERFORMANCE FIX: Only update if values actually changed
    // Get current store state to compare
    const currentStoreState = useCatalogUIStore.getState();
    
    // Update local state for product object (for UI display) - only if changed
    if (selectedProductLocal !== data.selectedProduct) {
      dispatch({ type: 'SET_SELECTED_PRODUCT_LOCAL', payload: data.selectedProduct });
    }
    
    // Update store with IDs - only if values changed (store already checks internally, but we can skip dispatch if same)
    if (currentStoreState.selectedProductId !== data.selectedProduct?.id) {
      setSelectedProduct(data.selectedProduct?.id);
    }
    if (currentStoreState.currentView !== data.currentView) {
      setCurrentView(data.currentView);
    }
    if (currentStoreState.selectedSubCategoryId !== data.selectedSubCategoryId) {
      setSelectedSubCategory(data.selectedSubCategoryId);
    }
    if (currentStoreState.selectedProductGroupId !== data.selectedProductGroupId) {
      setSelectedProductGroup(data.selectedProductGroupId);
    }
    
    // Update breadcrumb items - only if changed
    const breadcrumbChanged = breadcrumbItems.length !== data.breadcrumbItems.length ||
      breadcrumbItems.some((item, idx) => 
        item?.id !== data.breadcrumbItems[idx]?.id ||
        item?.type !== data.breadcrumbItems[idx]?.type
      );
    if (breadcrumbChanged) {
      dispatch({ type: 'SET_BREADCRUMB_ITEMS', payload: data.breadcrumbItems });
    }
    
    // PERFORMANCE FIX: Only update navigation store if values actually changed
    // This prevents infinite loop where setProductCatalogState updates props,
    // which causes ProductCatalogScreen to re-render and call onStateChange again
    const currentNavState = catalogNavigationStore.getState().productCatalogState;
    const navStateChanged = 
      currentNavState.currentView !== data.currentView ||
      currentNavState.selectedSubCategoryId !== data.selectedSubCategoryId ||
      currentNavState.selectedProductGroupId !== data.selectedProductGroupId ||
      currentNavState.selectedProductId !== data.selectedProduct?.id ||
      currentNavState.breadcrumbItems.length !== data.breadcrumbItems.length ||
      currentNavState.breadcrumbItems.some((item, idx) => 
        item?.id !== data.breadcrumbItems[idx]?.id ||
        item?.type !== data.breadcrumbItems[idx]?.type
      );
    
    if (navStateChanged) {
      // Catalog Navigation Store'a kaydet (persist için)
      setProductCatalogState({
        currentView: data.currentView,
        selectedSubCategoryId: data.selectedSubCategoryId,
        selectedProductGroupId: data.selectedProductGroupId,
        selectedProductId: data.selectedProduct?.id,
        breadcrumbItems: data.breadcrumbItems,
      });
    }
  }, [setSelectedProduct, setCurrentView, setSelectedSubCategory, setSelectedProductGroup, selectedProductLocal, breadcrumbItems, setProductCatalogState]);

  const renderContent = () => {
    const paddingBottom = 52;
    
    switch (currentMode) {
      case 'brand-catalog':
        return (
          <BrandScreen
            selectedCategory={selectedCategory}
            onCategorySelect={handleBrandCategorySelection}
            scrollViewPaddingBottom={paddingBottom}
            showHeader={false}
            searchQuery={searchQuery}
            initialCategoryId={routeBrandCategoryId || brandCatalogState.selectedCategoryId}
            initialStep={brandCatalogState.currentStep}
            initialBreadcrumbItems={brandCatalogState.breadcrumbItems}
            onStateChange={(state) => {
              // PERFORMANCE FIX: Only update navigation store if values actually changed
              // This prevents infinite loop where setBrandCatalogState updates props,
              // which causes BrandScreen to re-render and call onStateChange again
              const currentNavState = catalogNavigationStore.getState().brandCatalogState;
              const navStateChanged = 
                currentNavState.currentStep !== state.currentStep ||
                currentNavState.selectedCategoryId !== state.selectedCategoryId ||
                currentNavState.breadcrumbItems.length !== state.breadcrumbItems.length ||
                currentNavState.breadcrumbItems.some((item, idx) => 
                  item?.id !== state.breadcrumbItems[idx]?.id ||
                  item?.type !== state.breadcrumbItems[idx]?.type
                );
              
              if (navStateChanged) {
                setBrandCatalogState(state);
              }
            }}
          />
        );
      case 'brand-selection':
        return (
          <BrandScreen
            selectedCategory={selectedCategory}
            onCategorySelect={handleBrandCategorySelection}
            scrollViewPaddingBottom={paddingBottom}
            showHeader={false}
            searchQuery={searchQuery}
            initialCategoryId={routeBrandCategoryId || brandCatalogState.selectedCategoryId}
            initialStep={brandCatalogState.currentStep}
            initialBreadcrumbItems={brandCatalogState.breadcrumbItems}
            onStateChange={(state) => {
              // PERFORMANCE FIX: Only update navigation store if values actually changed
              // This prevents infinite loop where setBrandCatalogState updates props,
              // which causes BrandScreen to re-render and call onStateChange again
              const currentNavState = catalogNavigationStore.getState().brandCatalogState;
              const navStateChanged = 
                currentNavState.currentStep !== state.currentStep ||
                currentNavState.selectedCategoryId !== state.selectedCategoryId ||
                currentNavState.breadcrumbItems.length !== state.breadcrumbItems.length ||
                currentNavState.breadcrumbItems.some((item, idx) => 
                  item?.id !== state.breadcrumbItems[idx]?.id ||
                  item?.type !== state.breadcrumbItems[idx]?.type
                );
              
              if (navStateChanged) {
                setBrandCatalogState(state);
              }
            }}
          />
        );
      default:
        return (
          <ProductCatalogScreen
            onStateChange={handleProductCatalogStateChange}
            scrollViewPaddingBottom={paddingBottom}
            selectMode={route.params?.selectMode}
            returnScreen={route.params?.returnScreen}
            initialView={productCatalogState.currentView}
            initialSelectedCategoryId={routeProductCategoryId || productCatalogState.selectedCategoryId}
            initialSelectedSubCategoryId={routeProductSubCategoryId || productCatalogState.selectedSubCategoryId}
            initialSelectedProductGroupId={routeProductGroupId || productCatalogState.selectedProductGroupId}
            initialBreadcrumbItems={productCatalogState.breadcrumbItems}
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

        {/* Search Bar - Only for brand-catalog mode */}
        {currentMode === 'brand-catalog' && (
          <VStack
            space="md"
            pb="$4"
            px="$4"
            bg={backgroundColor}
          >
            <HStack
              alignItems="center"
              bg={isDark ? '#2A2A2A' : '#F2F2F2'}
              borderWidth={1}
              borderColor="#E9E9E9"
              borderRadius={20}
              px={14}
              space="sm"
            >
              <Search size={24} color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'} />
              <Input flex={1} borderWidth={0} bg="transparent">
                <InputField
                  placeholder={t('catalogScreen.searchBrandOrCategory')}
                  placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
                  color={isDark ? '#000' : '#000'}
                  fontSize="$xs"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={handleSearchBlur}
                />
              </Input>
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <X size={16} color={isDark ? '#8C8C8C' : '#8C8C8C'} />
                </Pressable>
              )}
            </HStack>

            {/* Recent Searches – shown when focused and query is empty */}
            {isSearchFocused && searchQuery.trim() === '' && recentSearches.length > 0 && (
              <VStack
                mt={4}
                bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                borderWidth={1}
                borderColor={isDark ? '#333' : '#E9E9E9'}
                borderRadius={12}
                overflow="hidden"
              >
                {recentSearches.map((item) => (
                  <HStack
                    key={item}
                    alignItems="center"
                    px={14}
                    py={10}
                    borderBottomWidth={1}
                    borderBottomColor={isDark ? '#2A2A2A' : '#F2F2F2'}
                    space="sm"
                  >
                    <Clock size={14} color={isDark ? '#8C8C8C' : '#8C8C8C'} />
                    <Pressable flex={1} onPress={() => { setSearchQuery(item); setIsSearchFocused(false); }}>
                      <Text fontSize="$xs" color={isDark ? '#FFFFFF' : '#1A1A1A'}>{item}</Text>
                    </Pressable>
                    <Pressable onPress={() => removeRecentSearch(item)}>
                      <X size={14} color={isDark ? '#8C8C8C' : '#8C8C8C'} />
                    </Pressable>
                  </HStack>
                ))}
              </VStack>
            )}
          </VStack>
        )}

        <VStack flex={1}>
          {/* Content Area */}
      <Box flex={1}>
        {renderContent()}
      </Box>

      {/* Floating Action Button - Hide when in select mode (e.g., from EventCreatePost) */}
      {!route.params?.selectMode && !route.params?.returnScreen && (
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
      )}
        </VStack>
      </Box>
    </SafeAreaView>
  );
};

// PERFORMANCE FIX: Memoize CatalogScreen to prevent unnecessary re-renders during tab transitions
export const CatalogScreen = React.memo(CatalogScreenComponent);
