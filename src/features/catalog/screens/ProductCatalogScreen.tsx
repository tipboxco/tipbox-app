import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Box, Text, ScrollView, Pressable, HStack, VStack, Input, InputField } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Search } from 'lucide-react-native';
import { BreadcrumbItem } from '@/src/mock/catalog/productCatalog/types';
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
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([
    { id: 'root', name: 'Categories', type: 'category' }
  ]);
  
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

  const handleCategoryPress = (category: { id: string; name: string; image: any }) => {
    console.log('📂 [Catalog] Category seçildi:', {
      categoryId: category.id,
      categoryName: category.name,
    });
    
    const newBreadcrumbItem: BreadcrumbItem = {
      id: category.id,
      name: category.name,
      type: 'category'
    };
    
    const subCategoriesBreadcrumb: BreadcrumbItem = {
      id: 'subcategories',
      name: 'Sub Categories',
      type: 'subCategory'
    };
    
    // Seçili kategori ID'sini set et (subcategories API çağrısı için)
    setSelectedCategoryId(category.id);
    setSelectedSubCategoryId(undefined); // Subcategory'yi temizle
    setSelectedProductGroupId(undefined); // ProductGroup'u temizle
    
    setBreadcrumbItems([newBreadcrumbItem, subCategoriesBreadcrumb]);
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
    
    const newBreadcrumbItem: BreadcrumbItem = {
      id: subCategory.id,
      name: subCategory.name,
      type: 'subCategory'
    };
    
    const productGroupsBreadcrumb: BreadcrumbItem = {
      id: 'productgroups',
      name: 'Product Groups',
      type: 'productGroup'
    };
    
    // Seçili alt kategori ID'sini set et (product groups API çağrısı için)
    setSelectedSubCategoryId(subCategory.id);
    setSelectedProductGroupId(undefined); // ProductGroup'u temizle
    
    setBreadcrumbItems([currentCategory!, newBreadcrumbItem, productGroupsBreadcrumb]);
    setCurrentView('productgroups');
  };

  const handleProductGroupPress = (productGroup: CatalogProductGroup & { id: string; image: any }) => {
    console.log('📦 [Catalog] ProductGroup seçildi:', {
      productGroupId: productGroup.id,
      productGroupName: productGroup.name,
      subCategoryId: productGroup.subCategoryId,
    });
    
    // Get the current category and subcategory from breadcrumb
    const currentCategory = breadcrumbItems.find(item => item.type === 'category');
    const currentSubCategory = breadcrumbItems.find(item => item.type === 'subCategory');
    
    const newBreadcrumbItem: BreadcrumbItem = {
      id: productGroup.id,
      name: productGroup.name,
      type: 'productGroup'
    };
    
    const productsBreadcrumb: BreadcrumbItem = {
      id: 'products',
      name: 'Products',
      type: 'product'
    };
    
    // Seçili ürün grubu ID'sini set et (products API çağrısı için)
    setSelectedProductGroupId(productGroup.id);
    
    setBreadcrumbItems([currentCategory!, currentSubCategory!, newBreadcrumbItem, productsBreadcrumb]);
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
    const currentProductGroup = breadcrumbItems.find(item => item.type === 'productGroup' && item.id !== 'products');
    
    // Create product breadcrumb item
    const productBreadcrumbItem: BreadcrumbItem = {
      id: product.id,
      name: product.name,
      type: 'product'
    };
    
    // Update breadcrumb items - remove 'Products' placeholder and add actual product name
    const updatedBreadcrumbs: BreadcrumbItem[] = [];
    if (currentCategory) updatedBreadcrumbs.push(currentCategory);
    if (currentSubCategory) updatedBreadcrumbs.push(currentSubCategory);
    if (currentProductGroup) updatedBreadcrumbs.push(currentProductGroup);
    updatedBreadcrumbs.push(productBreadcrumbItem);
    
    setBreadcrumbItems(updatedBreadcrumbs);
    
    // Store selected product for CreatePostBottomSheet
    setSelectedProduct(product);
    
    // Navigate to PostsScreen with product information
    // Find product group from breadcrumb
    // Note: Product groups API endpoint not available yet
    const productGroupItem = breadcrumbItems.find(item => item.type === 'productGroup' && item.id !== 'productgroups');
    let productGroup: { name: string } | null = null;
    // TODO: Implement when product groups API is available
    
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
    console.log('Updated Breadcrumb Items:', updatedBreadcrumbs);
  };

  const handleBreadcrumbPress = (item: BreadcrumbItem, index: number) => {
    // Navigate back based on breadcrumb item
    if (item.type === 'category' && item.id === 'root') {
      // Reset to categories view
      console.log('🏠 [Catalog] Root\'a dönüldü - Tüm seçimler temizlendi');
      setBreadcrumbItems([{ id: 'root', name: 'Categories', type: 'category' }]);
      setSelectedCategoryId(undefined); // Root'a dönüldüğünde selectedCategoryId'yi temizle
      setSelectedSubCategoryId(undefined); // Root'a dönüldüğünde selectedSubCategoryId'yi temizle
      setSelectedProductGroupId(undefined); // Root'a dönüldüğünde selectedProductGroupId'yi temizle
      setCurrentView('categories');
    } else if (item.type === 'category') {
      // Go back to subcategories of this category
      const category = currentCategories.find(cat => cat.id === item.id);
      if (category) {
        console.log('📂 [Catalog] Breadcrumb - Category seçildi:', {
          categoryId: category.id,
          categoryName: category.name,
        });
        
        // Seçili kategori ID'sini set et (subcategories API çağrısı için)
        setSelectedCategoryId(category.id);
        setSelectedSubCategoryId(undefined); // Subcategory'yi temizle
        setSelectedProductGroupId(undefined); // ProductGroup'u temizle
        
        setBreadcrumbItems([
          { id: category.id, name: category.name, type: 'category' },
          { id: 'subcategories', name: 'Sub Categories', type: 'subCategory' }
        ]);
        setCurrentView('subcategories');
      }
    } else if (item.type === 'subCategory' && item.id === 'subcategories') {
      // Stay in subcategories view
      setCurrentView('subcategories');
    } else if (item.type === 'subCategory') {
      // Go back to product groups of this subcategory
      const subCategory = currentSubCategories.find(sub => sub.id === item.id);
      if (subCategory) {
        console.log('📁 [Catalog] Breadcrumb - SubCategory seçildi:', {
          subCategoryId: subCategory.id,
          subCategoryName: subCategory.name,
          categoryId: subCategory.categoryId,
        });
        
        // Seçili alt kategori ID'sini set et (product groups API çağrısı için)
        setSelectedSubCategoryId(subCategory.id);
        setSelectedProductGroupId(undefined); // ProductGroup'u temizle
        
        const currentCategory = breadcrumbItems.find(breadcrumb => breadcrumb.type === 'category');
        setBreadcrumbItems([
          currentCategory!,
          { id: subCategory.id, name: subCategory.name, type: 'subCategory' },
          { id: 'productgroups', name: 'Product Groups', type: 'productGroup' }
        ]);
        setCurrentView('productgroups');
      }
    } else if (item.type === 'productGroup' && item.id === 'productgroups') {
      // Stay in product groups view
      setCurrentView('productgroups');
    } else if (item.type === 'productGroup') {
      // Go back to products of this product group
      const productGroup = currentProductGroups.find(group => group.id === item.id);
      if (productGroup) {
        const currentCategory = breadcrumbItems.find(breadcrumb => breadcrumb.type === 'category');
        const currentSubCategory = breadcrumbItems.find(breadcrumb => breadcrumb.type === 'subCategory');
        console.log('📦 [Catalog] Breadcrumb - ProductGroup seçildi:', {
          productGroupId: productGroup.id,
          productGroupName: productGroup.name,
        });
        
        // Seçili ürün grubu ID'sini set et (products API çağrısı için)
        setSelectedProductGroupId(productGroup.id);
        
        setBreadcrumbItems([
          currentCategory!,
          currentSubCategory!,
          { id: productGroup.id, name: productGroup.name, type: 'productGroup' },
          { id: 'products', name: 'Products', type: 'product' }
        ]);
        setCurrentView('products');
      }
    } else if (item.type === 'product' && item.id === 'products') {
      // Stay in products view
      setCurrentView('products');
    } else if (item.type === 'product') {
      // Product selected - stay in products view but show selected product in breadcrumb
      // This case is already handled by handleProductPress, but we keep this for breadcrumb navigation
      setCurrentView('products');
      console.log('Product breadcrumb clicked:', item.name);
    }
  };

  const handleShowPosts = () => {
    // Determine current stage and name from breadcrumbItems (prioritize most specific item)
    let stage: 'SubCategories' | 'ProductGroup' | 'Product' = 'SubCategories';
    let name = 'Subcategory Feed';
    let productInfo: { image: any; title: string; subName?: string } | null = null;

    // Priority: Product > ProductGroup > SubCategory > Category
    const productItem = breadcrumbItems.find(item => item.type === 'product' && item.id !== 'products');
    const productGroupItem = breadcrumbItems.find(item => item.type === 'productGroup' && item.id !== 'productgroups');
    const subCategoryItem = breadcrumbItems.find(item => item.type === 'subCategory' && item.id !== 'subcategories');
    const categoryItem = breadcrumbItems.find(item => item.type === 'category' && item.id !== 'root');

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
