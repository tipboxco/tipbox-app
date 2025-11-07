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
import CategoryCard, { Category } from '../CategoryCard';

interface CreateEventPostBottomSheetProps {
    onClose: () => void;
    onSelectCatalog: () => void;
    onSelectInventory: () => void;
    onProductSelect: (product: Category) => void;
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
    onSelectCatalog,
    onSelectInventory,
    onProductSelect,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [currentView, setCurrentView] = useState<'options' | 'inventory'>('options');
    const [searchQuery, setSearchQuery] = useState('');

    const handleInventoryPress = () => {
        setCurrentView('inventory');
    };

    const handleBackPress = () => {
        if (currentView === 'inventory') {
            setCurrentView('options');
            setSearchQuery(''); // Clear search when going back
        } else {
            onClose();
        }
    };

    const handleCategoryPress = (category: Category) => {
        console.log('Selected category:', category);
        onProductSelect(category);
        onClose();
    };

    // Filter categories based on search query
    const filteredCategories = mockCategories.filter((category) =>
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
                            Select Inventory
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
                        {filteredCategories.length > 0 ? (
                            <HStack flexWrap="wrap" gap={6}>
                                {filteredCategories.map((category) => (
                                    <CategoryCard
                                        key={category.id}
                                        category={category}
                                        onPress={handleCategoryPress}
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

    // Render options view
    return (
        <Box flex={1} bg={isDark ? '#1A1A1A' : '#FDFDFB'}>
            {/* Header with back button */}
            <VStack space="sm" mb="$4" px="$4" pt="$4">
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
                        onPress={onSelectCatalog}
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

