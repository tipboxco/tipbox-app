import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Text, ScrollView, Pressable, HStack, VStack, Input, InputField, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation';
import { Search } from 'lucide-react-native';
import { BrandCard } from '../components/BrandCard';
import CategoryCard from '../components/CategoryCard';
import { Header } from '@/src/components/Header';
import { useBrandCategories, useBrandsByCategory, useGlobalBrandSearch } from '../api/hooks';
import type { BrandCategory, BrandListItem, BrandCardModel } from '../types';
import type { CategoryCardCategory } from '../components/CategoryCard';
import Breadcrumb from '@/src/components/Breadcrumb';
import { BreadcrumbItem } from '@/src/types/breadcrumb';
import { toImageSource } from '@/src/utils';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { useTranslation } from '@/src/hooks/useTranslation';

type BrandScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'CatalogScreen'>;

interface BrandScreenProps {
  selectedCategory?: any | null; // CRITICAL FIX: Made optional and nullable to prevent crashes
  onCategorySelect: (category: any) => void;
  scrollViewPaddingBottom?: number;
  onScroll?: (event: any) => void;
  showHeader?: boolean;
  searchQuery?: string;
  // Initial state props (from navigation store)
  initialCategoryId?: string;
  initialStep?: 'categories' | 'brands';
  initialBreadcrumbItems?: BreadcrumbItem[];
  onStateChange?: (state: {
    currentStep: 'categories' | 'brands';
    selectedCategoryId?: string;
    breadcrumbItems: BreadcrumbItem[];
  }) => void;
}

