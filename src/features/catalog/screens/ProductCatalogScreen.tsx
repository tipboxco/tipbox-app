import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Box, Text, ScrollView, HStack, VStack, Input, InputField, Pressable, useToast, Toast, ToastTitle, ToastDescription } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Search } from 'lucide-react-native';
import { BreadcrumbItem } from '@/src/types/breadcrumb';
import CategoryCard from '../components/CategoryCard';
import Breadcrumb from '@/src/components/Breadcrumb';
import ActionButtons from '../components/ActionButtons';
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { CatalogStackParamList } from '../navigation';
import { RootStackParamList } from '@/src/navigation/navigation.types';
import { useCatalogCategories, useCatalogSubCategories, useCatalogProductGroups, useCatalogProducts, useCatalogPrefetch } from '../api/hooks';
import type { CatalogCategory, CatalogSubCategory, CatalogProductGroup, CatalogProduct } from '../types';
import { ProductInfoType } from '@/src/types/common';
import { useCreatePostFlowStore } from '@/src/features/post/store/createPostFlowStore';
import { useCatalogUIStore } from '../store/catalogUIStore';
import { useSearch } from '@/src/features/search/api/hooks';
import { CategorySkeleton, ProductSkeleton } from '@/src/components/Skeletons';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { CreatePostBottomSheet } from '@/src/components/CreatePostBottomSheet';
import { useBottomOffset } from '@/src/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightBulbIcon } from 'react-native-heroicons/outline';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '@/src/hooks/useTranslation';

type ProductCatalogScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList & RootStackParamList> & {
  navigate: (name: any, params?: any) => void;
};

interface ProductCatalogScreenProps {
  onCreatePost?: () => void;
  onStateChange?: (data: {
    selectedProduct: any | null;
    currentView: 'categories' | 'subcategories' | 'productgroups' | 'products';
    selectedCategoryId?: string;
    selectedSubCategoryId?: string;
    selectedProductGroupId?: string;
    breadcrumbItems: BreadcrumbItem[];
  }) => void;
  scrollViewPaddingBottom?: number;
  selectMode?: 'event' | 'picker';
  returnScreen?: string;
  /** Callback for product selection in picker mode */
  onProductSelect?: (product: CatalogProduct & { id: string; image: any; description?: string }) => void;
  // Initial state props (from navigation store)
  initialView?: 'categories' | 'subcategories' | 'productgroups' | 'products';
  initialSelectedCategoryId?: string;
  initialSelectedSubCategoryId?: string;
  initialSelectedProductGroupId?: string;
  initialBreadcrumbItems?: BreadcrumbItem[];
}

