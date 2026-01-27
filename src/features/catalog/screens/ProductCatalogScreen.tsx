import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Box, Text, ScrollView, Pressable, HStack, VStack, Input, InputField, Image } from '@gluestack-ui/themed';
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
import { useCatalogCategories, useCatalogSubCategories, useCatalogProductGroups, useCatalogProducts, useCatalogPrefetch, useGlobalProductSearch } from '../api/hooks';
import type { CatalogCategory, CatalogSubCategory, CatalogProductGroup, CatalogProduct } from '../types';
import { ProductInfoType } from '@/src/types/common';
import { useCreatePostFlowStore } from '@/src/features/post/store/createPostFlowStore';
import { useCatalogUIStore } from '../store/catalogUIStore';
import { CategorySkeleton, ProductSkeleton } from '@/src/components/Skeletons';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { CreatePostBottomSheet } from '@/src/components/CreatePostBottomSheet';
import { useBottomOffset } from '@/src/utils';
import { useShallow } from 'zustand/react/shallow';

type ProductCatalogScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList & RootStackParamList> & {
  navigate: (name: any, params?: any) => void;
};

interface ProductCatalogScreenProps {
  onCreatePost?: () => void;
  onStateChange?: (data: {
    selectedProduct: any | null;
    currentView: 'categories' | 'subcategories' | 'productgroups' | 'products';
    selectedSubCategoryId?: string;
    selectedProductGroupId?: string;
    breadcrumbItems: BreadcrumbItem[];
  }) => void;
  scrollViewPaddingBottom?: number;
  selectMode?: 'event';
  returnScreen?: string;
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
  initialView,
  initialSelectedCategoryId,
  initialSelectedSubCategoryId,
  initialSelectedProductGroupId,
  initialBreadcrumbItems,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<ProductCatalogScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>(initialBreadcrumbItems || []);
  
  // Create Post Flow Store
  const setFlowContext = useCreatePostFlowStore((state) => state.setFlowContext);
  
