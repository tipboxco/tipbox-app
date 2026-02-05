import React, { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
    Image,
    ScrollView,
    Input,
    InputField,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EventStackParamList } from '../../EventNavigator';
import CategoryCard, { Category } from '../CategoryCard';
import Breadcrumb from '@/src/components/Breadcrumb';
import { BreadcrumbItem } from '@/src/types/breadcrumb';
import { catalogData } from '@/src/mock/catalog/productCatalog';
import { Category as CatalogCategory } from '@/src/mock/catalog/productCatalog/types';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { useAppStore } from '@/src/store/appStore';

type CreateEventPostBottomSheetNavigationProp = NativeStackNavigationProp<EventStackParamList>;

interface CreateEventPostBottomSheetProps {
    onClose: () => void;
    onProductSelect: (product: Category) => void;
    navigation: CreateEventPostBottomSheetNavigationProp; // Required: GlobalBottomSheet içinde navigation context yok
    eventId?: string; // Event ID - ProductSelectScreen'e taşınacak
}

// Mock categories data
const mockCategories: Category[] = [
    { id: '1', name: 'Computers & Tablets', image: require('@/assets/inventory/product_01.png'), category: 'Technology' },
    { id: '2', name: 'Smart Phones', image: require('@/assets/inventory/product_02.png'), category: 'Technology' },
    { id: '3', name: 'TV & Home Theater', image: require('@/assets/inventory/product_03.png'), category: 'Electronics' },
    { id: '4', name: 'Cameras & Photo', image: require('@/assets/inventory/product_04.png'), category: 'Photography' },
    { id: '5', name: 'Audio', image: require('@/assets/inventory/product_05.png'), category: 'Electronics' },
    { id: '6', name: 'Gaming', image: require('@/assets/inventory/product_06.png'), category: 'Entertainment' },
    { id: '7', name: 'Wearable Tech', image: require('@/assets/inventory/product_07.png'), category: 'Technology' },
    { id: '8', name: 'Smart Home', image: require('@/assets/inventory/product_08.png'), category: 'Home & Living' },
    { id: '9', name: 'Drones', image: require('@/assets/inventory/product_09.png'), category: 'Technology' },
    { id: '10', name: 'Accessories', image: require('@/assets/inventory/product_10.png'), category: 'General' },
    { id: '11', name: 'Office Equipment', image: require('@/assets/inventory/product_11.png'), category: 'Office' },
    { id: '12', name: 'Health & Fitness', image: require('@/assets/inventory/product_12.png'), category: 'Health' },
];