export const BrandScreen: React.FC<BrandScreenProps> = ({
  selectedCategory,
  onCategorySelect,
  scrollViewPaddingBottom = 52,
  onScroll,
  showHeader = true,
  searchQuery: externalSearchQuery,
  initialCategoryId,
  initialStep,
  initialBreadcrumbItems,
  onStateChange,
}) => {
  const { colorMode } = useColorMode();
  // PERFORMANCE FIX: Memoize isDark to prevent unnecessary re-renders
  const isDark = useMemo(() => colorMode === 'dark', [colorMode]);
  const navigation = useNavigation<BrandScreenNavigationProp>();
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const { t } = useTranslation('catalog');
  // Use external search query if provided, otherwise use internal state
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const [currentStep, setCurrentStep] = useState<'categories' | 'brands'>(initialStep || 'categories');
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>(initialBreadcrumbItems || []);

  // CRITICAL FIX: Always reset to root on screen focus
  // This ensures the screen always starts at "Brand Category" (index 0), not at a deep navigation state
  // Track if this is the initial focus to reset state
  const isInitialFocusRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      // Only reset on initial focus, not on subsequent focuses (coming back from deeper screens)
      if (isInitialFocusRef.current) {
        isInitialFocusRef.current = false;

        // Reset to root state - always start at "Brand Category"
        setBreadcrumbItems([]);
        setCurrentStep('categories');
        onCategorySelect(null); // Clear selected category
      }

      // Reset the flag when the screen is unfocused (navigating away)
      return () => {
        isInitialFocusRef.current = true;
      };
    }, [onCategorySelect])
  );
  
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
    currentStep: 'categories' | 'brands';
    selectedCategoryId?: string;
    breadcrumbItems: BreadcrumbItem[];
  } | null>(null);

  // State değişikliklerini parent'a bildir - sadece gerçekten değiştiğinde
  useEffect(() => {
    const currentState = {
      currentStep,
      selectedCategoryId: initialCategoryId || selectedCategory?.id,
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
      prev.currentStep !== currentState.currentStep ||
      prev.selectedCategoryId !== currentState.selectedCategoryId ||
      prev.breadcrumbItems.length !== currentState.breadcrumbItems.length ||
      prev.breadcrumbItems.some((item, idx) => 
        item?.id !== currentState.breadcrumbItems[idx]?.id ||
        item?.type !== currentState.breadcrumbItems[idx]?.type
      );

    if (hasChanged) {
      prevStateRef.current = currentState;
      onStateChangeRef.current?.(currentState);
    }
  }, [currentStep, breadcrumbItems, initialCategoryId, selectedCategory]);

  // Debounce search query for API calls
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Global brand search - tüm brand kategorileri arasında arama
  const hasGlobalSearch = debouncedSearchQuery && debouncedSearchQuery.length > 0;
  const { 
    data: globalBrandSearchData, 
    isLoading: isLoadingGlobalBrandSearch,
    fetchNextPage: fetchNextGlobalBrandSearchPage,
    hasNextPage: hasNextGlobalBrandSearchPage,
    isFetchingNextPage: isFetchingNextGlobalBrandSearchPage
  } = useGlobalBrandSearch(hasGlobalSearch ? debouncedSearchQuery : undefined, 20);

  const { data: brandCategories, isLoading: isCategoriesLoading, error: categoriesError } = useBrandCategories();
  // Initial category ID varsa onu kullan, yoksa selectedCategory'dan al
  // Global search aktifse category ID gönderme
  const activeCategoryId = hasGlobalSearch ? undefined : (initialCategoryId || (currentStep === 'brands' ? selectedCategory?.id : undefined));
  const {
    data: brandsByCategoryData,
    isLoading: isBrandsLoading,
    error: brandsError,
    fetchNextPage: fetchNextBrandsPage,
    hasNextPage: hasNextBrandsPage,
    isFetchingNextPage: isFetchingNextBrandsPage,
  } = useBrandsByCategory(activeCategoryId, 20);

  // Paginated response: tüm sayfalardaki items'ı birleştir
  const brandsByCategory = useMemo(() => {
    if (!brandsByCategoryData?.pages) return [];
    return brandsByCategoryData.pages.flatMap((page) => page.items);
  }, [brandsByCategoryData]);

  const handleCategoryPress = (category: CategoryCardCategory) => {
    setCurrentStep('brands');
    onCategorySelect(category);
    setBreadcrumbItems([
      {
        id: category.id,
        name: category.name,
        type: 'category',
        data: category,
      },
    ]);
  };

  const handleBrandPress = (brand: BrandCardModel) => {
    setBreadcrumbItems((prev) => {
      const categoryItem =
        prev.find((item) => item.type === 'category') ||
        (selectedCategory
          ? {
              id: selectedCategory.id,
              name: selectedCategory.name,
              type: 'category',
              data: selectedCategory,
            }
          : undefined);

      const items: BreadcrumbItem[] = [];
      if (categoryItem) {
        items.push(categoryItem);
      }
      items.push({
        id: brand.id,
        name: brand.name,
        type: 'brand',
        data: brand,
      });
      return items;
    });

    navigationService.navigate(ROOT_ROUTES.BRAND, {
      screen: 'BrandDetailScreen',
      params: { brandId: brand.id },
    });
  };

  const mapBrandCategoryToCardCategory = (category: BrandCategory): CategoryCardCategory => {
    return {
      id: category.categoryId,
      name: category.name,
      // CategoryCard component'i toImageSource kullanıyor, bu yüzden direkt string geçiyoruz
      image: category.image || require('@/assets/inventory/product_01.png'),
    };
  };

  const mapBrandListItemToBrandCardBrand = (brand: BrandListItem): BrandCardModel => {
    const brandId = brand.brandId || brand.id || (brand.categoryId ? `${brand.categoryId}-${brand.name}` : brand.name);

    // PERFORMANCE FIX: Remove console.log to prevent performance issues
    // Only log in development if needed for debugging
    if (__DEV__ && false) { // Disabled by default, enable only when debugging
      console.log('[BrandScreen] Mapping brand:', {
        original: brand,
        mappedId: brandId,
      });
    }

    return {
      id: brandId,
      name: brand.name,
      description: '', // Empty description for API catalog items (Explore shows descriptions from mock data)
      followers: '',
      logo: toImageSource(brand.image) || require('@/assets/avatar/default-useravatar.png'),
      bannerImage: require('@/assets/events/banner.png'),
      isJoined: false,
    };
  };

  // Global search sonuçlarını formatla - useMemo ile cache'le
  const globalBrandSearchResults = useMemo(() => {
    if (!globalBrandSearchData?.pages) return [];
    
    // InfiniteData yapısından tüm category'leri çıkar
    const allCategories = globalBrandSearchData.pages.flatMap((page) => page.items || []);
    
    // DEBUG: Backend'den gelen veriyi log'la
    if (__DEV__ && allCategories.length > 0) {
      console.log('[BrandScreen] 🔍 Global Brand Search Results:', {
        searchQuery: debouncedSearchQuery,
        categoriesCount: allCategories.length,
        categories: allCategories.map(cat => ({
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          brandsCount: cat.brands?.length || 0,
          brands: (cat.brands || []).map(b => ({
            brandId: b.brandId || b.id,
            name: b.name,
            image: b.image,
          })),
        })),
      });
    }
    
    // Backend'den gelen veriyi temizle ve doğrula
    const cleanedCategories = allCategories
      .map(category => {
        // CRITICAL FIX: Null check for category.brands to prevent crash
        if (!category.brands || !Array.isArray(category.brands)) {
          if (__DEV__) {
            console.warn('[BrandScreen] ⚠️ Category has no brands array:', {
              categoryId: category.categoryId,
              categoryName: category.categoryName,
              brands: category.brands,
            });
          }
          return null;
        }

        // Her category için unique brand'leri filtrele
        // Aynı brandId'ye sahip brand'leri tekilleştir
        const uniqueBrands = category.brands.reduce((acc, brand) => {
          const brandId = brand.brandId || brand.id || `${brand.categoryId}-${brand.name}`;
          if (!acc.find(b => (b.brandId || b.id || `${b.categoryId}-${b.name}`) === brandId)) {
            acc.push(brand);
          } else {
            // Duplicate brand bulundu - log'la
            if (__DEV__) {
              console.warn('[BrandScreen] ⚠️ Duplicate brand found:', {
                brandId,
                brandName: brand.name,
                categoryId: category.categoryId,
                categoryName: category.categoryName,
              });
            }
          }
          return acc;
        }, [] as BrandListItem[]);
        
        // Eğer unique brand yoksa, bu category'yi filtrele
        if (uniqueBrands.length === 0) {
          if (__DEV__) {
            console.warn('[BrandScreen] ⚠️ Empty category filtered out:', {
              categoryId: category.categoryId,
              categoryName: category.categoryName,
            });
          }
          return null;
        }
        
        return {
          ...category,
          brands: uniqueBrands,
        };
      })
      .filter((category): category is NonNullable<typeof category> => category !== null);
    
    // Tüm brand'leri brandId'ye göre unique kontrolü yap
    // Aynı brand farklı category'lerde varsa, sadece ilk görünen category'de tut
    const seenBrandIds = new Set<string>();
    const finalCategories = cleanedCategories.map(category => {
      const filteredBrands = category.brands.filter(brand => {
        const brandId = brand.brandId || brand.id || `${brand.categoryId}-${brand.name}`;
        if (seenBrandIds.has(brandId)) {
          // Bu brand başka bir category'de zaten görüldü
          if (__DEV__) {
            console.warn('[BrandScreen] ⚠️ Brand appears in multiple categories:', {
              brandId,
              brandName: brand.name,
              currentCategory: category.categoryName,
            });
          }
          return false;
        }
        seenBrandIds.add(brandId);
        return true;
      });
      
      // Eğer tüm brand'ler filtrelendiyse, bu category'yi kaldır
      if (filteredBrands.length === 0) {
        return null;
      }
      
      return {
        ...category,
        brands: filteredBrands,
      };
    }).filter((category): category is NonNullable<typeof category> => category !== null);
    
    return finalCategories;
  }, [globalBrandSearchData, debouncedSearchQuery]);

  const getCurrentData = () => {
    // Global search aktifse, global search sonuçlarını döndür
    if (hasGlobalSearch) {
      return null; // Global search için özel render mantığı kullanılacak
    }
    
    if (currentStep === 'categories') {
      const categories = (brandCategories || []).map(mapBrandCategoryToCardCategory);
      return categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      // brandsByCategory undefined veya null olabilir - Array.isArray ile kontrol et
      if (!brandsByCategory || !Array.isArray(brandsByCategory)) {
        return [];
      }
      const brands = brandsByCategory.map((brand) => mapBrandListItemToBrandCardBrand(brand));
      return brands.filter(brand =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  };

  const currentData = getCurrentData();

  const handleBreadcrumbPress = (item: BreadcrumbItem, index: number) => {
    if (item.type === 'root' || index === -1) {
      // Root -> tüm seçimleri temizle, kategori listesini göster
      setBreadcrumbItems([]);
      setCurrentStep('categories');
      return;
    }

    if (item.type === 'category') {
      // Sadece kategori breadcrumb'ını bırak, brand listesine dön
      setBreadcrumbItems([item]);
      setCurrentStep('brands');
      return;
    }

    if (item.type === 'brand') {
      // Brand breadcrumb'ına tıklanınca sadece oraya kadar olanı koru
      setBreadcrumbItems((prev) => prev.slice(0, index + 1));
      setCurrentStep('brands');
    }
  };

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      {/* Optional Header (for standalone BrandScreen usage) */}
      {showHeader && (
        <Header
          title={currentStep === 'categories' ? t('brandScreen.selectCategory') : t('brandScreen.selectBrand')}
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
      )}

      {/* Search Bar - Only show if searchQuery prop is not provided (standalone usage) */}
      {externalSearchQuery === undefined && (
        <VStack
          space="md"
          pb="$4"
          px="$4"
          bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
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
                placeholder={t('brandScreen.searchPlaceholder')}
                placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
                color={isDark ? '#000' : '#000'}
                fontSize="$xs"
                value={internalSearchQuery}
                onChangeText={setInternalSearchQuery}
              />
            </Input>
          </HStack>
        </VStack>
      )}

      {/* Breadcrumb */}
      <Breadcrumb
        items={breadcrumbItems}
        onItemPress={handleBreadcrumbPress}
        rootLabel={t('brandScreen.brandCategory')}
      />

      {/* Loading State */}
      {currentStep === 'brands' && isBrandsLoading && (
        <Box flex={1} justifyContent="center" alignItems="center" py="$8">
          <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize="$sm">{t('brandScreen.loadingBrands')}</Text>
        </Box>
      )}

      {/* Error State */}
      {currentStep === 'brands' && brandsError && (
        <Box flex={1} justifyContent="center" alignItems="center" px="$4" py="$8">
          <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
            Error: {brandsError.message}
          </Text>
        </Box>
      )}

      {/* Global Brand Search Results */}
      {hasGlobalSearch ? (
        isLoadingGlobalBrandSearch ? (
          <Box flex={1} justifyContent="center" alignItems="center" py="$8">
            <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize="$sm">{t('brandScreen.loadingBrands')}</Text>
          </Box>
        ) : globalBrandSearchResults.length === 0 ? (
          <Box flex={1} justifyContent="center" alignItems="center" px="$4" py="$8">
            <Text color={isDark ? '#999' : '#666'} fontSize="$sm" textAlign="center">
              {t('brandScreen.noSearchResults')}
            </Text>
          </Box>
        ) : (
          <ScrollView 
            flex={1} 
            px="$4" 
            pb={scrollViewPaddingBottom}
            onScroll={(event) => {
              // Global search için infinite scroll
              if (hasNextGlobalBrandSearchPage && !isFetchingNextGlobalBrandSearchPage) {
                const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                const paddingToBottom = 20;
                if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
                  fetchNextGlobalBrandSearchPage();
                }
              }
              onScroll?.(event);
            }}
            scrollEventThrottle={400}
            showsVerticalScrollIndicator={false}
          >
            <VStack space="md" pt="$4">
              {globalBrandSearchResults.map((category) => (
                <VStack key={category.categoryId} space="sm" mb="$6">
                  {/* Category Header */}
                  <HStack alignItems="center" space="sm" mb="$2">
                    {category.categoryImage && (
                      <Image
                        source={{ uri: category.categoryImage }}
                        alt={category.categoryName}
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
                        {category.categoryName}
                      </Text>
                    </VStack>
                  </HStack>
                  
                  {/* Brands Grid */}
                  {Array.from({ length: Math.ceil(category.brands.length / 3) }).map((_, rowIndex) => {
                    const itemsPerRow = 3;
                    const startIndex = rowIndex * itemsPerRow;
                    const rowItems = category.brands.slice(startIndex, startIndex + itemsPerRow);
                    
                    return (
                      <HStack key={`category-${category.categoryId}-row-${rowIndex}`} space="md" justifyContent="space-between">
                        {Array.from({ length: itemsPerRow }).map((_, colIndex) => {
                          const brand = rowItems[colIndex];
                          
                          if (!brand) {
                            return <Box key={colIndex} flex={1} />;
                          }
                          
                          const brandCard = mapBrandListItemToBrandCardBrand(brand);
                          
                          return (
                            <BrandCard
                              key={`${category.categoryId}-${brandCard.id}-${rowIndex}-${colIndex}`}
                              brand={brandCard}
                              onPress={() => {
                                // Brand'a tıklandığında breadcrumb'ı oluştur
                                const categoryBreadcrumb: BreadcrumbItem = {
                                  id: category.categoryId,
                                  name: category.categoryName,
                                  type: 'category',
                                };
                                
                                setBreadcrumbItems([categoryBreadcrumb]);
                                handleBrandPress(brandCard);
                              }}
                            />
                          );
                        })}
                      </HStack>
                    );
                  })}
                </VStack>
              ))}
              
              {/* Load More Indicator */}
              {isFetchingNextGlobalBrandSearchPage && (
                <Box py="$4" alignItems="center">
                  <Text color={isDark ? '#999' : '#666'} fontSize="$sm">{t('brandScreen.loadingMore')}</Text>
                </Box>
              )}
            </VStack>
          </ScrollView>
        )
      ) : (
        <>
          {/* Empty State */}
          {currentStep === 'brands' && !isBrandsLoading && !brandsError && currentData && currentData.length === 0 && (
            <Box flex={1} justifyContent="center" alignItems="center" px="$4" py="$8">
              <Text color={isDark ? '#FFFFFF' : '#9D9D9D'} fontSize="$sm" textAlign="center">
                {t('brandScreen.noBrands')}
              </Text>
            </Box>
          )}

          {/* Dynamic Grid */}
          {currentData && currentData.length > 0 && (
            <ScrollView 
              flex={1} 
              px="$4" 
              pb={scrollViewPaddingBottom}
              onScroll={(event) => {
                if (currentStep === 'brands' && hasNextBrandsPage && !isFetchingNextBrandsPage) {
                  const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                  const paddingToBottom = 20;
                  if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
                    fetchNextBrandsPage();
                  }
                }
                onScroll?.(event);
              }}
              scrollEventThrottle={400}
              showsVerticalScrollIndicator={false}
            >
              <VStack space="md" pt="$4">
                {Array.from({ length: Math.ceil(currentData.length / 3) }).map((_, rowIndex) => {
                  const itemsPerRow = 3;
                  const startIndex = rowIndex * itemsPerRow;
                  const rowItems = currentData.slice(startIndex, startIndex + itemsPerRow);

                  return (
                    <HStack key={`row-${rowIndex}`} space="md">
                      {Array.from({ length: itemsPerRow }).map((_, colIndex) => {
                        const currentItem = rowItems[colIndex];

                        if (!currentItem) {
                          return <Box key={`empty-${rowIndex}-${colIndex}`} flex={1} />;
                        }

                        if (currentStep === 'categories') {
                          return (
                            <CategoryCard
                              key={`category-${currentItem.id}-${rowIndex}-${colIndex}`}
                              category={currentItem as CategoryCardCategory}
                              onPress={() => handleCategoryPress(currentItem as CategoryCardCategory)}
                            />
                          );
                        } else {
                          return (
                            <BrandCard
                              key={`brand-${currentItem.id}-${rowIndex}-${colIndex}`}
                              brand={currentItem as BrandCardModel}
                              onPress={() => handleBrandPress(currentItem as BrandCardModel)}
                            />
                          );
                        }
                      })}
                    </HStack>
                  );
                })}
                {/* Load more brands (paginated) */}
                {currentStep === 'brands' && isFetchingNextBrandsPage && (
                  <Box py="$4" alignItems="center">
                    <Text color={isDark ? '#999' : '#666'} fontSize="$sm">{t('brandScreen.loadingMore')}</Text>
                  </Box>
                )}
              </VStack>
            </ScrollView>
          )}
        </>
      )}
    </Box>
  );
};