export const ProductCatalogScreen: React.FC<ProductCatalogScreenProps> = ({
  onCreatePost,
  onStateChange,
  scrollViewPaddingBottom = 52,
  selectMode,
  returnScreen,
  onProductSelect,
  initialView,
  initialSelectedCategoryId,
  initialSelectedSubCategoryId,
  initialSelectedProductGroupId,
  initialBreadcrumbItems,
}) => {
  const { colorMode } = useColorMode();
  // PERFORMANCE FIX: Memoize isDark to prevent unnecessary re-renders
  const isDark = useMemo(() => colorMode === 'dark', [colorMode]);
  const navigation = useNavigation<ProductCatalogScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>(initialBreadcrumbItems || []);
  const toast = useToast();
  const { t } = useTranslation('catalog');

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

  const handleSuggestProduct = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) return;
    try {
      const existing = await AsyncStorage.getItem('tipbox-product-suggestions');
      const suggestions = existing ? JSON.parse(existing) : [];
      suggestions.push({ query, createdAt: new Date().toISOString() });
      await AsyncStorage.setItem('tipbox-product-suggestions', JSON.stringify(suggestions.slice(-50)));
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Box maxWidth="90%" alignSelf="center" px="$4">
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Öneri Kaydedildi</ToastTitle>
              <ToastDescription>"{query}" öneriniz moderasyon onayıyla eklenecektir.</ToastDescription>
            </Toast>
          </Box>
        ),
      });
    } catch {}
  }, [searchQuery, toast]);

  const SuggestButton = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return (
      <Pressable onPress={handleSuggestProduct}>
        <Box
          mt="$3"
          mx="$4"
          py="$3"
          px="$4"
          borderWidth={1}
          borderColor="#BBFF4E"
          borderRadius={12}
          flexDirection="row"
          alignItems="center"
          bg={isDark ? 'rgba(187,255,78,0.08)' : 'rgba(187,255,78,0.12)'}
        >
          <LightBulbIcon size={18} color="#BBFF4E" />
          <VStack ml="$2" flex={1}>
            <Text fontSize={13} fontWeight="$semibold" color={isDark ? '#FFFFFF' : '#000000'}>
              Aradığını bulamadın mı? Öner!
            </Text>
            <Text fontSize={11} color={isDark ? '#888' : '#666'}>
              Moderasyon onayıyla eklenecektir
            </Text>
          </VStack>
        </Box>
      </Pressable>
    );
  }, [searchQuery, isDark, handleSuggestProduct]);

  // Create Post Flow Store
  const setFlowContext = useCreatePostFlowStore((state) => state.setFlowContext);
  
  // PERFORMANCE FIX: Use shallow selector to prevent unnecessary re-renders
  // Catalog UI Store - Actions (stable references)
  const {
    setSelectedProduct,
    setSelectedSubCategoryId,
    setSelectedProductGroupId,
    setCurrentView
  } = useCatalogUIStore(
    useShallow((state) => ({
      setSelectedProduct: state.setSelectedProduct,
      setSelectedSubCategoryId: state.setSelectedSubCategory,
      setSelectedProductGroupId: state.setSelectedProductGroup,
      setCurrentView: state.setCurrentView,
    }))
  );
  
  // PERFORMANCE FIX: Use shallow selector for values
  const {
    selectedSubCategoryId,
    selectedProductGroupId,
    currentView,
  } = useCatalogUIStore(
    useShallow((state) => ({
      selectedSubCategoryId: state.selectedSubCategoryId,
      selectedProductGroupId: state.selectedProductGroupId,
      currentView: state.currentView,
    }))
  );
  
  // ScrollView ref for scroll position control
  const scrollViewRef = useRef<any>(null);

  // Seçili kategori ID'si (subcategories çekmek için) - Local state (API için)
  // Initial state'ten restore et
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(initialSelectedCategoryId);

  // Local state for product object (for UI display only)
  const [selectedProduct, setSelectedProductLocal] = useState<any | null>(null);

  // Track if this is the initial focus to prevent duplicate resets
  const isInitialFocusRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isInitialFocusRef.current) {
        isInitialFocusRef.current = false;

        // If initial state was restored from store (FAB switch), preserve it
        const hasRestoredState = (initialBreadcrumbItems && initialBreadcrumbItems.length > 0) ||
          (initialView && initialView !== 'categories');
        if (hasRestoredState) {
          return;
        }

        // Reset to root state - always start at "Categories"
        setBreadcrumbItems([]);
        setSelectedCategoryId(undefined);
        setSelectedSubCategoryId(undefined);
        setSelectedProductGroupId(undefined);
        setSelectedProductLocal(null);
        setCurrentView('categories');

        // Scroll to top
        scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
      }
      // Don't reset the flag on cleanup - preserves state when navigating to PostsScreen and back
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setSelectedSubCategoryId, setSelectedProductGroupId, setCurrentView])
  );

  // Global bottom sheet hook - PERFORMANCE FIX: Direct access, no callback chain
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  
  // Bottom offset for bottom sheet padding
  const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 8 });
  
  // Bottom sheet key for remounting
  const [bottomSheetKey, setBottomSheetKey] = useState(0);
  
  // Prefetch helper
  const { prefetchSubCategories, prefetchProductGroups, prefetchProducts } = useCatalogPrefetch();
  
  // API'den kategorileri getir (infinite scroll)
  const {
    data: catalogCategoriesData,
    isLoading: isLoadingCategories,
    isError,
    fetchNextPage: fetchNextCategoriesPage,
    hasNextPage: hasNextCategoriesPage,
    isFetchingNextPage: isFetchingNextCategoriesPage,
  } = useCatalogCategories();

  // API'den seçili kategoriye ait subcategories'i getir (infinite scroll)
  const {
    data: catalogSubCategoriesData,
    isLoading: isLoadingSubCategories,
    isError: isSubCategoriesError,
    error: subCategoriesError,
    fetchNextPage: fetchNextSubCategoriesPage,
    hasNextPage: hasNextSubCategoriesPage,
    isFetchingNextPage: isFetchingNextSubCategoriesPage,
  } = useCatalogSubCategories(selectedCategoryId);
  
  // subcategories verisi takibi (debug mode'da aktif)
  useEffect(() => {
    if (__DEV__) {
      const allItems = catalogSubCategoriesData?.pages?.flatMap((page) => page.items || []) || [];
      console.log('[ProductCatalogScreen] 🔍 useCatalogSubCategories Hook State:', {
        selectedCategoryId,
        isLoading: isLoadingSubCategories,
        isError: isSubCategoriesError,
        error: subCategoriesError,
        hasData: !!catalogSubCategoriesData,
        itemsCount: allItems.length,
      });
    }
  }, [catalogSubCategoriesData, selectedCategoryId, isLoadingSubCategories, isSubCategoriesError, subCategoriesError]);
  
  // API'den seçili alt kategoriye ait product groups'u getir (infinite scroll)
  const {
    data: catalogProductGroupsData,
    isLoading: isLoadingProductGroups,
    fetchNextPage: fetchNextProductGroupsPage,
    hasNextPage: hasNextProductGroupsPage,
    isFetchingNextPage: isFetchingNextProductGroupsPage,
  } = useCatalogProductGroups(selectedSubCategoryId);
  
  // Debounce search query for API calls
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Arama değiştiğinde scroll pozisyonunu sıfırla
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, [debouncedSearchQuery]);

  // Global product search - /search endpoint kullanılıyor
  const { data: searchResults, isLoading: isSearchLoading } = useSearch(
    { keyword: debouncedSearchQuery, types: ['product'], limit: 50 },
    debouncedSearchQuery.length > 0
  );

  const showGlobalSearchResults = debouncedSearchQuery.length > 0 && !!searchResults?.productData;

  // API'den seçili ürün grubuna ait products'ı getir
  // Products seviyesinde arama backend'e gönderilir (tüm ürünlerde arama yapılır)
  const {
    data: catalogProducts,
    isLoading: isLoadingProducts,
    fetchNextPage: fetchNextProductsPage,
    hasNextPage: hasNextProductsPage,
    isFetchingNextPage: isFetchingNextProductsPage,
  } = useCatalogProducts(
    selectedProductGroupId ?? undefined,
    currentView === 'products' && debouncedSearchQuery ? debouncedSearchQuery : undefined
  );
  
  // API'den gelen verileri formatla (InfiniteData yapısından flatten)
  // Categories için
  const catalogCategories = useMemo(() => {
    if (!catalogCategoriesData?.pages) return [];
    return catalogCategoriesData.pages.flatMap((page) => page.items || []);
  }, [catalogCategoriesData]);

  // SubCategories için (InfiniteData yapısından flatten)
  const catalogSubCategories = useMemo(() => {
    if (!catalogSubCategoriesData?.pages) return [];

    const allItems = catalogSubCategoriesData.pages.flatMap((page) => page.items || []);

    if (__DEV__) {
      console.log('[ProductCatalogScreen] 📦 SubCategories Data:', {
        itemsCount: allItems.length,
        items: allItems.map(item => ({
          subCategoryId: item.subCategoryId,
          name: item.name,
          categoryId: item.categoryId,
        })),
        selectedCategoryId,
      });
    }

    return allItems;
  }, [catalogSubCategoriesData, selectedCategoryId]);

  // ProductGroups için (InfiniteData yapısından tüm product groups'ı çıkar)
  const catalogProductGroups = useMemo(() => {
    if (!catalogProductGroupsData?.pages) {
      if (__DEV__) {
        console.log('[ProductCatalogScreen] ⚠️ No product groups data:', {
          catalogProductGroupsData,
          selectedSubCategoryId,
        });
      }
      return [];
    }

    const allItems = catalogProductGroupsData.pages.flatMap((page) => page.items || []);

    if (__DEV__) {
      console.log('[ProductCatalogScreen] ✅ Product groups loaded:', {
        count: allItems.length,
        items: allItems.map(item => ({
          productGroupId: item.productGroupId,
          name: item.name,
          subCategoryId: item.subCategoryId,
        })),
        selectedSubCategoryId,
      });
    }

    return allItems;
  }, [catalogProductGroupsData, selectedSubCategoryId]);

  // İlk 3 kategorinin subcategories'ini prefetch et (kullanıcı deneyimini iyileştirmek için)
  useEffect(() => {
    if (catalogCategories && catalogCategories.length > 0) {
      const firstThreeCategories = catalogCategories.slice(0, 3);
      firstThreeCategories.forEach(category => {
        prefetchSubCategories(category.categoryId);
      });
    }
  }, [catalogCategories, prefetchSubCategories]);
  
  // API'den gelen kategorileri Category formatına dönüştür - useMemo ile cache'le
  const currentCategories = useMemo(() => {
    if (!catalogCategories || catalogCategories.length === 0) return [];
    
    return catalogCategories.map(cat => {
      
      return {
        id: cat.categoryId,
        name: cat.name,
        icon: 'folder',
        image: cat.image || undefined, // Boş string ise undefined yap
        subCategories: [], // API'den subCategories gelmiyor, boş array
      };
    });
  }, [catalogCategories]);

  // API'den gelen subcategories'i formatla - useMemo ile cache'le
  const currentSubCategories = useMemo(() => {
    if (!catalogSubCategories || catalogSubCategories.length === 0) {
      if (__DEV__) {
        console.warn('[ProductCatalogScreen] ⚠️ No subcategories found:', {
          catalogSubCategoriesLength: catalogSubCategories?.length || 0,
          selectedCategoryId,
        });
      }
      return [];
    }
    
    const formatted = catalogSubCategories.map(subCat => ({
      id: subCat.subCategoryId,
      name: subCat.name,
      image: subCat.image || undefined, // Boş string ise undefined yap
      categoryId: subCat.categoryId,
      productGroups: [], // API'den productGroups gelmiyor, boş array
    }));
    
    // DEBUG: Formatlanmış veriyi log'la
    if (__DEV__) {
      console.log('[ProductCatalogScreen] ✅ Formatted SubCategories:', {
        count: formatted.length,
        items: formatted.map(item => ({
          id: item.id,
          name: item.name,
          categoryId: item.categoryId,
        })),
      });
    }
    
    return formatted;
  }, [catalogSubCategories, selectedCategoryId]);

  // API'den gelen product groups'u formatla - useMemo ile cache'le
  const currentProductGroups = useMemo(() => {
    if (!catalogProductGroups || catalogProductGroups.length === 0) {
      if (__DEV__) {
        console.log('[ProductCatalogScreen] ⚠️ No product groups to format:', {
          catalogProductGroupsLength: catalogProductGroups?.length || 0,
          selectedSubCategoryId,
        });
      }
      return [];
    }
    
    const formatted = catalogProductGroups.map(productGroup => ({
      id: productGroup.productGroupId,
      name: productGroup.name,
      image: productGroup.image || undefined, // Boş string ise undefined yap
      subCategoryId: productGroup.subCategoryId,
      products: [], // API'den products gelmiyor, boş array
    }));
    
    if (__DEV__) {
      console.log('[ProductCatalogScreen] ✅ Formatted ProductGroups:', {
        count: formatted.length,
        items: formatted.map(item => ({
          id: item.id,
          name: item.name,
          subCategoryId: item.subCategoryId,
        })),
      });
    }
    
    return formatted;
  }, [catalogProductGroups, selectedSubCategoryId]);

  // API'den gelen products'ı formatla - useMemo ile cache'le
  // useCatalogProducts InfiniteData döndürüyor, pages.flatMap kullanmalıyız
  const currentProducts = useMemo(() => {
    if (!catalogProducts?.pages) return [];
    
    // InfiniteData yapısından tüm products'ı çıkar
    const allProducts = catalogProducts.pages.flatMap((page) => page.items || []);
    
    return allProducts.map((product: CatalogProduct) => ({
      id: product.productId,
      name: product.name,
      image: product.image || undefined, // Boş string ise undefined yap
      productGroupId: product.productGroupId,
      subCategoryId: product.subCategoryId,
      description: '', // API'den description gelmiyor
    }));
  }, [catalogProducts]);

  // Search sonuçlarını flat product listesi olarak formatla
  const searchProductList = useMemo(() => {
    if (!searchResults?.productData) return [];
    return searchResults.productData;
  }, [searchResults]);

  // PERFORMANCE FIX: Store onStateChange in ref to prevent infinite loops
  // onStateChange prop may have a new reference on every render from parent
  // Using ref ensures we always call the latest version without causing re-renders
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // PERFORMANCE FIX: Track previous values to prevent unnecessary callbacks
  // Only call onStateChange when values actually change
  const prevStateRef = useRef<{
    selectedProduct: any | null;
    currentView: 'categories' | 'subcategories' | 'productgroups' | 'products';
    selectedCategoryId?: string;
    selectedSubCategoryId?: string;
    selectedProductGroupId?: string;
    breadcrumbItems: BreadcrumbItem[];
  } | null>(null);

  // State değişikliklerini parent'a bildir - sadece gerçekten değiştiğinde
  useEffect(() => {
    const currentState = {
      selectedProduct,
      currentView,
      selectedCategoryId,
      selectedSubCategoryId,
      selectedProductGroupId,
      breadcrumbItems,
    };

    // İlk render'da veya değerler gerçekten değiştiyse callback çağır
    if (!prevStateRef.current) {
      prevStateRef.current = currentState;
      onStateChangeRef.current?.(currentState);
      return;
    }

    const prev = prevStateRef.current;
    const hasChanged =
      prev.selectedProduct !== currentState.selectedProduct ||
      prev.currentView !== currentState.currentView ||
      prev.selectedCategoryId !== currentState.selectedCategoryId ||
      prev.selectedSubCategoryId !== currentState.selectedSubCategoryId ||
      prev.selectedProductGroupId !== currentState.selectedProductGroupId ||
      prev.breadcrumbItems.length !== currentState.breadcrumbItems.length ||
      prev.breadcrumbItems.some((item, idx) =>
        item.id !== currentState.breadcrumbItems[idx]?.id ||
        item.type !== currentState.breadcrumbItems[idx]?.type
      );

    if (hasChanged) {
      prevStateRef.current = currentState;
      onStateChangeRef.current?.(currentState);
    }
  }, [selectedProduct, currentView, selectedCategoryId, selectedSubCategoryId, selectedProductGroupId, breadcrumbItems]);

  // Ekrana geri dönüldüğünde product breadcrumb'ını temizle
  useFocusEffect(
    useCallback(() => {
      // Eğer breadcrumb'da product varsa, onu kaldır
      const hasProductInBreadcrumb = breadcrumbItems.some(item => item.type === 'product');
      if (hasProductInBreadcrumb) {
        const filteredBreadcrumb = breadcrumbItems.filter(item => item.type !== 'product');
        setBreadcrumbItems(filteredBreadcrumb);
        setSelectedProductLocal(null);
        setSelectedProduct(undefined);
      }
    }, [breadcrumbItems, setSelectedProduct])
  );

  const resetToRoot = useCallback(() => {
    setBreadcrumbItems([]);
    setSelectedCategoryId(undefined);
    setSelectedSubCategoryId(undefined);
    setSelectedProductGroupId(undefined);
    setSelectedProductLocal(null);
    setCurrentView('categories');

    // Scroll pozisyonunu sıfırla
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, [setSelectedSubCategoryId, setSelectedProductGroupId, setCurrentView, setSelectedProductLocal]);

  const handleCategoryPress = (category: { id: string; name: string; image: any }) => {
    // Seçili kategori ID'sini set et (subcategories API çağrısı için)
    setSelectedCategoryId(category.id);
    setSelectedSubCategoryId(undefined); // Subcategory'yi temizle
    setSelectedProductGroupId(undefined); // ProductGroup'u temizle
    setSelectedProductLocal(null);

    setBreadcrumbItems([
      {
        id: category.id,
        name: category.name,
        type: 'category',
        data: category,
      },
    ]);
    setCurrentView('subcategories');

    // Scroll pozisyonunu sıfırla
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  };

  const handleSubCategoryPress = (subCategory: CatalogSubCategory & { id: string; image: any }) => {
    // Get the current category from breadcrumb
    const currentCategory = breadcrumbItems.find(item => item.type === 'category');
    const fallbackCategory =
      currentCategories.find(cat => cat.id === subCategory.categoryId) || null;
    const categoryBreadcrumb: BreadcrumbItem | null =
      currentCategory ||
      (fallbackCategory
        ? {
            id: fallbackCategory.id,
            name: fallbackCategory.name,
            type: 'category',
            data: fallbackCategory,
          }
        : null);

    // Seçili alt kategori ID'sini set et (product groups API çağrısı için)
    setSelectedSubCategoryId(subCategory.id);
    setSelectedProductGroupId(undefined); // ProductGroup'u temizle
    setSelectedProduct(undefined); // Product ID'yi de temizle (store'da yanlış ID kalmasın)
    setSelectedProductLocal(null);

    // Product groups'u prefetch et (hızlı yükleme için)
    prefetchProductGroups(subCategory.id);

    setBreadcrumbItems(
      [
        categoryBreadcrumb,
        {
          id: subCategory.id,
          name: subCategory.name,
          type: 'subCategory',
          data: subCategory,
        },
      ].filter(Boolean) as BreadcrumbItem[]
    );
    setCurrentView('productgroups');

    // Scroll pozisyonunu sıfırla
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  };

  const handleProductGroupPress = (productGroup: CatalogProductGroup & { id: string; image: any }) => {
    // Seçili ürün grubu ID'sini set et (products API çağrısı için)
    setSelectedProductGroupId(productGroup.id);
    setSelectedProductLocal(null);

    // Products'ı prefetch et (hızlı yükleme için)
    prefetchProducts(productGroup.id);

    const currentCategory = breadcrumbItems.find(item => item.type === 'category');
    const currentSubCategory = breadcrumbItems.find(item => item.type === 'subCategory');

    setBreadcrumbItems(
      [
        currentCategory,
        currentSubCategory,
        {
          id: productGroup.id,
          name: productGroup.name,
          type: 'productGroup',
          data: productGroup,
        },
      ].filter(Boolean) as BreadcrumbItem[]
    );
    setCurrentView('products');

    // Scroll pozisyonunu sıfırla
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  };

  const handleProductPress = (product: CatalogProduct & { id: string; image: any; description?: string }) => {
    // If onProductSelect callback is provided (picker mode), call it and return
    if (onProductSelect) {
      onProductSelect(product);
      return;
    }

    // If selectMode is 'event' and returnScreen is 'EventCreatePost',
    // navigate back to EventCreatePost with productId and clear all Catalog screens
    if (selectMode === 'event' && returnScreen === 'EventCreatePost') {
      // Get current EventCreatePost route params to preserve eventId
      // Try to get from navigation state first (more reliable)
      let currentEventCreatePostParams: any = null;
      try {
        const navState = navigation.getState();
        // Find EventCreatePost in navigation state
        const findEventCreatePost = (routes: any[]): any => {
          for (const route of routes) {
            if (route.name === 'EventCreatePost' && route.params) {
              return route.params;
            }
            if (route.state?.routes) {
              const found = findEventCreatePost(route.state.routes);
              if (found) return found;
            }
          }
          return null;
        };
        currentEventCreatePostParams = findEventCreatePost(navState.routes || []);
      } catch (error) {
        console.warn('[ProductCatalogScreen] Failed to get navigation state:', error);
      }
      
      // Fallback to getCurrentRoute if navigation state doesn't work
      if (!currentEventCreatePostParams) {
        const currentRoute = navigationService.getCurrentRoute();
        currentEventCreatePostParams = currentRoute?.name === 'EventCreatePost' 
          ? currentRoute.params 
          : null;
      }
      
      console.log('🔍 [ProductCatalogScreen] EventCreatePost params:', currentEventCreatePostParams);
      console.log('✅ [ProductCatalogScreen] Selected product:', {
        id: product.id,
        name: product.name,
      });
      
      // Navigate back to EventCreatePost with selected productId
      // Clear all Catalog screens from stack by going back to EventCreatePost
      // Use CommonActions.reset to clear entire navigation stack and go directly to EventCreatePost
      try {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: ROOT_ROUTES.EVENT as any,
                state: {
                  routes: [
                    {
                      name: 'EventCreatePost' as any,
                      params: {
                        ...(currentEventCreatePostParams || {}), // Preserve existing params (eventId, eventType, etc.)
                        selectedProduct: {
                          id: product.id,
                          name: product.name,
                          image: product.image,
                          description: product.description || '',
                        },
                      },
                    },
                  ],
                },
              },
            ],
          })
        );
      } catch (error) {
        console.warn('[ProductCatalogScreen] Failed to reset navigation, using fallback:', error);
        // Fallback: use navigationService (if reset fails)
        navigationService.navigate(ROOT_ROUTES.EVENT, {
          screen: 'EventCreatePost',
          params: {
            ...(currentEventCreatePostParams || {}), // Preserve existing params (eventId, eventType, etc.)
            selectedProduct: {
              id: product.id,
              name: product.name,
              image: product.image,
              description: product.description || '',
            },
          },
        });
      }
      return; // Early return - don't navigate to PostsScreen
    }
    
    // Normal flow: Save to flow store and navigate to PostsScreen (only if not in event select mode)
    // Get the current breadcrumb items (category, subcategory, productGroup, products)
    const currentCategory = breadcrumbItems.find(item => item.type === 'category');
    const currentSubCategory = breadcrumbItems.find(item => item.type === 'subCategory');
    const currentProductGroup = breadcrumbItems.find(item => item.type === 'productGroup');
    
    // Create product breadcrumb item
    const productBreadcrumbItem: BreadcrumbItem = {
      id: product.id,
      name: product.name,
      type: 'product',
      data: product,
    };

    // Update breadcrumb items
    setBreadcrumbItems(
      [
        currentCategory,
        currentSubCategory,
        currentProductGroup,
        productBreadcrumbItem,
      ].filter(Boolean) as BreadcrumbItem[]
    );
    
    // Store selected product for CreatePostBottomSheet
    setSelectedProductLocal(product);
    // Store'a product ID'yi kaydet
    setSelectedProduct(product.id);
    
    // Save to flow store for CreatePostScreen
    setFlowContext(ProductInfoType.PRODUCT, product.id, {
      image: product.image,
      title: product.name,
      subName: product.description || product.name,
    });
    
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'PostsScreen',
      params: {
        stage: 'Product',
        name: product.name,
        productInfo: {
          image: product.image,
          title: product.name, // Product name (top)
          subName: product.description || product.name, // Product description or name (bottom)
        },
        selectedProduct: {
          id: product.id, // product_id
          name: product.name,
          description: product.description || '',
          image: product.image,
          productGroupId: product.productGroupId, // CRITICAL: Benchmark için gerekli
        },
      contextType: ProductInfoType.PRODUCT,
      // contextId artık route params'tan gönderilmiyor, store'dan okunacak
    },
  });
};