export const CreateEventPostBottomSheet: React.FC<CreateEventPostBottomSheetProps> = ({
    onClose,
    onProductSelect,
    navigation,
    eventId,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const { user } = useAppStore();
    const [currentView, setCurrentView] = useState<'options' | 'inventory' | 'catalog'>('options');
    const [searchQuery, setSearchQuery] = useState('');

    // Catalog navigation states
    const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([
        { id: 'root', name: 'Categories', type: 'category' }
    ]);
    const [currentCategories, setCurrentCategories] = useState<CatalogCategory[]>(catalogData);
    const [currentSubCategories, setCurrentSubCategories] = useState<any[]>([]);
    const [currentProductGroups, setCurrentProductGroups] = useState<any[]>([]);
    const [currentProducts, setCurrentProducts] = useState<any[]>([]);
    const [catalogView, setCatalogView] = useState<'categories' | 'subcategories' | 'productgroups' | 'products'>('categories');

    const handleInventoryPress = () => {
        onClose();
        // Navigate to user's own InventoryScreen with selectMode
        if (user?.id) {
            navigationService.navigate(ROOT_ROUTES.PROFILE, {
                screen: 'InventoryList',
                params: {
                    userId: user.id,
                    selectMode: 'event',
                    returnScreen: 'EventCreatePost',
                },
            });
        }
    };

    const handleCatalogPress = () => {
        onClose();
        // Navigate to ProductSelectScreen (FAB yok)
        navigationService.navigate(ROOT_ROUTES.PRODUCT_SELECT as any, {
            returnScreen: 'EventCreatePost',
            eventId,
        });
    };

    const handleBackPress = () => {
        if (currentView === 'inventory' || currentView === 'catalog') {
            setCurrentView('options');
            setSearchQuery(''); // Clear search when going back
        } else {
            onClose();
        }
    };

    // Catalog navigation handlers
    const handleCatalogCategoryPress = (category: CatalogCategory) => {
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
        setCatalogView('subcategories');
    };

    const handleCatalogSubCategoryPress = (subCategory: any) => {
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
        setCatalogView('productgroups');
    };

    const handleCatalogProductGroupPress = (productGroup: any) => {
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
        setCatalogView('products');
    };

    const handleCatalogProductPress = (product: any) => {
        // Convert catalog product to Category type for consistency
        const selectedProduct: Category = {
            id: product.id,
            name: product.name,
            image: product.image,
            category: breadcrumbItems.find(item => item.type === 'category')?.name
        };
        
        console.log('Selected product from catalog:', selectedProduct);
        onProductSelect(selectedProduct);
    };

    const handleBreadcrumbPress = (item: BreadcrumbItem, index: number) => {
        if (item.type === 'category' && item.id === 'root') {
            setBreadcrumbItems([{ id: 'root', name: 'Categories', type: 'category' }]);
            setCurrentCategories(catalogData);
            setCatalogView('categories');
        } else if (item.type === 'category') {
            const category = catalogData.find(cat => cat.id === item.id);
            if (category) {
                setBreadcrumbItems([
                    { id: category.id, name: category.name, type: 'category' },
                    { id: 'subcategories', name: 'Sub Categories', type: 'subCategory' }
                ]);
                setCurrentSubCategories(category.subCategories);
                setCatalogView('subcategories');
            }
        } else if (item.type === 'subCategory' && item.id === 'subcategories') {
            setCatalogView('subcategories');
        } else if (item.type === 'subCategory') {
            const subCategory = currentSubCategories.find(sub => sub.id === item.id);
            if (subCategory) {
                const currentCategory = breadcrumbItems.find(breadcrumb => breadcrumb.type === 'category');
                setBreadcrumbItems([
                    currentCategory!,
                    { id: subCategory.id, name: subCategory.name, type: 'subCategory' },
                    { id: 'productgroups', name: 'Product Groups', type: 'productGroup' }
                ]);
                setCurrentProductGroups(subCategory.productGroups);
                setCatalogView('productgroups');
            }
        } else if (item.type === 'productGroup' && item.id === 'productgroups') {
            setCatalogView('productgroups');
        } else if (item.type === 'productGroup') {
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
                setCatalogView('products');
            }
        } else if (item.type === 'product' && item.id === 'products') {
            setCatalogView('products');
        }
    };

    // Inventory category press handler
    const handleInventoryCategoryPress = (category: Category) => {
        console.log('Selected category from inventory:', category);
        onProductSelect(category);
    };

    // Get current catalog data based on view and search
    const getCatalogData = () => {
        switch (catalogView) {
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

    const catalogDataFiltered = getCatalogData();

    // Filter inventory categories based on search query
    const filteredInventoryCategories = mockCategories.filter((category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Render inventory view
    if (currentView === 'inventory') {
        return (
            <Box flex={1} bg={isDark ? '#1A1A1A' : '#FDFDFB'}>
                {/* Header with back button */}
                <VStack space="sm" px="$4" pt="$4">
                    <HStack justifyContent="space-between" alignItems="center" w="100%">
                        <Pressable onPress={handleBackPress}>
                            <Feather
                                name="arrow-left"
                                size={24}
                                color={isDark ? '#FFFFFF' : '#000000'}
                            />
                        </Pressable>
                        <Text
                            fontSize={18}
                            fontWeight="$bold"
                            color={isDark ? '$textDark50' : '#000000'}
                            textAlign="center"
                            flex={1}
                        >
                            Select Inventory aaa
                        </Text>
                        <Box w={24} />
                    </HStack>

                    {/* Search Bar */}
                    <HStack
                        alignItems="center"
                        bg={isDark ? '#2A2A2A' : '#FDFDFD'}
                        borderWidth={1}
                        borderColor={isDark ? '#404040' : '#E9E9E9'}
                        borderRadius={23}
                        px={12}
                        space="sm"
                        mt="$4"
                        mb="$4"
                    >
                        <Feather 
                            name="search" 
                            size={20} 
                            color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'} 
                        />
                        <Input flex={1} borderWidth={0} bg="transparent" h={40}>
                            <InputField
                                placeholder="Search for a product in inventory"
                                placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
                                color={isDark ? '#fff' : '#000'}
                                fontSize={12}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </Input>
                    </HStack>
                </VStack>

                {/* Categories Grid */}
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Box px="$4" pb="$4">
                        {filteredInventoryCategories.length > 0 ? (
                            <HStack flexWrap="wrap" gap={6}>
                                {filteredInventoryCategories.map((category) => (
                                    <CategoryCard
                                        key={category.id}
                                        category={category}
                                        onPress={handleInventoryCategoryPress}
                                    />
                                ))}
                            </HStack>
                        ) : (
                            <Box py="$10" alignItems="center">
                                <Text
                                    color={isDark ? '#999' : '#666'}
                                    fontSize={14}
                                >
                                    No products found
                                </Text>
                            </Box>
                        )}
                    </Box>
                </ScrollView>
            </Box>
        );
    }

    // Render catalog view
    if (currentView === 'catalog') {
        return (
            <Box flex={1} bg={isDark ? '#1A1A1A' : '#FDFDFB'}>
                {/* Header with back button */}
                <VStack space="sm" px="$4" pt="$4">
                    <HStack justifyContent="space-between" alignItems="center" w="100%">
                        <Pressable onPress={handleBackPress}>
                            <Feather
                                name="arrow-left"
                                size={24}
                                color={isDark ? '#FFFFFF' : '#000000'}
                            />
                        </Pressable>
                        <Text
                            fontSize={18}
                            fontWeight="$bold"
                            color={isDark ? '$textDark50' : '#000000'}
                            textAlign="center"
                            flex={1}
                        >
                            Select Product Catalog
                        </Text>
                        <Box w={24} />
                    </HStack>

                    {/* Search Bar */}
                    <HStack
                        alignItems="center"
                        bg={isDark ? '#2A2A2A' : '#F2F2F2'}
                        borderWidth={1}
                        borderColor={isDark ? '#404040' : '#E9E9E9'}
                        borderRadius={23}
                        px={12}
                        space="sm"
                        mt="$4"
                    >
                        <Feather 
                            name="search" 
                            size={20} 
                            color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'} 
                        />
                        <Input flex={1} borderWidth={0} bg="transparent" h={40}>
                            <InputField
                                placeholder="Search for a product in catalog"
                                placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
                                color={isDark ? '#fff' : '#000'}
                                fontSize={12}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </Input>
                    </HStack>
                </VStack>

                {/* Breadcrumb */}
                {catalogView !== 'categories' && (
                    <Breadcrumb
                        items={breadcrumbItems}
                        onItemPress={handleBreadcrumbPress}
                    />
                )}

                {/* Categories Grid */}
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Box px="$4" pb="$4" pt="$2">
                        {catalogDataFiltered.length > 0 ? (
                            <HStack flexWrap="wrap" gap={6}>
                                {catalogDataFiltered.map((item) => {
                                    const categoryItem: Category = {
                                        id: item.id,
                                        name: item.name,
                                        image: item.image,
                                    };

                                    let handlePress;
                                    if (catalogView === 'categories') {
                                        handlePress = () => handleCatalogCategoryPress(item as CatalogCategory);
                                    } else if (catalogView === 'subcategories') {
                                        handlePress = () => handleCatalogSubCategoryPress(item);
                                    } else if (catalogView === 'productgroups') {
                                        handlePress = () => handleCatalogProductGroupPress(item);
                                    } else {
                                        handlePress = () => handleCatalogProductPress(item);
                                    }

                                    return (
                                        <CategoryCard
                                            key={item.id}
                                            category={categoryItem}
                                            onPress={handlePress}
                                        />
                                    );
                                })}
                            </HStack>
                        ) : (
                            <Box py="$10" alignItems="center">
                                <Text
                                    color={isDark ? '#999' : '#666'}
                                    fontSize={14}
                                >
                                    No products found
                                </Text>
                            </Box>
                        )}
                    </Box>
                </ScrollView>
            </Box>
        );
    }

    // Render options view
    return (
        <Box flex={1} bg={isDark ? '#1A1A1A' : '#FDFDFB'}>
            {/* Header with back button */}
            <VStack space="sm" px="$4">
                <HStack justifyContent="space-between" alignItems="center" w="100%">
                    <Pressable onPress={handleBackPress}>
                        <Feather
                            name="arrow-left"
                            size={24}
                            color={isDark ? '#FFFFFF' : '#000000'}
                        />
                    </Pressable>
                    <Text
                        fontSize={18}
                        fontWeight="$bold"
                        color={isDark ? '$textDark50' : '#000000'}
                        textAlign="center"
                        flex={1}
                    >
                        Select Product
                    </Text>
                    <Box w={24} />
                </HStack>
            </VStack>

            {/* Options Grid */}
            <Box px="$4" mt="$6">
                <HStack space="md">
                    {/* Select Product Catalog */}
                    <Pressable
                        flex={1}
                        onPress={handleCatalogPress}
                        bg={isDark ? '#2A2A2A' : '#FFFFFF'}
                        borderRadius={12}
                        p="$6"
                        alignItems="center"
                        justifyContent="center"
                        borderWidth={1}
                        borderColor={isDark ? '#333' : '#E5E5E5'}
                        minHeight={120}
                    >
                        <VStack space="md" alignItems="center">
                            <Image
                                source={require('@/assets/add_post.png')}
                                alt="Add Post"
                                width={24}
                                height={24}
                            />
                            <Text
                                fontSize={15}
                                fontWeight="$semibold"
                                color={isDark ? '$textDark50' : '#000000'}
                                textAlign="center"
                            >
                                Select Product Catalog
                            </Text>
                        </VStack>
                    </Pressable>

                    {/* Select Inventory */}
                    <Pressable
                        flex={1}
                        onPress={handleInventoryPress}
                        bg={isDark ? '#2A2A2A' : '#FFFFFF'}
                        borderRadius={12}
                        p="$6"
                        alignItems="center"
                        justifyContent="center"
                        borderWidth={1}
                        borderColor={isDark ? '#333' : '#E5E5E5'}
                        minHeight={120}
                    >
                        <VStack space="md" alignItems="center">
                            <Image
                                source={require('@/assets/add_post.png')}
                                alt="Add Post"
                                width={24}
                                height={24}
                            />
                            <Text
                                fontSize={15}
                                fontWeight="$semibold"
                                color={isDark ? '$textDark50' : '#000000'}
                                textAlign="center"
                            >
                                Select Inventory
                            </Text>
                        </VStack>
                    </Pressable>
                </HStack>
            </Box>
        </Box>
    );
};

