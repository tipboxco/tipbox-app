import React, { useState } from 'react';
import { Box, Text, ScrollView, Pressable, HStack, VStack, Input, InputField } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Search } from 'lucide-react-native';
import { catalogData } from '@/src/mock/catalog/productCatalog';
import { Category, BreadcrumbItem } from '@/src/mock/catalog/productCatalog/types';
import CategoryCard from '../components/CategoryCard';
import Breadcrumb from '../components/Breadcrumb';
import ActionButtons from '../components/ActionButtons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CatalogStackParamList } from '../navigation';

type ProductCatalogScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList>;

export const ProductCatalogScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<ProductCatalogScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([
    { id: 'root', name: 'Categories', type: 'category' }
  ]);
  const [currentCategories, setCurrentCategories] = useState<Category[]>(catalogData);
  const [currentSubCategories, setCurrentSubCategories] = useState<any[]>([]);
  const [currentProductGroups, setCurrentProductGroups] = useState<any[]>([]);
  const [currentProducts, setCurrentProducts] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<'categories' | 'subcategories' | 'productgroups' | 'products'>('categories');

  const handleCategoryPress = (category: Category) => {
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
    
    setBreadcrumbItems([newBreadcrumbItem, subCategoriesBreadcrumb]);
    setCurrentSubCategories(category.subCategories);
    setCurrentView('subcategories');
  };

  const handleSubCategoryPress = (subCategory: any) => {
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
    
    setBreadcrumbItems([currentCategory!, newBreadcrumbItem, productGroupsBreadcrumb]);
    setCurrentProductGroups(subCategory.productGroups);
    setCurrentView('productgroups');
  };

  const handleProductGroupPress = (productGroup: any) => {
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
    
    setBreadcrumbItems([currentCategory!, currentSubCategory!, newBreadcrumbItem, productsBreadcrumb]);
    setCurrentProducts(productGroup.products);
    setCurrentView('products');
  };

  const handleBreadcrumbPress = (item: BreadcrumbItem, index: number) => {
    // Navigate back based on breadcrumb item
    if (item.type === 'category' && item.id === 'root') {
      // Reset to categories view
      setBreadcrumbItems([{ id: 'root', name: 'Categories', type: 'category' }]);
      setCurrentCategories(catalogData);
      setCurrentView('categories');
    } else if (item.type === 'category') {
      // Go back to subcategories of this category
      const category = catalogData.find(cat => cat.id === item.id);
      if (category) {
        setBreadcrumbItems([
          { id: category.id, name: category.name, type: 'category' },
          { id: 'subcategories', name: 'Sub Categories', type: 'subCategory' }
        ]);
        setCurrentSubCategories(category.subCategories);
        setCurrentView('subcategories');
      }
    } else if (item.type === 'subCategory' && item.id === 'subcategories') {
      // Stay in subcategories view
      setCurrentView('subcategories');
    } else if (item.type === 'subCategory') {
      // Go back to product groups of this subcategory
      const subCategory = currentSubCategories.find(sub => sub.id === item.id);
      if (subCategory) {
        const currentCategory = breadcrumbItems.find(breadcrumb => breadcrumb.type === 'category');
        setBreadcrumbItems([
          currentCategory!,
          { id: subCategory.id, name: subCategory.name, type: 'subCategory' },
          { id: 'productgroups', name: 'Product Groups', type: 'productGroup' }
        ]);
        setCurrentProductGroups(subCategory.productGroups);
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
        setBreadcrumbItems([
          currentCategory!,
          currentSubCategory!,
          { id: productGroup.id, name: productGroup.name, type: 'productGroup' },
          { id: 'products', name: 'Products', type: 'product' }
        ]);
        setCurrentProducts(productGroup.products);
        setCurrentView('products');
      }
    } else if (item.type === 'product' && item.id === 'products') {
      // Stay in products view
      setCurrentView('products');
    }
  };

  const handleShowPosts = () => {
    navigation.navigate('BrandPostListScreen');
  };

  const handleCreatePost = () => {
    console.log('Create a Post pressed');
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

      {/* Action Buttons - Show for subcategories, productgroups, and products */}
      {(currentView === 'subcategories' || currentView === 'productgroups' || currentView === 'products') && (
        <ActionButtons
          onShowPosts={handleShowPosts}
          onCreatePost={handleCreatePost}
        />
      )}

      {/* Dynamic Grid */}
      <ScrollView flex={1} px="$4">
        <VStack space="md" pb="$20">
          {currentData.map((item, index) => (
            <HStack key={item.id} space="md" justifyContent="space-between">
              {[0, 1, 2].map((colIndex) => {
                const itemIndex = index * 3 + colIndex;
                const currentItem = currentData[itemIndex];
                
                if (!currentItem) {
                  return <Box key={colIndex} flex={1} />;
                }
                
                // Render different components based on current view
                if (currentView === 'categories') {
                  return (
                    <CategoryCard
                      key={currentItem.id}
                      category={currentItem}
                      onPress={handleCategoryPress}
                    />
                  );
                } else if (currentView === 'subcategories') {
                  return (
                    <CategoryCard
                      key={currentItem.id}
                      category={{
                        id: currentItem.id,
                        name: currentItem.name,
                        icon: 'folder',
                        image: currentItem.image,
                        subCategories: []
                      }}
                      onPress={() => handleSubCategoryPress(currentItem)}
                    />
                  );
                } else if (currentView === 'productgroups') {
                  return (
                    <CategoryCard
                      key={currentItem.id}
                      category={{
                        id: currentItem.id,
                        name: currentItem.name,
                        icon: 'package',
                        image: currentItem.image,
                        subCategories: []
                      }}
                      onPress={() => handleProductGroupPress(currentItem)}
                    />
                  );
                } else if (currentView === 'products') {
                  return (
                    <CategoryCard
                      key={currentItem.id}
                      category={{
                        id: currentItem.id,
                        name: currentItem.name,
                        icon: 'shopping-bag',
                        image: currentItem.image,
                        subCategories: []
                      }}
                      onPress={() => console.log('Product selected:', currentItem)}
                    />
                  );
                }
                
                return null;
              })}
            </HStack>
          ))}
        </VStack>
      </ScrollView>
    </Box>
  );
};