const handleBreadcrumbPress = (item: BreadcrumbItem, index: number) => {
  if (item.type === 'root' || index === -1) {
    resetToRoot();
    return;
  }

  if (item.type === 'category') {
    setBreadcrumbItems([item]);
    setSelectedCategoryId(item.id);
    setSelectedSubCategoryId(undefined);
    setSelectedProductGroupId(undefined);
    setSelectedProductLocal(null);
    setSelectedProduct(undefined);
    setCurrentView('subcategories');
    // Scroll pozisyonunu sıfırla
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    return;
  }

  if (item.type === 'subCategory') {
    const categoryItem = breadcrumbItems.find(breadcrumb => breadcrumb.type === 'category');
    const updated = [categoryItem, item].filter(Boolean) as BreadcrumbItem[];
    setBreadcrumbItems(updated);
    setSelectedCategoryId(categoryItem?.id);
    setSelectedSubCategoryId(item.id);
    setSelectedProductGroupId(undefined);
    setSelectedProductLocal(null);
    setSelectedProduct(undefined);
    setCurrentView('productgroups');
    // Scroll pozisyonunu sıfırla
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    return;
  }

  if (item.type === 'productGroup') {
    const categoryItem = breadcrumbItems.find(breadcrumb => breadcrumb.type === 'category');
    const subCategoryItem = breadcrumbItems.find(breadcrumb => breadcrumb.type === 'subCategory');
    const updated = [categoryItem, subCategoryItem, item].filter(Boolean) as BreadcrumbItem[];
    setBreadcrumbItems(updated);
    setSelectedCategoryId(categoryItem?.id);
    setSelectedSubCategoryId(subCategoryItem?.id);
    setSelectedProductGroupId(item.id);
    setSelectedProductLocal(null);
    setSelectedProduct(undefined);
    setCurrentView('products');
    // Scroll pozisyonunu sıfırla
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    return;
  }

  if (item.type === 'product') {
      const categoryItem = breadcrumbItems.find(breadcrumb => breadcrumb.type === 'category');
      const subCategoryItem = breadcrumbItems.find(breadcrumb => breadcrumb.type === 'subCategory');
      const productGroupItem = breadcrumbItems.find(breadcrumb => breadcrumb.type === 'productGroup');
      const updated = [categoryItem, subCategoryItem, productGroupItem, item].filter(Boolean) as BreadcrumbItem[];
      setBreadcrumbItems(updated);
      setSelectedCategoryId(categoryItem?.id);
      setSelectedSubCategoryId(subCategoryItem?.id);
      setSelectedProductGroupId(productGroupItem?.id);
      setSelectedProductLocal(item.data || null);
      // Store'a product ID'yi kaydet
      setSelectedProduct(item.data?.id);
      setCurrentView('products');
      // Scroll pozisyonunu sıfırla
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    }
  };

  const handleShowPosts = () => {
    // Determine current stage and name from breadcrumbItems (prioritize most specific item)
    let stage: 'SubCategories' | 'ProductGroup' | 'Product' = 'SubCategories';
    let name = t('post:screens.posts.subcategoryFeed');
    let productInfo: { image: any; title: string; subName?: string } | null = null;

    // Priority: Product > ProductGroup > SubCategory > Category
    const productItem = breadcrumbItems.find(item => item.type === 'product');
    const productGroupItem = breadcrumbItems.find(item => item.type === 'productGroup');
    const subCategoryItem = breadcrumbItems.find(item => item.type === 'subCategory');
    const categoryItem = breadcrumbItems.find(item => item.type === 'category');

    if (productItem && productGroupItem) {
      // Product selected (with ProductGroup) - title=ProductGroup, subName=Product
      stage = 'Product';
      name = productItem.name;
      const product = currentProducts.find((p: { id: string; name: string; image?: string; description?: string }) => p.id === productItem.id);
      // TODO: Implement when product groups API is available
      if (product) {
        productInfo = {
          image: product.image,
          title: product.name, // Product name (top)
          subName: product.description || product.name, // Product description or name (bottom)
        };
      } else if (selectedProduct) {
        productInfo = {
          image: selectedProduct.image,
          title: selectedProduct.name,
          subName: selectedProduct.description || selectedProduct.name,
        };
      }
    } else if (productGroupItem && subCategoryItem) {
      // ProductGroup selected (with SubCategory) - title=SubCategory, subName=ProductGroup
      stage = 'ProductGroup';
      name = productGroupItem.name;
      const productGroup = currentProductGroups.find(pg => pg.id === productGroupItem.id);
      if (productGroup) {
        productInfo = {
          image: productGroup.image,
          title: productGroup.name,
          subName: subCategoryItem.name,
        };
      } else {
        // Fallback: SubCategory bilgisini kullan
        const subCategory = currentSubCategories.find(sc => sc.id === subCategoryItem.id);
        if (subCategory) {
          productInfo = {
            image: subCategory.image,
            title: subCategory.name,
            subName: productGroupItem.name,
          };
        }
      }
    } else if (subCategoryItem && categoryItem) {
      // SubCategory selected (with Category) - title=Category, subName=SubCategory
      stage = 'SubCategories';
      name = subCategoryItem.name;
      const subCategory = currentSubCategories.find(sc => sc.id === subCategoryItem.id);
      if (subCategory) {
        productInfo = {
          image: subCategory.image,
          title: subCategory.name,
          subName: categoryItem.name,
        };
      } else {
        // Fallback: Category bilgisini kullan
        const category = currentCategories.find(cat => cat.id === categoryItem.id);
        if (category) {
          productInfo = {
            image: category.image,
            title: category.name,
            subName: subCategoryItem.name,
          };
        }
      }
    } else if (categoryItem) {
      // Category selected (fallback)
      stage = 'SubCategories';
      name = categoryItem.name;
      const category = currentCategories.find(cat => cat.id === categoryItem.id);
      if (category) {
        productInfo = {
          image: category.image,
          title: category.name,
        };
      }
    }

    // Navigate to PostsScreen with parameters
    // productInfo oluşturulamadıysa bile navigation yap (fallback productInfo ile)
    if (!productInfo) {
      // Fallback: En azından bir productInfo oluştur
      const categoryItem = breadcrumbItems.find(item => item.type === 'category');
      const subCategoryItem = breadcrumbItems.find(item => item.type === 'subCategory');
      const productGroupItem = breadcrumbItems.find(item => item.type === 'productGroup');
      
      if (productGroupItem) {
        const productGroup = currentProductGroups.find(pg => pg.id === productGroupItem.id);
        productInfo = {
          image: productGroup?.image || (subCategoryItem ? currentSubCategories.find(sc => sc.id === subCategoryItem.id)?.image : undefined) || currentCategories[0]?.image,
          title: productGroupItem.name,
          subName: subCategoryItem?.name || categoryItem?.name,
        };
      } else if (subCategoryItem) {
        const subCategory = currentSubCategories.find(sc => sc.id === subCategoryItem.id);
        productInfo = {
          image: subCategory?.image || (categoryItem ? currentCategories.find(cat => cat.id === categoryItem.id)?.image : undefined) || currentCategories[0]?.image,
          title: subCategoryItem.name,
          subName: categoryItem?.name,
        };
      } else if (categoryItem) {
        const category = currentCategories.find(cat => cat.id === categoryItem.id);
        productInfo = {
          image: category?.image || currentCategories[0]?.image,
          title: categoryItem.name,
        };
      }
    }
    
    if (productInfo) {
      // ContextType ve contextId'yi belirle
      // ÖNEMLİ: Store'dan ID'leri al, breadcrumb'tan değil (store daha güvenilir)
      const selectedProductId = useCatalogUIStore.getState().selectedProductId;
      const currentSelectedSubCategoryId = useCatalogUIStore.getState().selectedSubCategoryId;
      const currentSelectedProductGroupId = useCatalogUIStore.getState().selectedProductGroupId;
      
      let contextType: ProductInfoType | undefined;
      let contextId: string | undefined;
      
      // Priority: Product > ProductGroup > SubCategory
      if (productItem && selectedProductId) {
        contextType = ProductInfoType.PRODUCT;
        contextId = selectedProductId; // Store'dan al
      } else if (productGroupItem && currentSelectedProductGroupId) {
        contextType = ProductInfoType.PRODUCT_GROUP;
        contextId = currentSelectedProductGroupId; // Store'dan al
      } else if (subCategoryItem && currentSelectedSubCategoryId) {
        contextType = ProductInfoType.SUB_CATEGORY;
        contextId = currentSelectedSubCategoryId; // Store'dan al
      }
      
      // Store'da ID yoksa breadcrumb'tan fallback yap (ama log bas)
      if (!contextId) {
        if (productItem) {
          contextType = ProductInfoType.PRODUCT;
          contextId = productItem.id;
          console.warn('[ProductCatalogScreen] ⚠️ Product ID not found in store, using breadcrumb ID:', contextId);
        } else if (productGroupItem) {
          contextType = ProductInfoType.PRODUCT_GROUP;
          contextId = productGroupItem.id;
          console.warn('[ProductCatalogScreen] ⚠️ ProductGroup ID not found in store, using breadcrumb ID:', contextId);
        } else if (subCategoryItem) {
          contextType = ProductInfoType.SUB_CATEGORY;
          contextId = subCategoryItem.id;
          console.warn('[ProductCatalogScreen] ⚠️ SubCategory ID not found in store, using breadcrumb ID:', contextId);
        }
      }
      
      // Save to flow store for CreatePostScreen
      if (contextType && contextId) {
        setFlowContext(contextType, contextId, {
          image: productInfo.image,
          title: productInfo.title,
          subName: productInfo.subName,
        });
      }
      
      // contextId'yi route params ile gönder - store'a güvenmeyelim (product group ekranında boş veri sorununu önler)
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'PostsScreen',
        params: {
          stage,
          name,
          productInfo,
          contextType,
          contextId,
        },
      });
    }
  };

  // PERFORMANCE FIX: Direct bottom sheet access - no callback chain
  // This eliminates the callback chain: ProductCatalogScreen -> CatalogScreen -> handleCreatePost
  const handlePostTypeSelect = useCallback((type: string, experienceOption?: 'own' | 'tried') => {
    // Close bottom sheet first
    closeBottomSheet();
    
    // Get current store state
    const selectedProductId = useCatalogUIStore.getState().selectedProductId;
    
    // Determine contextType and contextId based on current selection
    // Priority: Product > ProductGroup > SubCategory
    let determinedContextType: ProductInfoType | undefined;
    let determinedContextId: string | undefined;
    let productInfoSnapshot: { image: any; title: string; subName?: string } | undefined;
    
    // Determine context based on current view and selection (from store)
    if (selectedProductId && currentView === 'products') {
      determinedContextType = ProductInfoType.PRODUCT;
      determinedContextId = selectedProductId;
      if (selectedProduct) {
        productInfoSnapshot = {
          image: selectedProduct.image,
          title: selectedProduct.name,
          subName: selectedProduct.description,
        };
      }
    } else if (selectedProductGroupId && (currentView === 'products' || currentView === 'productgroups')) {
      determinedContextType = ProductInfoType.PRODUCT_GROUP;
      determinedContextId = selectedProductGroupId;
      
      // ProductGroup için image ve name bilgilerini al
      const selectedProductGroup = currentProductGroups.find(pg => pg.id === selectedProductGroupId);
      if (selectedProductGroup) {
        // SubCategory bilgisini de al (subName için)
        const subCategoryItem = breadcrumbItems.find(item => item.type === 'subCategory');
        const subCategoryName = subCategoryItem?.name || '';
        
        productInfoSnapshot = {
          image: selectedProductGroup.image,
          title: selectedProductGroup.name,
          subName: subCategoryName,
        };
      }
    } else if (selectedSubCategoryId) {
      determinedContextType = ProductInfoType.SUB_CATEGORY;
      determinedContextId = selectedSubCategoryId;
      
      // SubCategory için image ve name bilgilerini al
      const selectedSubCategory = currentSubCategories.find(sc => sc.id === selectedSubCategoryId);
      if (selectedSubCategory) {
        // Category bilgisini de al (subName için)
        const categoryItem = breadcrumbItems.find(item => item.type === 'category');
        const categoryName = categoryItem?.name || '';
        
        productInfoSnapshot = {
          image: selectedSubCategory.image,
          title: selectedSubCategory.name,
          subName: categoryName,
        };
      }
    }
    
    // Navigate to appropriate screen based on post type
    if (type === 'free') {
      // ProductGroup için image ve name bilgilerini al (eğer henüz alınmadıysa)
      if (determinedContextType === ProductInfoType.PRODUCT_GROUP && determinedContextId && !productInfoSnapshot) {
        const selectedProductGroup = currentProductGroups.find(pg => pg.id === determinedContextId);
        if (selectedProductGroup) {
          // SubCategory bilgisini de al (subName için)
          const subCategoryItem = breadcrumbItems.find(item => item.type === 'subCategory');
          const subCategoryName = subCategoryItem?.name || '';
          
          productInfoSnapshot = {
            image: selectedProductGroup.image,
            title: selectedProductGroup.name,
            subName: subCategoryName,
          };
        }
      }
      // SubCategory için image ve name bilgilerini al (eğer henüz alınmadıysa)
      else if (determinedContextType === ProductInfoType.SUB_CATEGORY && determinedContextId && !productInfoSnapshot) {
        const selectedSubCategory = currentSubCategories.find(sc => sc.id === determinedContextId);
        if (selectedSubCategory) {
          // Category bilgisini de al (subName için)
          const categoryItem = breadcrumbItems.find(item => item.type === 'category');
          const categoryName = categoryItem?.name || '';
          
          productInfoSnapshot = {
            image: selectedSubCategory.image,
            title: selectedSubCategory.name,
            subName: categoryName,
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
      // Get current store state
      const selectedProductId = useCatalogUIStore.getState().selectedProductId;
      
      // Determine contextType and contextId based on current selection
      // Priority: Product > ProductGroup > SubCategory
      // IMPORTANT: Category seviyesinde tips post oluşturulamaz, en az subcategory seçilmeli
      let determinedContextType: ProductInfoType | undefined;
      let determinedContextId: string | undefined;
      let productInfoSnapshot: { image: any; title: string; subName?: string } | undefined;
      
      // Determine context based on current view and selection (from store)
      if (selectedProductId && currentView === 'products') {
        determinedContextType = ProductInfoType.PRODUCT;
        determinedContextId = selectedProductId;
        if (selectedProduct) {
          productInfoSnapshot = {
            image: selectedProduct.image,
            title: selectedProduct.name,
            subName: selectedProduct.description,
          };
        }
      } else if (selectedProductGroupId && (currentView === 'products' || currentView === 'productgroups')) {
        determinedContextType = ProductInfoType.PRODUCT_GROUP;
        determinedContextId = selectedProductGroupId;
        
        // ProductGroup için image ve name bilgilerini al
        const selectedProductGroup = currentProductGroups.find(pg => pg.id === selectedProductGroupId);
        if (selectedProductGroup) {
          // SubCategory bilgisini de al (subName için)
          const subCategoryItem = breadcrumbItems.find(item => item.type === 'subCategory');
          const subCategoryName = subCategoryItem?.name || '';
          
          productInfoSnapshot = {
            image: selectedProductGroup.image,
            title: selectedProductGroup.name,
            subName: subCategoryName,
          };
        }
      } else if (selectedSubCategoryId && currentView !== 'categories') {
        determinedContextType = ProductInfoType.SUB_CATEGORY;
        determinedContextId = selectedSubCategoryId;
        
        // SubCategory için image ve name bilgilerini al
        const selectedSubCategory = currentSubCategories.find(sc => sc.id === selectedSubCategoryId);
        if (selectedSubCategory) {
          // Category bilgisini de al (subName için)
          const categoryItem = breadcrumbItems.find(item => item.type === 'category');
          const categoryName = categoryItem?.name || '';
          
          productInfoSnapshot = {
            image: selectedSubCategory.image,
            title: selectedSubCategory.name,
            subName: categoryName,
          };
        } else {
          // FALLBACK: currentSubCategories'de bulunamadıysa breadcrumbItems'dan al
          const subCategoryBreadcrumb = breadcrumbItems.find(
            item => item.type === 'subcategory' && item.id === selectedSubCategoryId
          );
          const categoryBreadcrumb = breadcrumbItems.find(item => item.type === 'category');
          
          if (subCategoryBreadcrumb) {
            productInfoSnapshot = {
              image: subCategoryBreadcrumb.data?.image,
              title: subCategoryBreadcrumb.name,
              subName: categoryBreadcrumb?.name || '',
            };
            console.log('[ProductCatalogScreen] ✅ SubCategory bilgisi breadcrumb\'dan alındı:', productInfoSnapshot);
          } else {
            // Son fallback: Minimal bilgi ile devam et
            console.warn('[ProductCatalogScreen] ⚠️ SubCategory detayları bulunamadı, minimal bilgi ile devam ediliyor');
            productInfoSnapshot = {
              image: undefined,
              title: 'Selected Subcategory', // Placeholder
              subName: categoryBreadcrumb?.name || '',
            };
          }
        }
      }
      
      // Store'da ID yoksa veya category seviyesindeyse hata göster
      if (!determinedContextType || !determinedContextId) {
        console.error('[ProductCatalogScreen] ❌ Missing contextType or contextId for tips. Type:', determinedContextType, 'ID:', determinedContextId, 'Current view:', currentView);
        console.error('[ProductCatalogScreen] ❌ Store state:', {
          selectedProductId,
          selectedSubCategoryId,
          selectedProductGroupId,
          currentView,
        });
        showErrorToast(t('catalogScreen.error'), t('catalogScreen.pleaseSelectSubcategory'));
        return;
      }
      
      // Save to flow store
      setFlowContext(determinedContextType, determinedContextId, productInfoSnapshot);
      
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'CreateTipsAndTrickPostScreen',
      });
    } else if (type === 'question') {
      // Get current store state
      const selectedProductId = useCatalogUIStore.getState().selectedProductId;
      
      // Determine contextType and contextId based on current selection
      // Priority: Product > ProductGroup > SubCategory
      let determinedContextType: ProductInfoType | undefined;
      let determinedContextId: string | undefined;
      let productInfoSnapshot: { image: any; title: string; subName?: string } | undefined;
      
      // Determine context based on current view and selection (from store)
      if (selectedProductId && currentView === 'products') {
        determinedContextType = ProductInfoType.PRODUCT;
        determinedContextId = selectedProductId;
        if (selectedProduct) {
          productInfoSnapshot = {
            image: selectedProduct.image,
            title: selectedProduct.name,
            subName: selectedProduct.description,
          };
        }
      } else if (selectedProductGroupId && (currentView === 'products' || currentView === 'productgroups')) {
        determinedContextType = ProductInfoType.PRODUCT_GROUP;
        determinedContextId = selectedProductGroupId;
        
        // ProductGroup için image ve name bilgilerini al
        const selectedProductGroup = currentProductGroups.find(pg => pg.id === selectedProductGroupId);
        if (selectedProductGroup) {
          // SubCategory bilgisini de al (subName için)
          const subCategoryItem = breadcrumbItems.find(item => item.type === 'subCategory');
          const subCategoryName = subCategoryItem?.name || '';
          
          productInfoSnapshot = {
            image: selectedProductGroup.image,
            title: selectedProductGroup.name,
            subName: subCategoryName,
          };
        }
      } else if (selectedSubCategoryId) {
        determinedContextType = ProductInfoType.SUB_CATEGORY;
        determinedContextId = selectedSubCategoryId;
        
        // SubCategory için image ve name bilgilerini al
        const selectedSubCategory = currentSubCategories.find(sc => sc.id === selectedSubCategoryId);
        if (selectedSubCategory) {
          // Category bilgisini de al (subName için)
          const categoryItem = breadcrumbItems.find(item => item.type === 'category');
          const categoryName = categoryItem?.name || '';
          
          productInfoSnapshot = {
            image: selectedSubCategory.image,
            title: selectedSubCategory.name,
            subName: categoryName,
          };
        } else {
          // FALLBACK: currentSubCategories'de bulunamadıysa breadcrumbItems'dan al
          const subCategoryBreadcrumb = breadcrumbItems.find(
            item => item.type === 'subcategory' && item.id === selectedSubCategoryId
          );
          const categoryBreadcrumb = breadcrumbItems.find(item => item.type === 'category');
          
          if (subCategoryBreadcrumb) {
            productInfoSnapshot = {
              image: subCategoryBreadcrumb.data?.image,
              title: subCategoryBreadcrumb.name,
              subName: categoryBreadcrumb?.name || '',
            };
            console.log('[ProductCatalogScreen] ✅ SubCategory bilgisi breadcrumb\'dan alındı:', productInfoSnapshot);
          } else {
            // Son fallback: Minimal bilgi ile devam et
            console.warn('[ProductCatalogScreen] ⚠️ SubCategory detayları bulunamadı, minimal bilgi ile devam ediliyor');
            productInfoSnapshot = {
              image: undefined,
              title: 'Selected Subcategory',
              subName: categoryBreadcrumb?.name || '',
            };
          }
        }
      }
      
      // Store'da ID yoksa hata göster
      if (!determinedContextType || !determinedContextId) {
        console.error('[ProductCatalogScreen] ❌ Missing contextType or contextId for question. Type:', determinedContextType, 'ID:', determinedContextId);
        showErrorToast(t('catalogScreen.error'), t('catalogScreen.pleaseSelectSubcategory'));
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
          product: selectedProduct ? {
            id: selectedProduct.id,
            name: selectedProduct.name,
            description: selectedProduct.description,
            image: selectedProduct.image,
            brand: selectedProduct.brand,
          } : undefined,
          fromInventory: false,
          experienceOption: experienceOption,
        },
      });
    } else if (type === 'benchmark') {
      console.log('[ProductCatalogScreen] 🎯 Navigating to benchmark with product:', {
        id: selectedProduct?.id,
        name: selectedProduct?.name,
        productGroupId: selectedProduct?.productGroupId,
        hasProductGroupId: !!selectedProduct?.productGroupId,
      });

      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'CreateBenchmarkPostScreen',
        params: {
          product: selectedProduct ? {
            id: selectedProduct.id,
            name: selectedProduct.name,
            description: selectedProduct.description,
            image: selectedProduct.image,
            productGroupId: selectedProduct.productGroupId, // CRITICAL: Benchmark filter için gerekli
          } : undefined,
        },
      });
    } else if (type === 'update') {
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'CreateUpdatePostScreen',
        params: {
          product: selectedProduct ? {
            id: selectedProduct.id,
            name: selectedProduct.name,
            description: selectedProduct.description,
            image: selectedProduct.image,
          } : undefined,
        },
      });
    }
  }, [navigation, selectedProduct, closeBottomSheet, setFlowContext, currentView, selectedSubCategoryId, selectedProductGroupId, currentSubCategories, currentProductGroups, breadcrumbItems]);

  const handleCreatePost = useCallback(() => {
    // Reset bottom sheet key to remount component and reset view
    setBottomSheetKey(prev => prev + 1);
    
    // Determine stage for bottom sheet
    // Priority: Product > ProductGroup > SubCategory
    let stageForBottomSheet: 'subcategories' | 'productgroups' | 'products' | undefined;
    const selectedProductId = useCatalogUIStore.getState().selectedProductId;
    
    if (currentView === 'categories') {
      stageForBottomSheet = undefined;
    } else if (selectedProductId && currentView === 'products') {
      stageForBottomSheet = 'products';
    } else if (selectedProductGroupId && (currentView === 'products' || currentView === 'productgroups')) {
      stageForBottomSheet = 'subcategories';
    } else if (currentView === 'subcategories') {
      stageForBottomSheet = 'subcategories';
    } else if (currentView === 'productgroups') {
      stageForBottomSheet = 'subcategories';
    } else {
      stageForBottomSheet = currentView as 'subcategories' | 'products';
    }
    
    // STABİL FIX: animateOnMount: true ile smooth açılış
    openBottomSheet(
      <CreatePostBottomSheet
        key={bottomSheetKey + 1}
        onClose={closeBottomSheet}
        onPostTypeSelect={handlePostTypeSelect}
        onViewChange={(view) => {
          console.log('BottomSheet view changed:', view);
        }}
        stage={stageForBottomSheet}
        selectedProduct={selectedProduct ? {
          id: selectedProduct.id,
          name: selectedProduct.name,
          subName: selectedProduct.description || undefined,
          image: selectedProduct.image,
          hasDiscount: false,
        } : undefined}
      />,
      {
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        snapPoints: ['50%'], // CRITICAL FIX: Use snapPoints instead of enableDynamicSizing
        animateOnMount: true,
        paddingBottom: bottomOffset,
        onChange: (index: number) => {
          // Reset bottom sheet key when sheet closes to reset view state
          if (index === -1) {
            setBottomSheetKey(prev => prev + 1);
          }
        },
      }
    );
  }, [openBottomSheet, closeBottomSheet, bottomSheetKey, currentView, selectedProduct, selectedProductGroupId, selectedSubCategoryId, bottomOffset, handlePostTypeSelect]);

  const getCurrentData = () => {
    // Categories, subcategories, productgroups: yerel filtre (API arama desteklemiyor)
    // Products: backend'e search parametresi gönderiliyor, ek client-side filtre yok
    const query = searchQuery.trim().toLowerCase();
    switch (currentView) {
      case 'categories':
        return query
          ? currentCategories.filter(category => category.name.toLowerCase().includes(query))
          : currentCategories;
      case 'subcategories':
        return query
          ? currentSubCategories.filter(subCategory => subCategory.name.toLowerCase().includes(query))
          : currentSubCategories;
      case 'productgroups':
        return query
          ? currentProductGroups.filter(productGroup => productGroup.name.toLowerCase().includes(query))
          : currentProductGroups;
      case 'products':
        // Products backend'den search parametresiyle filtreleniyor, client-side filtre gereksiz
        return currentProducts;
      default:
        return [];
    }
  };

  const currentData = getCurrentData();

  // PERFORMANCE FIX: Memoize background color to prevent re-renders
  const backgroundColor = useMemo(() => isDark ? '#1A1A1A' : '#FFFFFF', [isDark]);

  return (
    <Box flex={1}>

      {/* Search Bar - Fixed at top */}
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
          borderColor={isDark ? '#333333' : '#E9E9E9'}
          borderRadius={20}
          px={14}
          space="sm"
        >
          <Search size={24} color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'} />
          <Input flex={1} borderWidth={0} bg="transparent">
            <InputField
              placeholder={t('productCatalog.searchPlaceholder')}
              placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
              color={isDark ? '#000' : '#000'}
              fontSize="$xs"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Input>
        </HStack>
      </VStack>

      {/* Breadcrumb */}
      <Breadcrumb
        items={breadcrumbItems}
        onItemPress={handleBreadcrumbPress}
        rootLabel={t('productCatalog.categories')}
      />

      {/* Action Buttons - Show for productgroups and products (after subcategory is selected) */}
      {/* Hidden in picker/select mode (onProductSelect or selectMode set) */}
      {(currentView === 'productgroups' || currentView === 'products') && !onProductSelect && !selectMode && (
        <ActionButtons
          onShowPosts={handleShowPosts}
          onCreatePost={handleCreatePost}
          categoryName={breadcrumbItems.length > 0 ? breadcrumbItems[breadcrumbItems.length - 1]?.name : undefined}
        />
      )}

      {/* Dynamic Grid */}
      <ScrollView
        ref={scrollViewRef}
        flex={1}
        px="$4"
        onScroll={(event) => {
          const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
          const paddingToBottom = 200;
          const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

          if (!isNearBottom) return;

          // Normal products view için infinite scroll
          if (!showGlobalSearchResults && currentView === 'products' && hasNextProductsPage && !isFetchingNextProductsPage) {
            fetchNextProductsPage();
          }

          // Product groups view için infinite scroll
          if (!showGlobalSearchResults && currentView === 'productgroups' && hasNextProductGroupsPage && !isFetchingNextProductGroupsPage) {
            fetchNextProductGroupsPage();
          }

          // Categories view için infinite scroll
          if (!showGlobalSearchResults && currentView === 'categories' && hasNextCategoriesPage && !isFetchingNextCategoriesPage) {
            fetchNextCategoriesPage();
          }

          // Subcategories view için infinite scroll
          if (!showGlobalSearchResults && currentView === 'subcategories' && hasNextSubCategoriesPage && !isFetchingNextSubCategoriesPage) {
            fetchNextSubCategoriesPage();
          }
        }}
        scrollEventThrottle={16}
      >
        <VStack space="md" pt="$4" pb={scrollViewPaddingBottom}>
          {/* Global Search Results - /search endpoint'inden gelen ürünler */}
          {showGlobalSearchResults ? (
            isSearchLoading ? (
              <ProductSkeleton count={9} />
            ) : searchProductList.length === 0 ? (
              <Box py="$8" alignItems="center">
                <Text color={isDark ? '#999' : '#666'} fontSize="$sm">
                  {t('productCatalog.noSearchResults', { query: debouncedSearchQuery })}
                </Text>
                {SuggestButton}
              </Box>
            ) : (
              <>
                {/* Search Products Grid - 3'lü flat grid */}
                {Array.from({ length: Math.ceil(searchProductList.length / 3) }).map((_, rowIndex) => {
                  const itemsPerRow = 3;
                  const startIndex = rowIndex * itemsPerRow;
                  const rowItems = searchProductList.slice(startIndex, startIndex + itemsPerRow);
                  const priority = rowIndex < 3 ? 'high' : 'low';

                  return (
                    <HStack key={`search-row-${rowIndex}`} space="md">
                      {Array.from({ length: itemsPerRow }).map((_, colIndex) => {
                        const product = rowItems[colIndex];

                        if (!product) {
                          return <Box key={colIndex} flex={1} />;
                        }

                        const productImage = product.image && product.image.trim() !== ''
                          ? product.image
                          : undefined;

                        return (
                          <CategoryCard
                            key={`search-${product.id}`}
                            category={{
                              id: product.id,
                              name: product.name,
                              icon: 'shopping-bag',
                              image: productImage,
                              subCategories: []
                            } as any}
                            onPress={() => {
                              const productItem: CatalogProduct & { id: string; image: any; description?: string } = {
                                productId: product.id,
                                id: product.id,
                                name: product.name,
                                image: product.image || null,
                                productGroupId: '',
                                subCategoryId: '',
                              };

                              handleProductPress(productItem);
                            }}
                            priority={priority}
                          />
                        );
                      })}
                    </HStack>
                  );
                })}
              </>
            )
          ) : (
            <>
              {/* Loading skeleton */}
              {(currentView === 'categories' && isLoadingCategories) ||
              (currentView === 'subcategories' && isLoadingSubCategories) ||
              (currentView === 'productgroups' && isLoadingProductGroups) ||
              (currentView === 'products' && isLoadingProducts) ? (
                currentView === 'products' ? (
                  <ProductSkeleton count={9} />
                ) : (
                  <CategorySkeleton count={9} />
                )
              ) : currentData.length > 0 ? (
                <>
                  {/* currentData'yı gruplara böl - categories için 2'li, diğerleri için 3'lü */}
                  {Array.from({ length: Math.ceil(currentData.length / (currentView === 'categories' ? 2 : 3)) }).map((_, rowIndex) => {
                    const itemsPerRow = currentView === 'categories' ? 2 : 3;
                    const startIndex = rowIndex * itemsPerRow;
                    const rowItems = currentData.slice(startIndex, startIndex + itemsPerRow);
                    // İlk 3 satır için high priority - ilk ekranda görünen tüm görseller
                    // Diğerleri için low priority - scroll edildiğinde yüklenecek
                    const priority = rowIndex < 3 ? 'high' : 'low';
                    
                    return (
                      <HStack key={`row-${rowIndex}`} space="md">
                        {Array.from({ length: itemsPerRow }).map((_, colIndex) => {
                          const currentItem = rowItems[colIndex];
                          
                          if (!currentItem) {
                            // Son satırda eksik item varsa invisible spacer kullan
                            return <Box key={colIndex} flex={1} />;
                          }
                          
                          // Render different components based on current view
                          if (currentView === 'categories') {
                            return (
                              <CategoryCard
                                key={currentItem.id}
                                category={currentItem as any}
                                onPress={handleCategoryPress}
                                priority={priority}
                                isLargeCard={true}
                              />
                            );
                          } else if (currentView === 'subcategories') {
                            const subCategoryItem = currentItem as unknown as CatalogSubCategory & { id: string; image: any };
                            return (
                              <CategoryCard
                                key={currentItem.id}
                                category={{
                                  id: subCategoryItem.id,
                                  name: subCategoryItem.name,
                                  icon: 'folder',
                                  image: subCategoryItem.image,
                                  subCategories: []
                                } as any}
                                onPress={() => handleSubCategoryPress(subCategoryItem)}
                                priority={priority}
                              />
                            );
                          } else if (currentView === 'productgroups') {
                            const productGroupItem = currentItem as unknown as CatalogProductGroup & { id: string; image: any };
                            return (
                              <CategoryCard
                                key={currentItem.id}
                                category={{
                                  id: productGroupItem.id,
                                  name: productGroupItem.name,
                                  icon: 'package',
                                  image: productGroupItem.image,
                                  subCategories: []
                                } as any}
                                onPress={() => handleProductGroupPress(productGroupItem)}
                                priority={priority}
                              />
                            );
                          } else if (currentView === 'products') {
                            const productItem = currentItem as unknown as CatalogProduct & { id: string; image: any };
                            return (
                              <CategoryCard
                                key={currentItem.id}
                                category={{
                                  id: productItem.id,
                                  name: productItem.name,
                                  icon: 'shopping-bag',
                                  image: productItem.image,
                                  subCategories: []
                                } as any}
                                onPress={() => handleProductPress(productItem)}
                                priority={priority}
                              />
                            );
                          }
                          
                          return null;
                        })}
                      </HStack>
                    );
                  })}

                  {/* Load More Indicator - Normal products view için */}
                  {!showGlobalSearchResults && currentView === 'products' && isFetchingNextProductsPage && (
                    <Box py="$4" alignItems="center">
                      <ProductSkeleton count={3} />
                    </Box>
                  )}

                  {/* Load More Indicator - Product groups view için */}
                  {!showGlobalSearchResults && currentView === 'productgroups' && isFetchingNextProductGroupsPage && (
                    <Box py="$4" alignItems="center">
                      <CategorySkeleton count={3} />
                    </Box>
                  )}

                  {/* Load More Indicator - Categories view için */}
                  {!showGlobalSearchResults && currentView === 'categories' && isFetchingNextCategoriesPage && (
                    <Box py="$4" alignItems="center">
                      <CategorySkeleton count={3} />
                    </Box>
                  )}

                  {/* Load More Indicator - Subcategories view için */}
                  {!showGlobalSearchResults && currentView === 'subcategories' && isFetchingNextSubCategoriesPage && (
                    <Box py="$4" alignItems="center">
                      <CategorySkeleton count={3} />
                    </Box>
                  )}
                </>
              ) : currentData.length === 0 && searchQuery.trim().length > 0 ? (
                <Box py="$8" alignItems="center" px="$4">
                  <Text color={isDark ? '#999' : '#666'} fontSize="$sm" textAlign="center">
                    {t('productCatalog.noSearchResults', { query: searchQuery.trim() })}
                  </Text>
                  {SuggestButton}
                </Box>
              ) : currentData.length === 0 ? (
                <Box py="$8" alignItems="center" px="$4">
                  <Text color={isDark ? '#999' : '#666'} fontSize="$sm" textAlign="center">
                    {t('productCatalog.noDataAvailable')}
                  </Text>
                </Box>
              ) : null}
            </>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
};
