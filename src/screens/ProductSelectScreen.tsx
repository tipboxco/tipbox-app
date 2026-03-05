import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Box, Text, ScrollView, Pressable, HStack, VStack, Input, InputField, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Search } from 'lucide-react-native';
import { BreadcrumbItem } from '@/src/types/breadcrumb';
import CategoryCard from '@/src/features/catalog/components/CategoryCard';
import Breadcrumb from '@/src/components/Breadcrumb';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { RootStackParamList } from '@/src/navigation/types/root.types';
import { useCatalogCategories, useCatalogSubCategories, useCatalogProductGroups, useCatalogProducts, useCatalogPrefetch, useGlobalProductSearch } from '@/src/features/catalog/api/hooks';
import type { CatalogCategory, CatalogSubCategory, CatalogProductGroup, CatalogProduct } from '@/src/features/catalog/types';
import { CategorySkeleton, ProductSkeleton } from '@/src/components/Skeletons';
import { useShallow } from 'zustand/react/shallow';
import { useCatalogUIStore } from '@/src/features/catalog/store/catalogUIStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/src/components/Header';
import { EventType } from '@/src/utils';
import { useTranslation } from 'react-i18next';

type ProductSelectScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ProductSelectScreenRouteProp = RouteProp<RootStackParamList, 'ProductSelect'>;

