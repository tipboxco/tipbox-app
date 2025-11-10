import React, { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
    Input,
    InputField,
    ScrollView,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { catalogData } from '@/src/mock/catalog/productCatalog';
import { Category, BreadcrumbItem, Product } from '@/src/mock/catalog/productCatalog/types';
import CategoryCard from '@/src/features/catalog/components/CategoryCard';
import Breadcrumb from '@/src/components/Breadcrumb';
import { Header } from '@/src/components/Header';

interface AddProductFromCatalogProps {
    onProductSelect: (product: Product) => void;
    onClose?: () => void;
}

export const AddProductFromCatalog: React.FC<AddProductFromCatalogProps> = ({
    onProductSelect,
    onClose,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
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
        setSearchQuery('');
    };

    const handleSubCategoryPress = (subCategory: any) => {
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
        setSearchQuery('');
    };

    const handleProductGroupPress = (productGroup: any) => {
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
        setSearchQuery('');
    };

    const handleProductPress = (product: Product) => {
        onProductSelect(product);
    };

    const handleBreadcrumbPress = (item: BreadcrumbItem, index: number) => {
        if (item.type === 'category' && item.id === 'root') {
            setBreadcrumbItems([{ id: 'root', name: 'Categories', type: 'category' }]);
            setCurrentCategories(catalogData);
            setCurrentView('categories');
            setSearchQuery('');
        } else if (item.type === 'category') {
            const category = catalogData.find(cat => cat.id === item.id);
            if (category) {
                setBreadcrumbItems([item, { id: 'subcategories', name: 'Sub Categories', type: 'subCategory' }]);
                setCurrentSubCategories(category.subCategories);
                setCurrentView('subcategories');
                setSearchQuery('');
            }
        } else if (item.type === 'subCategory') {
            const category = breadcrumbItems.find(b => b.type === 'category');
            const categoryData = catalogData.find(cat => cat.id === category?.id);
            const subCategory = categoryData?.subCategories.find(sub => sub.id === item.id);
            if (subCategory) {
                setBreadcrumbItems([
                    category!,
                    item,
                    { id: 'productgroups', name: 'Product Groups', type: 'productGroup' }
                ]);
                setCurrentProductGroups(subCategory.productGroups);
                setCurrentView('productgroups');
                setSearchQuery('');
            }
        } else if (item.type === 'productGroup') {
            const category = breadcrumbItems.find(b => b.type === 'category');
            const subCategory = breadcrumbItems.find(b => b.type === 'subCategory');
            const categoryData = catalogData.find(cat => cat.id === category?.id);
            const subCategoryData = categoryData?.subCategories.find(sub => sub.id === subCategory?.id);
            const productGroup = subCategoryData?.productGroups.find(pg => pg.id === item.id);
            if (productGroup) {
                setBreadcrumbItems([
                    category!,
                    subCategory!,
                    item,
                    { id: 'products', name: 'Products', type: 'product' }
                ]);
                setCurrentProducts(productGroup.products);
                setCurrentView('products');
                setSearchQuery('');
            }
        }
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
                    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    product.description.toLowerCase().includes(searchQuery.toLowerCase())
                );
            default:
                return [];
        }
    };

    const currentData = getCurrentData();

    return (
        <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
            {/* Header */}
            <Header
                title="Add Product from Catalog"
                leftAction="back"
                onLeftActionPress={onClose}
            />

            {/* Search Bar */}
            <Box px="$4" pb="$3">
                <HStack
                    alignItems="center"
                    bg={isDark ? '#2A2A2A' : '#F2F2F2'}
                    borderWidth={1}
                    borderColor={isDark ? '#404040' : '#E9E9E9'}
                    borderRadius={20}
                    height={36}
                    px={14}
                    space="sm"
                >
                    <Feather
                        name="search"
                        size={20}
                        color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(60, 60, 67, 0.6)'}
                    />
                    <Input flex={1} borderWidth={0} bg="transparent">
                        <InputField
                            placeholder="Ürün Grubu seçin veya ürün adı arayın"
                            placeholderTextColor={isDark ? '#8C8C8C' : '#B9B9B9'}
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={9}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </Input>
                </HStack>
            </Box>

            {/* Breadcrumb */}
            <Breadcrumb
                items={breadcrumbItems}
                onItemPress={handleBreadcrumbPress}
            />

            {/* Dynamic Grid */}
            <ScrollView flex={1} px="$4">
                <VStack space="md" pb="$4">
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
        </VStack>
    );
};

export default AddProductFromCatalog;

