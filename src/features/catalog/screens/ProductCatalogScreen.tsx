import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Box, Text, ScrollView, Pressable, HStack, VStack, Input, InputField } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Search } from 'lucide-react-native';
import { catalogData } from '@/src/mock/catalog/productCatalog';
import { Category, BreadcrumbItem } from '@/src/mock/catalog/productCatalog/types';
import CategoryCard from '../components/CategoryCard';
import Breadcrumb from '@/src/components/Breadcrumb';
import ActionButtons from '../components/ActionButtons';
import { CreatePostBottomSheet } from '@/src/components/CreatePostBottomSheet';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CatalogStackParamList } from '../navigation';
import { RootStackParamList } from '@/src/navigation/navigation.types';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

type ProductCatalogScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList & RootStackParamList>;

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
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Bottom sheet refs
  const createPostBottomSheetRef = useRef<BottomSheet>(null);
  const [bottomSheetKey, setBottomSheetKey] = useState(0);

  // Bottom sheet snap points
  const createPostSnapPoints = useMemo(() => ['85%'], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

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

  const handleProductPress = (product: any) => {
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
    const productGroupItem = breadcrumbItems.find(item => item.type === 'productGroup' && item.id !== 'productgroups');
    let productGroup = null;
    if (productGroupItem) {
      for (const category of catalogData) {
        for (const subCategory of category.subCategories) {
          productGroup = subCategory.productGroups.find(group => group.id === productGroupItem.id);
          if (productGroup) break;
        }
        if (productGroup) break;
      }
    }
    
    navigation.navigate('Post', {
      screen: 'PostsScreen',
      params: {
        stage: 'Product',
        name: product.name,
        productInfo: {
          image: product.image,
          title: productGroup ? productGroup.name : product.name, // ProductGroup name (top) or Product name if no group
          subName: productGroup ? product.name : product.description, // Product name (bottom) or description if no group
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
      let productGroup = null;
      for (const category of catalogData) {
        for (const subCategory of category.subCategories) {
          productGroup = subCategory.productGroups.find(group => group.id === productGroupItem.id);
          if (productGroup) break;
        }
        if (productGroup) break;
      }
      if (product && productGroup) {
        productInfo = {
          image: product.image,
          title: productGroup.name, // ProductGroup name (top)
          subName: product.name, // Product name (bottom)
        };
      } else if (selectedProduct && productGroup) {
        productInfo = {
          image: selectedProduct.image,
          title: productGroup.name,
          subName: selectedProduct.name,
        };
      }
    } else if (productGroupItem && subCategoryItem) {
      // ProductGroup selected (with SubCategory) - title=SubCategory, subName=ProductGroup
      stage = 'ProductGroup';
      name = productGroupItem.name;
      let productGroup = null;
      let subCategory = null;
      for (const category of catalogData) {
        subCategory = category.subCategories.find(sub => sub.id === subCategoryItem.id);
        if (subCategory) {
          productGroup = subCategory.productGroups.find(group => group.id === productGroupItem.id);
          if (productGroup) break;
        }
      }
      if (productGroup && subCategory) {
        productInfo = {
          image: productGroup.image,
          title: subCategory.name, // SubCategory name (top)
          subName: productGroup.name, // ProductGroup name (bottom)
        };
      }
    } else if (subCategoryItem && categoryItem) {
      // SubCategory selected (with Category) - title=Category, subName=SubCategory
      stage = 'SubCategories';
      name = subCategoryItem.name;
      let subCategory = null;
      let parentCategory = null;
      for (const category of catalogData) {
        subCategory = category.subCategories.find(sub => sub.id === subCategoryItem.id);
        if (subCategory) {
          parentCategory = category;
          break;
        }
      }
      if (subCategory && parentCategory) {
        productInfo = {
          image: subCategory.image,
          title: parentCategory.name, // Category name (top)
          subName: subCategory.name, // SubCategory name (bottom)
        };
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
    console.log('Create a Post pressed');
    // Reset bottom sheet key to remount component and reset view
    setBottomSheetKey(prev => prev + 1);
    if (createPostBottomSheetRef.current) {
      createPostBottomSheetRef.current.snapToIndex(0);
    } else {
      setTimeout(() => {
        if (createPostBottomSheetRef.current) {
          createPostBottomSheetRef.current.snapToIndex(0);
        }
      }, 100);
    }
  };

  const handleSheetChanges = useCallback((index: number) => {
    // Reset bottom sheet key when sheet closes to reset view state
    if (index === -1) {
      setBottomSheetKey(prev => prev + 1);
    }
  }, []);

  const handlePostTypeSelect = (type: string) => {
    console.log('Post type selected:', type);
    
    // Close bottom sheet first
    createPostBottomSheetRef.current?.close();
    
    // Navigate to appropriate screen based on post type
    if (type === 'free') {
      navigation.navigate('Post', {
        screen: 'CreatePostScreen',
      });
    } else if (type === 'tips') {
      navigation.navigate('Post', {
        screen: 'CreateTipsAndTrickPostScreen',
      });
    } else if (type === 'question') {
      navigation.navigate('Post', {
        screen: 'CreateQuestionPostScreen',
      });
    } else if (type === 'experience') {
      navigation.navigate('Post', {
        screen: 'CreateExperiencePostScreen',
        params: {
          product: selectedProduct ? {
            id: selectedProduct.id,
            name: selectedProduct.name,
            description: selectedProduct.description,
            image: selectedProduct.image,
            brand: selectedProduct.brand,
          } : undefined,
        },
      });
    } else if (type === 'comparison') {
      navigation.navigate('Post', {
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
    } else if (type === 'update') {
      navigation.navigate('Post', {
        screen: 'CreateUpdatePostScreen',
        params: {
          product: selectedProduct ? {
            id: selectedProduct.id,
            name: selectedProduct.name,
            description: selectedProduct.description,
            image: selectedProduct.image,
            brand: selectedProduct.brand,
          } : undefined,
        },
      });
    }
    // Handle other post types here if needed
  };

  const handleViewChange = (view: 'options' | 'experience' | 'product-selection') => {
    console.log('BottomSheet view changed:', view);
    // View change is handled internally by CreatePostBottomSheet
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
                      onPress={() => handleProductPress(currentItem)}
                    />
                  );
                }
                
                return null;
              })}
            </HStack>
          ))}
        </VStack>
      </ScrollView>

      {/* Create Post Bottom Sheet */}
      <BottomSheet
        ref={createPostBottomSheetRef}
        index={-1}
        snapPoints={createPostSnapPoints}
        enablePanDownToClose
        enableOverDrag={false}
        enableHandlePanningGesture={true}
        enableContentPanningGesture={true}
        animateOnMount={true}
        backdropComponent={renderBackdrop}
        onChange={handleSheetChanges}
        backgroundStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#333333' : '#B8B8B7',
          width: 70,
          height: 5,
        }}
      >
        <BottomSheetView>
          <CreatePostBottomSheet
            key={bottomSheetKey}
            onClose={() => {
              createPostBottomSheetRef.current?.close();
            }}
            onPostTypeSelect={handlePostTypeSelect}
            onViewChange={handleViewChange}
            stage={currentView === 'categories' ? undefined : currentView as 'subcategories' | 'productgroups' | 'products'}
            selectedProduct={selectedProduct ? {
              id: selectedProduct.id,
              name: selectedProduct.name,
              subName: selectedProduct.description || undefined,
              image: selectedProduct.image,
              hasDiscount: false, // Product data doesn't have hasDiscount, can be extended later
            } : undefined}
          />
        </BottomSheetView>
      </BottomSheet>
    </Box>
  );
};
