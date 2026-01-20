import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Text, ScrollView, Pressable, HStack, VStack, Input, InputField } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation';
import { Search } from 'lucide-react-native';
import { BrandCard } from '../components/BrandCard';
import CategoryCard from '../components/CategoryCard';
import { Header } from '@/src/components/Header';
import { useBrandCategories, useBrandsByCategory } from '../api/hooks';
import type { BrandCategory, BrandListItem } from '../types';
import type { CategoryCardCategory } from '../components/CategoryCard';
import type { BrandCardBrand } from '../components/BrandCard';
import Breadcrumb from '@/src/components/Breadcrumb';
import { BreadcrumbItem } from '@/src/types/breadcrumb';
import { toImageSource } from '@/src/utils';

type BrandScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'CatalogScreen'>;

interface BrandScreenProps {
  selectedCategory: any;
  onCategorySelect: (category: any) => void;
  scrollViewPaddingBottom?: number;
  onScroll?: (event: any) => void;
  showHeader?: boolean;
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
  initialCategoryId,
  initialStep,
  initialBreadcrumbItems,
  onStateChange,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<BrandScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentStep, setCurrentStep] = useState<'categories' | 'brands'>(initialStep || 'categories');
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>(initialBreadcrumbItems || []);
  
  // Initial state'i restore et (sadece ilk render'da)
  useEffect(() => {
    if (initialStep) {
      setCurrentStep(initialStep);
    } else if (initialCategoryId) {
      // Initial category ID varsa brands step'ine geç
      setCurrentStep('brands');
    }
    if (initialBreadcrumbItems && initialBreadcrumbItems.length > 0) {
      setBreadcrumbItems(initialBreadcrumbItems);
    }
  }, []); // Sadece mount'ta çalış
  
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

  const { data: brandCategories, isLoading: isCategoriesLoading, error: categoriesError } = useBrandCategories();
  // Initial category ID varsa onu kullan, yoksa selectedCategory'dan al
  const activeCategoryId = initialCategoryId || (currentStep === 'brands' ? selectedCategory?.id : undefined);
  const { data: brandsByCategory, isLoading: isBrandsLoading, error: brandsError } = useBrandsByCategory(
    activeCategoryId
  );

  // Debug: API response'u kontrol et
  useEffect(() => {
    if (brandsByCategory) {
      console.log('[BrandScreen] Brands By Category Data:', JSON.stringify(brandsByCategory, null, 2));
      console.log('[BrandScreen] Brands Count:', brandsByCategory.length);
      if (brandsByCategory.length > 0) {
        console.log('[BrandScreen] First Brand Item:', JSON.stringify(brandsByCategory[0], null, 2));
      }
    }
    if (brandsError) {
      console.error('[BrandScreen] Brands Error:', brandsError);
    }
  }, [brandsByCategory, brandsError]);

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

  const handleBrandPress = (brand: BrandCardBrand) => {
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

    navigation.navigate('BrandDetailScreen', { brandId: brand.id });
  };

  const mapBrandCategoryToCardCategory = (category: BrandCategory): CategoryCardCategory => {
    return {
      id: category.categoryId,
      name: category.name,
      // CategoryCard component'i toImageSource kullanıyor, bu yüzden direkt string geçiyoruz
      image: category.image || require('@/assets/inventory/product_01.png'),
    };
  };

  const mapBrandListItemToBrandCardBrand = (brand: BrandListItem): BrandCardBrand => {
    // brandId veya id alanını kullan, yoksa categoryId-name kombinasyonu kullan
    const brandId = brand.brandId || brand.id || `${brand.categoryId}-${brand.name}`;
    
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
      followers: '',
      logo: toImageSource(brand.image) || require('@/assets/avatar/default-useravatar.png'),
      bannerImage: require('@/assets/events/banner.png'),
      isJoined: false,
    };
  };

  const getCurrentData = () => {
    if (currentStep === 'categories') {
      const categories = (brandCategories || []).map(mapBrandCategoryToCardCategory);
      return categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      const brands = (brandsByCategory || []).map((brand) => mapBrandListItemToBrandCardBrand(brand));
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
          title={currentStep === 'categories' ? 'Select Category' : 'Select Brand'}
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
      )}

      {/* Breadcrumb */}
      <Breadcrumb
        items={breadcrumbItems}
        onItemPress={handleBreadcrumbPress}
        rootLabel="All Brand Categories"
      />

      {/* Header Info (subtitle under header) */}
      <Box px="$4" py="$3">
        <VStack space="xs">
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize={14}
            fontWeight="$bold"
          >
            {currentStep === 'categories' ? 'Select Category' : 'Select Brand'}
          </Text>
          <Text
            color={isDark ? '#FFFFFF' : '#B9B9B9'}
            fontSize={9}
            fontWeight="$medium"
          >
            {currentStep === 'categories' 
              ? 'Choose a category to see available brands.'
              : `You will select a brand from the ${selectedCategory?.name || 'selected'} category.`
            }
          </Text>
        </VStack>
      </Box>

      {/* Loading State */}
      {currentStep === 'brands' && isBrandsLoading && (
        <Box flex={1} justifyContent="center" alignItems="center" py="$8">
          <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize="$sm">Loading...</Text>
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

      {/* Empty State */}
      {currentStep === 'brands' && !isBrandsLoading && !brandsError && currentData.length === 0 && (
        <Box flex={1} justifyContent="center" alignItems="center" px="$4" py="$8">
          <Text color={isDark ? '#FFFFFF' : '#9D9D9D'} fontSize="$sm" textAlign="center">
            No brands found in this category yet
          </Text>
        </Box>
      )}

      {/* Dynamic Grid */}
      {currentData.length > 0 && (
        <ScrollView 
          flex={1} 
          px="$4" 
          pb={scrollViewPaddingBottom}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <VStack space="md">
            {currentData.map((item, index) => (
              <HStack key={`row-${index}`} space="md" justifyContent="space-between">
                {[0, 1, 2].map((colIndex) => {
                  const itemIndex = index * 3 + colIndex;
                  const currentItem = currentData[itemIndex];
                  
                  if (!currentItem) {
                    return <Box key={`empty-${index}-${colIndex}`} flex={1} />;
                  }
                  
                  if (currentStep === 'categories') {
                    return (
                      <CategoryCard
                        key={`category-${currentItem.id}-${index}-${colIndex}`}
                        category={currentItem as CategoryCardCategory}
                        onPress={() => handleCategoryPress(currentItem as CategoryCardCategory)}
                      />
                    );
                  } else {
                    return (
                      <BrandCard
                        key={`brand-${currentItem.id}-${index}-${colIndex}`}
                        brand={currentItem as BrandCardBrand}
                        onPress={() => handleBrandPress(currentItem as BrandCardBrand)}
                      />
                    );
                  }
                })}
              </HStack>
            ))}
          </VStack>
        </ScrollView>
      )}
    </Box>
  );
};
