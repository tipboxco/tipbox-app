import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Box, Text, ScrollView, Pressable, HStack, VStack, Input, InputField } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Search } from 'lucide-react-native';
import { BreadcrumbItem } from '@/src/types/breadcrumb';
import CategoryCard from '../components/CategoryCard';
import Breadcrumb from '@/src/components/Breadcrumb';
import ActionButtons from '../components/ActionButtons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CatalogStackParamList } from '../navigation';
import { RootStackParamList } from '@/src/navigation/navigation.types';
import { useCatalogCategories, useCatalogSubCategories, useCatalogProductGroups, useCatalogProducts } from '../api/hooks';
import type { CatalogCategory, CatalogSubCategory, CatalogProductGroup, CatalogProduct } from '../types';

type ProductCatalogScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList & RootStackParamList> & {
  navigate: (name: any, params?: any) => void;
};

interface ProductCatalogScreenProps {
  onCreatePost?: () => void;
  onStateChange?: (data: {
    selectedProduct: any | null;
    currentView: 'categories' | 'subcategories' | 'productgroups' | 'products';
  }) => void;
  scrollViewPaddingBottom?: number;
}

export const ProductCatalogScreen: React.FC<ProductCatalogScreenProps> = ({ onCreatePost, onStateChange, scrollViewPaddingBottom = 52 }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<ProductCatalogScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([]);
  
  // Seçili kategori ID'si (subcategories çekmek için)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  
  // Seçili alt kategori ID'si (product groups çekmek için)
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | undefined>(undefined);
  
  // Seçili ürün grubu ID'si (products çekmek için)
  const [selectedProductGroupId, setSelectedProductGroupId] = useState<string | undefined>(undefined);
  
  // API'den kategorileri getir
  const { data: catalogCategories, isLoading, isError } = useCatalogCategories();
  
  // API'den seçili kategoriye ait subcategories'i getir
  const { data: catalogSubCategories } = useCatalogSubCategories(selectedCategoryId);
  
  // API'den seçili alt kategoriye ait product groups'u getir
  const { data: catalogProductGroups } = useCatalogProductGroups(selectedSubCategoryId);
  
  // API'den seçili ürün grubuna ait products'ı getir
  const { data: catalogProducts } = useCatalogProducts(selectedProductGroupId);
  
  // API'den gelen kategorileri Category formatına dönüştür
  const currentCategories = catalogCategories?.map(cat => ({
    id: cat.categoryId,
    name: cat.name,
    icon: 'folder',
    image: { uri: cat.image }, // API'den string olarak geliyor, URI formatına çevir
    subCategories: [] // API'den subCategories gelmiyor, boş array
  })) || [];
  
  // API'den gelen subcategories'i formatla
  const currentSubCategories = catalogSubCategories?.map(subCat => ({
    id: subCat.subCategoryId,
    name: subCat.name,
    image: { uri: subCat.image },
    categoryId: subCat.categoryId,
    productGroups: [] // API'den productGroups gelmiyor, boş array
  })) || [];
  
  // API'den gelen product groups'u formatla
  const currentProductGroups = catalogProductGroups?.map(productGroup => ({
    id: productGroup.productGroupId,
    name: productGroup.name,
    image: { uri: productGroup.image },
    subCategoryId: productGroup.subCategoryId,
    products: [] // API'den products gelmiyor, boş array
  })) || [];
  
  // API'den gelen products'ı formatla
  const currentProducts = catalogProducts?.map(product => ({
    id: product.productId,
    name: product.name,
    image: { uri: product.image },
    productGroupId: product.productGroupId,
    subCategoryId: product.subCategoryId,
    description: '', // API'den description gelmiyor
  })) || [];
  const [currentView, setCurrentView] = useState<'categories' | 'subcategories' | 'productgroups' | 'products'>('categories');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // State değişikliklerini parent'a bildir
  useEffect(() => {
    onStateChange?.({
      selectedProduct,
      currentView,
    });
  }, [selectedProduct, currentView, onStateChange]);

  const resetToRoot = useCallback(() => {
    setBreadcrumbItems([]);
    setSelectedCategoryId(undefined);
    setSelectedSubCategoryId(undefined);
    setSelectedProductGroupId(undefined);
    setSelectedProduct(null);
    setCurrentView('categories');
  }, []);

  const handleCategoryPress = (category: { id: string; name: string; image: any }) => {
    console.log('📂 [Catalog] Category seçildi:', {
      categoryId: category.id,
      categoryName: category.name,
    });
    
    // Seçili kategori ID'sini set et (subcategories API çağrısı için)
    setSelectedCategoryId(category.id);
    setSelectedSubCategoryId(undefined); // Subcategory'yi temizle
    setSelectedProductGroupId(undefined); // ProductGroup'u temizle
    setSelectedProduct(null);

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
    console.log('📁 [Catalog] SubCategory seçildi:', {
      subCategoryId: subCategory.id,
      subCategoryName: subCategory.name,
      categoryId: subCategory.categoryId,
    });
    
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
    setSelectedProduct(null);

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
    console.log('📦 [Catalog] ProductGroup seçildi:', {
      productGroupId: productGroup.id,
      productGroupName: productGroup.name,
      subCategoryId: productGroup.subCategoryId,
    });
    
    // Seçili ürün grubu ID'sini set et (products API çağrısı için)
    setSelectedProductGroupId(productGroup.id);
    setSelectedProduct(null);

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
    console.log('🛍️ [Catalog] Product seçildi:', {
      productId: product.id,
      productName: product.name,
      productGroupId: product.productGroupId,
      subCategoryId: product.subCategoryId,
    });
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
    setSelectedProduct(product);
    
    navigation.navigate('Post', {
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
      },
    });
    
    // Log to console
    console.log('Selected Product:', product.name);
    console.log('Updated Breadcrumb Items:', [
      currentCategory?.name,
      currentSubCategory?.name,
      currentProductGroup?.name,
      productBreadcrumbItem.name,
    ]);
  };

  const handleBreadcrumbPress = (item: BreadcrumbItem, index: number) => {
    if (item.type === 'root' || index === -1) {
      console.log('🏠 [Catalog] All Categories seçildi - Tüm seçimler temizlendi');
      resetToRoot();
      return;
    }

    if (item.type === 'category') {
      console.log('📂 [Catalog] Breadcrumb - Category seçildi:', {
        categoryId: item.id,
        categoryName: item.name,
      });
      setBreadcrumbItems([item]);
      setSelectedCategoryId(item.id);
      setSelectedSubCategoryId(undefined);
      setSelectedProductGroupId(undefined);
      setSelectedProduct(null);
      setCurrentView('subcategories');
      return;
    }

    if (item.type === 'subCategory') {
      console.log('📁 [Catalog] Breadcrumb - SubCategory seçildi:', {
        subCategoryId: item.id,
        subCategoryName: item.name,
      });
      const categoryItem = breadcrumbItems.find(breadcrumb => breadcrumb.type === 'category');
      const updated = [categoryItem, item].filter(Boolean) as BreadcrumbItem[];
      setBreadcrumbItems(updated);
      setSelectedCategoryId(categoryItem?.id);
      setSelectedSubCategoryId(item.id);
      setSelectedProductGroupId(undefined);
      setSelectedProduct(null);
      setCurrentView('productgroups');
      return;
    }

    if (item.type === 'productGroup') {
      console.log('📦 [Catalog] Breadcrumb - ProductGroup seçildi:', {
        productGroupId: item.id,
        productGroupName: item.name,
      });
      const categoryItem = breadcrumbItems.find(breadcrumb => breadcrumb.type === 'category');
      const subCategoryItem = breadcrumbItems.find(breadcrumb => breadcrumb.type === 'subCategory');
      const updated = [categoryItem, subCategoryItem, item].filter(Boolean) as BreadcrumbItem[];
      setBreadcrumbItems(updated);
      setSelectedCategoryId(categoryItem?.id);
      setSelectedSubCategoryId(subCategoryItem?.id);
      setSelectedProductGroupId(item.id);
      setSelectedProduct(null);
      setCurrentView('products');
      return;
    }

    if (item.type === 'product') {
      console.log('🛍️ [Catalog] Breadcrumb - Product seçildi:', {
        productId: item.id,
        productName: item.name,
      });
      const categoryItem = breadcrumbItems.find(breadcrumb => breadcrumb.type === 'category');
      const subCategoryItem = breadcrumbItems.find(breadcrumb => breadcrumb.type === 'subCategory');
      const productGroupItem = breadcrumbItems.find(breadcrumb => breadcrumb.type === 'productGroup');
      const updated = [categoryItem, subCategoryItem, productGroupItem, item].filter(Boolean) as BreadcrumbItem[];
      setBreadcrumbItems(updated);
      setSelectedCategoryId(categoryItem?.id);
      setSelectedSubCategoryId(subCategoryItem?.id);
      setSelectedProductGroupId(productGroupItem?.id);
      setSelectedProduct(item.data || null);
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
      const product = currentProducts.find(p => p.id === productItem.id);
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
      // TODO: Implement when subcategories and product groups API is available
      // productInfo will be set when API endpoints are available
    } else if (subCategoryItem && categoryItem) {
      // SubCategory selected (with Category) - title=Category, subName=SubCategory
      stage = 'SubCategories';
      name = subCategoryItem.name;
      // TODO: Implement when subcategories API is available
      // productInfo will be set when API endpoints are available
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

    // Navigate to PostsScreen with parameters (productInfo is required)
    if (productInfo) {
      navigation.navigate('Post', {
        screen: 'PostsScreen',
        params: {
          stage,
          name,
          productInfo,
        },
      });
    }
  };

  const handleCreatePost = () => {
    onCreatePost?.();
  };

  const getCurrentData = () => {
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
        return currentProducts.filter(product =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      default:
        return [];
    }
  };

  const currentData = getCurrentData();

  return (
    <Box flex={1}>

      {/* Breadcrumb */}
      <Breadcrumb
        items={breadcrumbItems}
        onItemPress={handleBreadcrumbPress}
        rootLabel="All Categories"
      />

      {/* Action Buttons - Show for productgroups and products (after subcategory is selected) */}
      {(currentView === 'productgroups' || currentView === 'products') && (
        <ActionButtons
          onShowPosts={handleShowPosts}
          onCreatePost={handleCreatePost}
        />
      )}

      {/* Dynamic Grid */}
      <ScrollView flex={1} px="$4">
        <VStack space="md" pb={scrollViewPaddingBottom}>
          {/* currentData'yı 3'lü gruplara böl */}
          {Array.from({ length: Math.ceil(currentData.length / 3) }).map((_, rowIndex) => {
            const startIndex = rowIndex * 3;
            const rowItems = currentData.slice(startIndex, startIndex + 3);
            
            return (
              <HStack key={`row-${rowIndex}`} space="md" justifyContent="space-between">
                {[0, 1, 2].map((colIndex) => {
                  const currentItem = rowItems[colIndex];
                  
                  if (!currentItem) {
                    return <Box key={colIndex} flex={1} />;
                  }
                  
                  // Render different components based on current view
                  if (currentView === 'categories') {
                    return (
                      <CategoryCard
                        key={currentItem.id}
                        category={currentItem as any}
                        onPress={handleCategoryPress}
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
                      />
                    );
                  }
                  
                  return null;
                })}
              </HStack>
            );
          })}
        </VStack>
      </ScrollView>
    </Box>
  );
};