  // PERFORMANCE FIX: Use shallow selector to prevent unnecessary re-renders
  // Catalog UI Store - Actions (stable references)
  const { 
    setSelectedProduct, 
    setSelectedSubCategory, 
    setSelectedProductGroup, 
    setCurrentView 
  } = useCatalogUIStore(
    useShallow((state) => ({
      setSelectedProduct: state.setSelectedProduct,
      setSelectedSubCategory: state.setSelectedSubCategory,
      setSelectedProductGroup: state.setSelectedProductGroup,
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
  
  // Seçili kategori ID'si (subcategories çekmek için) - Local state (API için)
  // Initial state'ten restore et
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(initialSelectedCategoryId);
  
  // Initial state'i restore et (sadece ilk render'da)
  useEffect(() => {
    if (initialView) {
      setCurrentView(initialView);
    }
    if (initialSelectedSubCategoryId) {
      setSelectedSubCategory(initialSelectedSubCategoryId);
    }
    if (initialSelectedProductGroupId) {
      setSelectedProductGroup(initialSelectedProductGroupId);
    }
    if (initialSelectedCategoryId) {
      setSelectedCategoryId(initialSelectedCategoryId);
    }
    if (initialBreadcrumbItems && initialBreadcrumbItems.length > 0) {
      setBreadcrumbItems(initialBreadcrumbItems);
    }
  }, []); // Sadece mount'ta çalış
  
  // Seçili alt kategori ID'si setter - Store'dan oku
  const setSelectedSubCategoryId = useCatalogUIStore((state) => state.setSelectedSubCategory);
  
  // Seçili ürün grubu ID'si setter - Store'dan oku
  const setSelectedProductGroupId = useCatalogUIStore((state) => state.setSelectedProductGroup);
  
  // Global bottom sheet hook - PERFORMANCE FIX: Direct access, no callback chain
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  
  // Bottom offset for bottom sheet padding
  const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 8 });
  
  // Bottom sheet key for remounting
  const [bottomSheetKey, setBottomSheetKey] = useState(0);
  
  // Prefetch helper
  const { prefetchSubCategories, prefetchProductGroups, prefetchProducts } = useCatalogPrefetch();
  
  // API'den kategorileri getir
  const { 
    data: catalogCategoriesData, 
    isLoading: isLoadingCategories, 
    isError,
  } = useCatalogCategories();
  
  // API'den seçili kategoriye ait subcategories'i getir
  const { 
    data: catalogSubCategoriesData, 
    isLoading: isLoadingSubCategories,
    isError: isSubCategoriesError,
    error: subCategoriesError,
  } = useCatalogSubCategories(selectedCategoryId);
  
  // subcategories verisi takibi (debug mode'da aktif)
  useEffect(() => {
    if (__DEV__) {
      console.log('[ProductCatalogScreen] 🔍 useCatalogSubCategories Hook State:', {
        selectedCategoryId,
        isLoading: isLoadingSubCategories,
        isError: isSubCategoriesError,
        error: subCategoriesError,
        hasData: !!catalogSubCategoriesData,
        dataType: typeof catalogSubCategoriesData,
        itemsCount: catalogSubCategoriesData?.items?.length || 0,
        data: catalogSubCategoriesData,
      });
    }
  }, [catalogSubCategoriesData, selectedCategoryId, isLoadingSubCategories, isSubCategoriesError, subCategoriesError]);
  
  // API'den seçili alt kategoriye ait product groups'u getir
  const { 
    data: catalogProductGroupsData, 
    isLoading: isLoadingProductGroups,
  } = useCatalogProductGroups(selectedSubCategoryId);
  
  // Debounce search query for API calls
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Global product search - tüm product group'lar arasında arama
  const hasGlobalSearch = debouncedSearchQuery && debouncedSearchQuery.length > 0;
  const { 
    data: globalSearchData, 
    isLoading: isLoadingGlobalSearch,
    fetchNextPage: fetchNextGlobalSearchPage,
    hasNextPage: hasNextGlobalSearchPage,
    isFetchingNextPage: isFetchingNextGlobalSearchPage
  } = useGlobalProductSearch(hasGlobalSearch ? debouncedSearchQuery : undefined, 20);

  // API'den seçili ürün grubuna ait products'ı getir (search ile) - sadece global search yoksa
  const { data: catalogProducts, isLoading: isLoadingProducts } = useCatalogProducts(
    hasGlobalSearch ? undefined : selectedProductGroupId, // Global search varsa productGroupId gönderme
    hasGlobalSearch ? undefined : (debouncedSearchQuery || undefined) // Global search varsa search query gönderme
  );
  
  // API'den gelen verileri formatla
  // Categories için
  const catalogCategories = useMemo(() => {
    if (!catalogCategoriesData?.items) return [];
    return catalogCategoriesData.items;
  }, [catalogCategoriesData]);

  // SubCategories için
  const catalogSubCategories = useMemo(() => {
    if (!catalogSubCategoriesData?.items) return [];
    
    // DEBUG: Backend'den gelen veriyi log'la
    if (__DEV__) {
      console.log('[ProductCatalogScreen] 📦 SubCategories Data:', {
        itemsCount: catalogSubCategoriesData.items.length,
        items: catalogSubCategoriesData.items.map(item => ({
          subCategoryId: item.subCategoryId,
          name: item.name,
          categoryId: item.categoryId,
        })),
        selectedCategoryId,
      });
    }
    
    return catalogSubCategoriesData.items;
  }, [catalogSubCategoriesData, selectedCategoryId]);

  // ProductGroups için
  const catalogProductGroups = useMemo(() => {
    if (!catalogProductGroupsData?.items) {
      if (__DEV__) {
        console.log('[ProductCatalogScreen] ⚠️ No product groups data:', {
          catalogProductGroupsData,
          selectedSubCategoryId,
        });
      }
      return [];
    }
    
    if (__DEV__) {
      console.log('[ProductCatalogScreen] ✅ Product groups loaded:', {
        count: catalogProductGroupsData.items.length,
        items: catalogProductGroupsData.items.map(item => ({
          productGroupId: item.productGroupId,
          name: item.name,
          subCategoryId: item.subCategoryId,
        })),
        selectedSubCategoryId,
      });
    }
    
    return catalogProductGroupsData.items;
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
  // CachedImage zaten toImageSource'u çağırıyor, bu yüzden image'ı direkt geçirebiliriz
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

  // Global search sonuçlarını formatla - useMemo ile cache'le
  // Global search InfiniteData döndürüyor, pages.flatMap kullanmalıyız
  const globalSearchResults = useMemo(() => {
    if (!globalSearchData?.pages) return [];
    
    // InfiniteData yapısından tüm product group'ları çıkar
    const allGroups = globalSearchData.pages.flatMap((page) => page.items || []);
    
    // DEBUG: Backend'den gelen veriyi log'la
    if (__DEV__ && allGroups.length > 0) {
      console.log('[ProductCatalogScreen] 🔍 Global Search Results:', {
        searchQuery: debouncedSearchQuery,
        groupsCount: allGroups.length,
        groups: allGroups.map(group => ({
          productGroupId: group.productGroupId,
          productGroupName: group.productGroupName,
          productsCount: group.products.length,
          products: group.products.map(p => ({
            productId: p.productId,
            name: p.name,
            image: p.image,
            productGroupId: p.productGroupId,
          })),
        })),
      });
    }
    
    // Backend'den gelen veriyi temizle ve doğrula
    const cleanedGroups = allGroups
      .map(group => {
        // Her product group için unique product'ları filtrele
        // Aynı productId'ye sahip ürünleri tekilleştir
        const uniqueProducts = group.products.reduce((acc, product) => {
          // Product ID'ye göre unique kontrolü
          if (!acc.find(p => p.productId === product.productId)) {
            acc.push(product);
          } else {
            // Duplicate product bulundu - log'la
            if (__DEV__) {
              console.warn('[ProductCatalogScreen] ⚠️ Duplicate product found:', {
                productId: product.productId,
                productName: product.name,
                productGroupId: group.productGroupId,
                productGroupName: group.productGroupName,
              });
            }
          }
          return acc;
        }, [] as CatalogProduct[]);
        
        // Eğer unique product yoksa, bu group'u filtrele
        if (uniqueProducts.length === 0) {
          if (__DEV__) {
            console.warn('[ProductCatalogScreen] ⚠️ Empty product group filtered out:', {
              productGroupId: group.productGroupId,
              productGroupName: group.productGroupName,
            });
          }
          return null;
        }
        
        return {
          ...group,
          products: uniqueProducts,
        };
      })
      .filter((group): group is NonNullable<typeof group> => group !== null);
    
    // Tüm product'ları productId'ye göre unique kontrolü yap
    // Aynı product farklı gruplarda varsa, sadece ilk görünen grubunda tut
    const seenProductIds = new Set<string>();
    const finalGroups = cleanedGroups.map(group => {
      const filteredProducts = group.products.filter(product => {
        if (seenProductIds.has(product.productId)) {
          // Bu product başka bir grupta zaten görüldü
          if (__DEV__) {
            console.warn('[ProductCatalogScreen] ⚠️ Product appears in multiple groups:', {
              productId: product.productId,
              productName: product.name,
              currentGroup: group.productGroupName,
            });
          }
          return false;
        }
        seenProductIds.add(product.productId);
        return true;
      });
      
      // Eğer tüm product'lar filtrelendiyse, bu group'u kaldır
      if (filteredProducts.length === 0) {
        return null;
      }
      
      return {
        ...group,
        products: filteredProducts,
      };
    }).filter((group): group is NonNullable<typeof group> => group !== null);
    
    return finalGroups;
  }, [globalSearchData, debouncedSearchQuery]);
  // Local state for product object (for UI display only)
  const [selectedProduct, setSelectedProductLocal] = useState<any | null>(null);

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
    selectedSubCategoryId?: string;
    selectedProductGroupId?: string;
    breadcrumbItems: BreadcrumbItem[];
  } | null>(null);

  // State değişikliklerini parent'a bildir - sadece gerçekten değiştiğinde
  useEffect(() => {
    const currentState = {
      selectedProduct,
      currentView,
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
  }, [selectedProduct, currentView, selectedSubCategoryId, selectedProductGroupId, breadcrumbItems]);

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
  };

  const handleProductPress = (product: CatalogProduct & { id: string; image: any; description?: string }) => {
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
    }
  };

  const handleShowPosts = () => {
    // Determine current stage and name from breadcrumbItems (prioritize most specific item)
    let stage: 'SubCategories' | 'ProductGroup' | 'Product' = 'SubCategories';
    let name = 'Subcategory Feed';
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
      
      // CatalogUIStore zaten güncellenmiş (handleCategoryPress, handleSubCategoryPress, handleProductGroupPress, handleProductPress içinde)
      // Burada sadece navigation yapılıyor
      
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'PostsScreen',
        params: {
          stage,
          name,
          productInfo,
          contextType, // Sadece type gönderiliyor, ID store'dan okunacak
          // contextId artık gönderilmiyor, store'dan okunacak
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
          // SubCategory bulunamadı - bu da bir sorun
          console.error('[ProductCatalogScreen] ❌ SubCategory not found in currentSubCategories:', selectedSubCategoryId);
          console.error('[ProductCatalogScreen] ❌ Available subCategories:', currentSubCategories.map(sc => ({ id: sc.id, name: sc.name })));
          return;
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
        // TODO: Show error toast/modal to user - "Please select a subcategory, product group, or product first"
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
        }
      }
      
      // Store'da ID yoksa hata göster
      if (!determinedContextType || !determinedContextId) {
        console.error('[ProductCatalogScreen] ❌ Missing contextType or contextId for question. Type:', determinedContextType, 'ID:', determinedContextId);
        // TODO: Show error toast/modal to user
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
          fromInventory: experienceOption === 'own',
          experienceOption: experienceOption,
        },
      });
    } else if (type === 'benchmark') {
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'CreateBenchmarkPostScreen',
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
        enableDynamicSizing: true,
        animateOnMount: true, // STABİL FIX: Smooth açılış animasyonu
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
    // Global search aktifse, global search sonuçlarını döndür
    if (hasGlobalSearch) {
      return null; // Global search için özel render mantığı kullanılacak
    }
    
    const data = (() => {
      switch (currentView) {
        case 'categories':
          return currentCategories.filter(category =>
            category.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        case 'subcategories':
          const filtered = currentSubCategories.filter(subCategory =>
            subCategory.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
          
          // DEBUG: Filtrelenmiş veriyi log'la
          if (__DEV__) {
            console.log('[ProductCatalogScreen] 🔍 Filtered SubCategories:', {
              currentView,
              searchQuery,
              totalCount: currentSubCategories.length,
              filteredCount: filtered.length,
              filteredItems: filtered.map(item => ({
                id: item.id,
                name: item.name,
              })),
            });
          }
          
          return filtered;
        case 'productgroups':
          return currentProductGroups.filter(productGroup =>
            productGroup.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        case 'products':
          return currentProducts.filter((product: { id: string; name: string; image?: string; description?: string }) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        default:
          return [];
      }
    })();
    
    return data;
  };

  const currentData = getCurrentData();

  // PERFORMANCE FIX: Memoize background color to prevent re-renders
  const backgroundColor = useMemo(() => isDark ? '$backgroundDark950' : '#FFFFFF', [isDark]);

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
          borderColor="#E9E9E9"
          borderRadius={20}
          px={14}
          space="sm"
        >
          <Search size={24} color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'} />
          <Input flex={1} borderWidth={0} bg="transparent">
            <InputField
              placeholder="Select product group or search product name"
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
        rootLabel="Categories"
      />

      {/* Action Buttons - Show for productgroups and products (after subcategory is selected) */}
      {(currentView === 'productgroups' || currentView === 'products') && (
        <ActionButtons
          onShowPosts={handleShowPosts}
          onCreatePost={handleCreatePost}
          categoryName={breadcrumbItems.length > 0 ? breadcrumbItems[breadcrumbItems.length - 1]?.name : undefined}
        />
      )}

      {/* Dynamic Grid */}
      <ScrollView 
        flex={1} 
        px="$4"
        onScroll={(event) => {
          // Global search için infinite scroll
          if (hasGlobalSearch && hasNextGlobalSearchPage && !isFetchingNextGlobalSearchPage) {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            const paddingToBottom = 20;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
              fetchNextGlobalSearchPage();
            }
          }
        }}
        scrollEventThrottle={400}
      >
        <VStack space="md" pt="$4" pb={scrollViewPaddingBottom}>
          {/* Global Search Results */}
          {hasGlobalSearch ? (
            isLoadingGlobalSearch ? (
              <ProductSkeleton count={9} />
            ) : globalSearchResults.length === 0 ? (
              <Box py="$8" alignItems="center">
                <Text color={isDark ? '#999' : '#666'} fontSize="$sm">
                  Arama sonucu bulunamadı
                </Text>
              </Box>
            ) : (
              <>
                {globalSearchResults.map((group) => (
                  <VStack key={group.productGroupId} space="sm" mb="$6">
                    {/* Product Group Header */}
                    <HStack alignItems="center" space="sm" mb="$2">
                      {group.productGroupImage && (
                        <Image
                          source={{ uri: group.productGroupImage }}
                          alt={group.productGroupName}
                          width={32}
                          height={32}
                          borderRadius={8}
                        />
                      )}
                      <VStack flex={1}>
                        <Text 
                          fontSize="$sm" 
                          fontWeight="$semibold" 
                          color={isDark ? '#FFF' : '#000'}
                        >
                          {group.productGroupName}
                        </Text>
                        <Text 
                          fontSize="$xs" 
                          color={isDark ? '#999' : '#666'}
                        >
                          {group.categoryName} • {group.subCategoryName}
                        </Text>
                      </VStack>
                    </HStack>
                    
                    {/* Products Grid */}
                    {Array.from({ length: Math.ceil(group.products.length / 3) }).map((_, rowIndex) => {
                      const itemsPerRow = 3;
                      const startIndex = rowIndex * itemsPerRow;
                      const rowItems = group.products.slice(startIndex, startIndex + itemsPerRow);
                      const priority = rowIndex < 3 ? 'high' : 'low';
                      
                      return (
                        <HStack key={`group-${group.productGroupId}-row-${rowIndex}`} space="md">
                          {Array.from({ length: itemsPerRow }).map((_, colIndex) => {
                            const product = rowItems[colIndex];
                            
                            if (!product) {
                              return <Box key={colIndex} flex={1} />;
                            }
                            
                            // Product image'ı doğrula
                            const productImage = product.image && product.image.trim() !== '' 
                              ? product.image 
                              : undefined;
                            
                            // DEBUG: Product image kontrolü
                            if (__DEV__ && !productImage) {
                              console.warn('[ProductCatalogScreen] ⚠️ Product missing image:', {
                                productId: product.productId,
                                productName: product.name,
                                productGroupId: group.productGroupId,
                                productGroupName: group.productGroupName,
                              });
                            }
                            
                            return (
                              <CategoryCard
                                key={`${group.productGroupId}-${product.productId}`}
                                category={{
                                  id: product.productId,
                                  name: product.name,
                                  icon: 'shopping-bag',
                                  image: productImage,
                                  subCategories: []
                                } as any}
                                onPress={() => {
                                  // Global search'ten product'a tıklandığında direkt product'ı seç
                                  // Breadcrumb'ı oluştur
                                  const categoryBreadcrumb: BreadcrumbItem = {
                                    id: group.categoryId,
                                    name: group.categoryName,
                                    type: 'category',
                                  };
                                  const subCategoryBreadcrumb: BreadcrumbItem = {
                                    id: group.subCategoryId,
                                    name: group.subCategoryName,
                                    type: 'subCategory',
                                  };
                                  const productGroupBreadcrumb: BreadcrumbItem = {
                                    id: group.productGroupId,
                                    name: group.productGroupName,
                                    type: 'productGroup',
                                  };
                                  
                                  // Breadcrumb'ı set et
                                  setBreadcrumbItems([
                                    categoryBreadcrumb,
                                    subCategoryBreadcrumb,
                                    productGroupBreadcrumb,
                                  ]);
                                  
                                  // Store'u güncelle
                                  setSelectedCategoryId(group.categoryId);
                                  setSelectedSubCategoryId(group.subCategoryId);
                                  setSelectedProductGroupId(group.productGroupId);
                                  setCurrentView('products');
                                  
                                  // Product'ı seç ve navigate et
                                  const productItem: CatalogProduct & { id: string; image: any; description?: string } = {
                                    productId: product.productId,
                                    id: product.productId,
                                    name: product.name,
                                    image: product.image || null,
                                    productGroupId: product.productGroupId,
                                    subCategoryId: product.subCategoryId,
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
                  </VStack>
                ))}
                
                {/* Load More Indicator */}
                {isFetchingNextGlobalSearchPage && (
                  <Box py="$4" alignItems="center">
                    <ProductSkeleton count={3} />
                  </Box>
                )}
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
              ) : currentData && currentData.length > 0 ? (
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
                </>
              ) : null}
            </>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
};
