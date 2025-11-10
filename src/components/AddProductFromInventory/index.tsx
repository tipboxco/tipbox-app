import React, { useState } from 'react';
import { FlatList, Dimensions } from 'react-native';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
    Input,
    InputField,
    Image,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { mock_inventory } from '@/src/mock/inventory';
import { InventoryItem } from '@/src/mock/inventory/types';
import { Header } from '@/src/components/Header';

const { width } = Dimensions.get('window');
const CARD_GAP = 6;
const CARDS_PER_ROW = 3;
const HORIZONTAL_PADDING = 15;
const CARD_WIDTH = (width - (HORIZONTAL_PADDING * 2) - (CARD_GAP * (CARDS_PER_ROW - 1))) / CARDS_PER_ROW;

interface AddProductFromInventoryProps {
    onProductSelect: (product: InventoryItem) => void;
    onClose?: () => void;
}

export const AddProductFromInventory: React.FC<AddProductFromInventoryProps> = ({
    onProductSelect,
    onClose,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [searchQuery, setSearchQuery] = useState('');

    // Flatten inventory items from all groups
    const allInventoryItems = mock_inventory.flatMap(group => group.items);

    // Filter inventory items based on search query
    const filteredInventory = allInventoryItems.filter(item =>
        item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.specs.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleProductPress = (item: InventoryItem) => {
        onProductSelect(item);
    };

    const renderProductCard = ({ item }: { item: InventoryItem }) => (
        <Pressable
            onPress={() => handleProductPress(item)}
            mb={CARD_GAP}
        >
            <Box
                bg={isDark ? '$backgroundDark800' : '$white'}
                borderWidth={1}
                borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
                borderRadius={5}
                w={CARD_WIDTH}
                h={175}
                overflow="hidden"
            >
                {/* Product Image */}
                <Box
                    flex={1}
                    p={15}
                    alignItems="center"
                    justifyContent="center"
                >
                    <Image
                        source={item.image}
                        alt={`${item.brand} ${item.model}`}
                        width={100}
                        height={100}
                        resizeMode="contain"
                    />
                </Box>

                {/* Product Info */}
                <VStack p={8} space="xs">
                    <Text
                        color={isDark ? '$textDark400' : '#A3A3A3'}
                        fontSize={11}
                        fontWeight="$bold"
                        numberOfLines={3}
                    >
                        {item.brand}
                        {'\n'}
                        {item.model}
                        {'\n'}
                        {item.specs}
                    </Text>
                </VStack>
            </Box>
        </Pressable>
    );

    return (
        <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
            {/* Header */}
            <Header
                title="Add Product from Inventory"
                leftAction="back"
                onLeftActionPress={onClose}
            />

            {/* Search Bar */}
            <Box px={HORIZONTAL_PADDING} pb={10}>
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
                            placeholder="Search product in your inventory"
                            placeholderTextColor={isDark ? '#8C8C8C' : '#B9B9B9'}
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={9}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </Input>
                </HStack>
            </Box>

            {/* Products Grid */}
            <FlatList
                data={filteredInventory}
                renderItem={renderProductCard}
                keyExtractor={(item) => item.id}
                numColumns={CARDS_PER_ROW}
                contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
                columnWrapperStyle={{ gap: CARD_GAP }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <Box py="$8" alignItems="center">
                        <Text
                            color={isDark ? '$textDark400' : '#A3A3A3'}
                            fontSize={12}
                            fontWeight="$medium"
                        >
                            No products found
                        </Text>
                    </Box>
                }
            />
        </VStack>
    );
};

export default AddProductFromInventory;