export const ProductSelectScreen: React.FC = () => {
  const { t } = useTranslation('catalog');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<ProductSelectScreenNavigationProp>();
  const route = useRoute<ProductSelectScreenRouteProp>();
  
  // Route params
  const returnScreen = route.params?.returnScreen;
  const eventId = route.params?.eventId;
  const eventType = route.params?.eventType;
  const experienceOption = route.params?.experienceOption;
  const selectedProductField = route.params?.selectedProductField;
  const initialProduct = route.params?.initialProduct;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([]);
  
  // Catalog UI Store - Actions
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
  
  // Catalog UI Store - Values
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
  
  // Selected category ID (for API calls)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  
  // Prefetch helper
  const { prefetchSubCategories, prefetchProductGroups, prefetchProducts } = useCatalogPrefetch();
  
  // API hooks
  const { 
    data: catalogCategoriesData, 
    isLoading: isLoadingCategories, 
    isError,
  } = useCatalogCategories();
  
  const { 
    data: catalogSubCategoriesData, 
    isLoading: isLoadingSubCategories,
  } = useCatalogSubCategories(selectedCategoryId);
  
  const { 
    data: catalogProductGroupsData, 
    isLoading: isLoadingProductGroups,
  } = useCatalogProductGroups(selectedSubCategoryId);
  
  // Debounce search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Global product search
  const hasGlobalSearch = debouncedSearchQuery && debouncedSearchQuery.length > 0;
  const { 
    data: globalSearchData, 
    isLoading: isLoadingGlobalSearch,
    fetchNextPage: fetchNextGlobalSearchPage,
    hasNextPage: hasNextGlobalSearchPage,
    isFetchingNextPage: isFetchingNextGlobalSearchPage
  } = useGlobalProductSearch(hasGlobalSearch ? debouncedSearchQuery : undefined, 20);

  // Products API
  const { data: catalogProducts, isLoading: isLoadingProducts } = useCatalogProducts(
    hasGlobalSearch ? undefined : selectedProductGroupId,
    hasGlobalSearch ? undefined : (debouncedSearchQuery || undefined)
  );
  
  // Format API data
  const catalogCategories = useMemo(() => {
    if (!catalogCategoriesData?.items) return [];
    return catalogCategoriesData.items;
  }, [catalogCategoriesData]);

  // Reset store on mount - EventCreatePost'tan geldiğinde temiz başla
  useEffect(() => {
    // Component mount olduğunda store'u temizle
    setSelectedCategoryId(undefined);
    setSelectedSubCategory(undefined);
    setSelectedProductGroup(undefined);
    setSelectedProduct(undefined);
    setCurrentView('categories');
    setBreadcrumbItems([]);
  }, []); // Empty dependency array - sadece mount'ta çalışır

  const catalogSubCategories = useMemo(() => {
    if (!catalogSubCategoriesData?.items) return [];
    return catalogSubCategoriesData.items;
  }, [catalogSubCategoriesData]);

  const catalogProductGroups = useMemo(() => {
    if (!catalogProductGroupsData?.items) return [];
    return catalogProductGroupsData.items;
  }, [catalogProductGroupsData]);

  const currentProducts = useMemo(() => {
    if (!catalogProducts?.pages) return [];
    const allProducts = catalogProducts.pages.flatMap((page) => page.items || []);
    return allProducts.map((product: CatalogProduct) => ({
      id: product.productId,
      name: product.name,
      image: product.image || undefined,
      productGroupId: product.productGroupId,
      subCategoryId: product.subCategoryId,
      description: '',
    }));
  }, [catalogProducts]);

  // Format categories for UI
  const currentCategories = useMemo(() => {
    if (!catalogCategories || catalogCategories.length === 0) return [];
    return catalogCategories.map(cat => ({
      id: cat.categoryId,
      name: cat.name,
      icon: 'folder',
      image: cat.image || undefined,
      subCategories: [],
    }));
  }, [catalogCategories]);

  const currentSubCategories = useMemo(() => {
    if (!catalogSubCategories || catalogSubCategories.length === 0) return [];
    return catalogSubCategories.map(subCat => ({
      id: subCat.subCategoryId,
      name: subCat.name,
      image: subCat.image || undefined,
      categoryId: subCat.categoryId,
      productGroups: [],
    }));
  }, [catalogSubCategories]);

  const currentProductGroups = useMemo(() => {
    if (!catalogProductGroups || catalogProductGroups.length === 0) return [];
    return catalogProductGroups.map(productGroup => ({
      id: productGroup.productGroupId,
      name: productGroup.name,
      image: productGroup.image || undefined,
      subCategoryId: productGroup.subCategoryId,
      products: [],
    }));
  }, [catalogProductGroups]);

  // Global search results
  const globalSearchResults = useMemo(() => {
    if (!globalSearchData?.pages) return [];
    const allGroups = globalSearchData.pages.flatMap((page) => page.items || []);
    
    const cleanedGroups = allGroups
      .map(group => {
        const uniqueProducts = group.products.reduce((acc, product) => {
          if (!acc.find(p => p.productId === product.productId)) {
            acc.push(product);
          }
          return acc;
        }, [] as CatalogProduct[]);
        
        if (uniqueProducts.length === 0) return null;
        
        return {
          ...group,
          products: uniqueProducts,
        };
      })
      .filter((group): group is NonNullable<typeof group> => group !== null);
    
    const seenProductIds = new Set<string>();
    const finalGroups = cleanedGroups.map(group => {
      const filteredProducts = group.products.filter(product => {
        if (seenProductIds.has(product.productId)) {
          return false;
        }
        seenProductIds.add(product.productId);
        return true;
      });
      
      if (filteredProducts.length === 0) return null;
      
      return {
        ...group,
        products: filteredProducts,
      };
    }).filter((group): group is NonNullable<typeof group> => group !== null);
    
    return finalGroups;
  }, [globalSearchData, debouncedSearchQuery]);

  // Prefetch first 3 categories
  useEffect(() => {
    if (catalogCategories && catalogCategories.length > 0) {
      const firstThreeCategories = catalogCategories.slice(0, 3);
      firstThreeCategories.forEach(category => {
        prefetchSubCategories(category.categoryId);
      });
    }
  }, [catalogCategories, prefetchSubCategories]);

  // Reset to root
  const resetToRoot = useCallback(() => {
    setBreadcrumbItems([]);
    setSelectedCategoryId(undefined);
    setSelectedSubCategory(undefined);
    setSelectedProductGroup(undefined);
    setCurrentView('categories');
  }, [setSelectedSubCategory, setSelectedProductGroup, setCurrentView]);

  // Handlers
  const handleCategoryPress = (category: { id: string; name: string; image: any }) => {
    setSelectedCategoryId(category.id);
    setSelectedSubCategory(undefined);
    setSelectedProductGroup(undefined);

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
    const currentCategory = breadcrumbItems.find(item => item.type === 'category');
    const fallbackCategory = currentCategories.find(cat => cat.id === subCategory.categoryId) || null;
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
    
    setSelectedSubCategory(subCategory.id);
    setSelectedProductGroup(undefined);
    setSelectedProduct(undefined);
    
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
    setSelectedProductGroup(productGroup.id);
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
    // Navigate back to returnScreen with selected product
    if (returnScreen === 'EventCreatePost') {
      // Navigate back to EventCreatePost with selected product
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
                      eventId,
                      eventType: eventType as EventType | undefined,
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
    } else if (returnScreen === 'CreateExperiencePostScreen') {
      // Katalogdan ürün seçildi → fromInventory: false (envanterden değil)
      // I Owned: önce envantere eklenir sonra post; I Tried: sadece post
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'CreateExperiencePostScreen',
        params: {
          product: {
            id: product.id,
            name: product.name,
            image: product.image,
            description: product.description || '',
          },
          fromInventory: false,
          experienceOption: experienceOption || 'own',
        },
      });
    } else if (returnScreen === 'CreateBenchmarkPostScreen') {
      // Navigate back to CreateBenchmarkPostScreen with selected product (benchmark ikinci ürün)
      const nameParts = product.name.split(' ');
      const brand = nameParts.length > 1 ? nameParts[0] : undefined;
      const productName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : product.name;
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'CreateBenchmarkPostScreen',
        params: {
          product: initialProduct,
          selectedProduct: {
            id: product.id,
            name: productName,
            brand,
            description: product.description || '',
            image: product.image,
          },
          selectedProductField: selectedProductField || 'selectedProduct2',
        },
      });
    } else {
      // Fallback: use navigationService
      navigationService.navigate(ROOT_ROUTES.EVENT, {
        screen: 'EventCreatePost',
        params: {
          eventId,
          eventType: eventType as EventType | undefined,
          selectedProduct: {
            id: product.id,
            name: product.name,
            image: product.image,
            description: product.description || '',
          },
        },
      });
    }
  };

  const handleBreadcrumbPress = (item: BreadcrumbItem, index: number) => {
    if (item.type === 'root' || index === -1) {
      resetToRoot();
      return;
    }

    if (item.type === 'category') {
      setBreadcrumbItems([item]);
      setSelectedCategoryId(item.id);
      setSelectedSubCategory(undefined);
      setSelectedProductGroup(undefined);
      setSelectedProduct(undefined);
      setCurrentView('subcategories');
      return;
    }

    if (item.type === 'subCategory') {
      const categoryItem = breadcrumbItems.find(breadcrumb => breadcrumb.type === 'category');
      const updated = [categoryItem, item].filter(Boolean) as BreadcrumbItem[];
      setBreadcrumbItems(updated);
      setSelectedCategoryId(categoryItem?.id);
      setSelectedSubCategory(item.id);
      setSelectedProductGroup(undefined);
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
      setSelectedSubCategory(subCategoryItem?.id);
      setSelectedProductGroup(item.id);
      setSelectedProduct(undefined);
      setCurrentView('products');
      return;
    }
  };

  // Get current data
  const getCurrentData = () => {
    if (hasGlobalSearch) {
      return null;
    }
    
    const data = (() => {
      switch (currentView) {
        case 'categories':
          return currentCategories.filter(category =>
            category.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        case 'subcategories':
          return currentSubCategories.filter(subCategory =>
            subCategory.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
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
  const backgroundColor = useMemo(() => isDark ? '$backgroundDark950' : '#FFFFFF', [isDark]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Box flex={1} bg={backgroundColor}>
        <Header
          title={t('productSelect.title')}
          leftAction="back"
        />

        {/* Search Bar */}
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
                placeholder={t('productSelect.searchPlaceholder')}
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

        {/* Content */}
        <ScrollView 
          flex={1} 
          px="$4"
          onScroll={(event) => {
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
          <VStack space="md" pt="$4" pb={52}>
            {/* Global Search Results */}
            {hasGlobalSearch ? (
              isLoadingGlobalSearch ? (
                <ProductSkeleton count={9} />
              ) : globalSearchResults.length === 0 ? (
                <Box py="$8" alignItems="center">
                  <Text color={isDark ? '#999' : '#666'} fontSize="$sm">
                    {t('productSelect.noSearchResults')}
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
                              
                              const productImage = product.image && product.image.trim() !== '' 
                                ? product.image 
                                : undefined;
                              
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
                                    
                                    setBreadcrumbItems([
                                      categoryBreadcrumb,
                                      subCategoryBreadcrumb,
                                      productGroupBreadcrumb,
                                    ]);
                                    
                                    setSelectedCategoryId(group.categoryId);
                                    setSelectedSubCategory(group.subCategoryId);
                                    setSelectedProductGroup(group.productGroupId);
                                    setCurrentView('products');
                                    
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
                    {Array.from({ length: Math.ceil(currentData.length / (currentView === 'categories' ? 2 : 3)) }).map((_, rowIndex) => {
                      const itemsPerRow = currentView === 'categories' ? 2 : 3;
                      const startIndex = rowIndex * itemsPerRow;
                      const rowItems = currentData.slice(startIndex, startIndex + itemsPerRow);
                      const priority = rowIndex < 3 ? 'high' : 'low';
                      
                      return (
                        <HStack key={`row-${rowIndex}`} space="md">
                          {Array.from({ length: itemsPerRow }).map((_, colIndex) => {
                            const currentItem = rowItems[colIndex];
                            
                            if (!currentItem) {
                              return <Box key={colIndex} flex={1} />;
                            }
                            
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
    </SafeAreaView>
  );
};
