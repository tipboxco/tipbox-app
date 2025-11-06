import React, { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
    Image,
    ScrollView,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import CategoryCard, { Category } from '../CategoryCard';

interface CreateEventPostBottomSheetProps {
    onClose: () => void;
    onSelectCatalog: () => void;
    onSelectInventory: () => void;
}

// Mock categories data
const mockCategories: Category[] = [
    { id: '1', name: 'Computers & Tablets', image: require('@/assets/inventory/product_01.png') },
    { id: '2', name: 'Smart Phones', image: require('@/assets/inventory/product_02.png') },
    { id: '3', name: 'TV & Home Theater', image: require('@/assets/inventory/product_03.png') },
    { id: '4', name: 'Cameras & Photo', image: require('@/assets/inventory/product_04.png') },
    { id: '5', name: 'Audio', image: require('@/assets/inventory/product_05.png') },
    { id: '6', name: 'Gaming', image: require('@/assets/inventory/product_06.png') },
    { id: '7', name: 'Wearable Tech', image: require('@/assets/inventory/product_07.png') },
    { id: '8', name: 'Smart Home', image: require('@/assets/inventory/product_08.png') },
    { id: '9', name: 'Drones', image: require('@/assets/inventory/product_09.png') },
    { id: '10', name: 'Accessories', image: require('@/assets/inventory/product_10.png') },
    { id: '11', name: 'Office Equipment', image: require('@/assets/inventory/product_11.png') },
    { id: '12', name: 'Health & Fitness', image: require('@/assets/inventory/product_12.png') },
];

export const CreateEventPostBottomSheet: React.FC<CreateEventPostBottomSheetProps> = ({
    onClose,
    onSelectCatalog,
    onSelectInventory,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [currentView, setCurrentView] = useState<'options' | 'inventory'>('options');

    const handleInventoryPress = () => {
        setCurrentView('inventory');
    };

    const handleBackPress = () => {
        if (currentView === 'inventory') {
            setCurrentView('options');
        } else {
            onClose();
        }
    };

    const handleCategoryPress = (category: Category) => {
        console.log('Selected category:', category);
        onSelectInventory();
        // TODO: Handle category selection
    };

    // Render inventory view
    if (currentView === 'inventory') {
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
                            Select Inventory
                        </Text>
                        <Box w={24} />
                    </HStack>
                </VStack>

                {/* Categories Grid */}
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Box px="$4" pb="$4">
                        <HStack flexWrap="wrap" gap={6}>
                            {mockCategories.map((category) => (
                                <CategoryCard
                                    key={category.id}
                                    category={category}
                                    onPress={handleCategoryPress}
                                />
                            ))}
                        </HStack>
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

