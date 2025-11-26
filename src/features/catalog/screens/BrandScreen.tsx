import React, { useState } from 'react';
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

type BrandScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'CatalogScreen'>;

interface BrandScreenProps {
  selectedCategory: any;
  onCategorySelect: (category: any) => void;
  scrollViewPaddingBottom?: number;
  onScroll?: (event: any) => void;
  showHeader?: boolean;
}

export const BrandScreen: React.FC<BrandScreenProps> = ({
  selectedCategory,
  onCategorySelect,
  scrollViewPaddingBottom = 52,
  onScroll,
  showHeader = true,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<BrandScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentStep, setCurrentStep] = useState<'categories' | 'brands'>('categories');
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([]);

  const { data: brandCategories, isLoading: isCategoriesLoading, error: categoriesError } = useBrandCategories();
  const { data: brandsByCategory, isLoading: isBrandsLoading, error: brandsError } = useBrandsByCategory(
    currentStep === 'brands' ? selectedCategory?.id : undefined
  );

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
      image: category.image ? { uri: category.image } : require('@/assets/inventory/product_01.png'),
    };
  };

  const mapBrandListItemToBrandCardBrand = (brand: BrandListItem, index: number): BrandCardBrand => {
    return {
      id: `${brand.categoryId}-${brand.name}-${index}`,
      name: brand.name,
      followers: '',
      logo: brand.image ? { uri: brand.image } : require('@/assets/avatar/ozan.png'),
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
      const brands = (brandsByCategory || []).map(mapBrandListItemToBrandCardBrand);
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

      {/* Dynamic Grid */}
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
    </Box>
  );
};
