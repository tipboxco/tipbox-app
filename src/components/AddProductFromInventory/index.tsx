import React, { useState, useEffect } from 'react';
import { FlatList, Dimensions, ActivityIndicator } from 'react-native';
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
import { Header } from '@/src/components/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InventoryItem } from '@/src/features/profile/types';
import { useInventory } from '@/src/features/profile/api/hooks';

const { width } = Dimensions.get('window');
const CARD_GAP = 6;
const CARDS_PER_ROW = 3;
const HORIZONTAL_PADDING = 15;
const CARD_WIDTH = (width - (HORIZONTAL_PADDING * 2) - (CARD_GAP * (CARDS_PER_ROW - 1))) / CARDS_PER_ROW;

interface AddProductFromInventoryProps {
    onProductSelect: (product: InventoryItem) => void;
    onClose: () => void;
}

export const AddProductFromInventory: React.FC<AddProductFromInventoryProps> = ({
    onProductSelect,
    onClose,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [searchQuery, setSearchQuery] = useState('');

    // Gerçek API'den inventory verilerini çek
    const {
        data,
        isLoading,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching,
    } = useInventory();
    
    // Debug: API'den gelen inventory data'yı logla
    useEffect(() => {
        if (data?.pages && data.pages.length > 0) {
            const firstItem = data.pages[0].items[0];
            console.log('🔍 [AddProductFromInventory] First inventory item from API:', {
                id: firstItem?.id,
                productId: firstItem?.productId,
                hasProductId: !!firstItem?.productId,
                brand: firstItem?.brand,
            });
            
            if (!firstItem?.productId) {
                console.error('❌ [AddProductFromInventory] CRITICAL: productId is missing! Old cache or backend issue!');
            }
        }
    }, [data]);

    // Flatten all inventory items from pagination
    const allInventoryItems = data?.pages.flatMap(page => page.items) || [];

    // Filter inventory items based on search query
    const filteredInventory = allInventoryItems.filter(item => {
        if (!searchQuery.trim()) return true;
        
        const query = searchQuery.toLowerCase();
        const brandName = item.brand?.name?.toLowerCase() || '';
        const brandModel = item.brand?.model?.toLowerCase() || '';
        
        return brandName.includes(query) || brandModel.includes(query);
    });

    const handleProductPress = (item: InventoryItem) => {
        console.log('📦 [AddProductFromInventory] Product selected:', {
            inventoryItemId: item.id,
            productId: item.productId,
            brand: item.brand,
            image: item.image,
            fullItem: JSON.stringify(item, null, 2),
        });
        onProductSelect(item);
    };

    const renderProductCard = ({ item }: { item: InventoryItem }) => {
        const brandName = item.brand?.name || 'Unknown Brand';
        const brandModel = item.brand?.model || '';
        
        return (
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
                        {item.image ? (
                            <Image
                                source={{ uri: item.image }}
                                alt={`${brandName} ${brandModel}`}
                                width={100}
                                height={100}
                                resizeMode="contain"
                            />
                        ) : (
                            <Box
                                width={100}
                                height={100}
                                bg={isDark ? '$backgroundDark700' : '#F5F5F5'}
                                borderRadius={8}
                                justifyContent="center"
                                alignItems="center"
                            >
                                <Feather
                                    name="image"
                                    size={32}
                                    color={isDark ? '#666' : '#CCC'}
                                />
                            </Box>
                        )}
                    </Box>

                    {/* Product Info */}
                    <Box
                        px={8}
                        pb={10}
                        pt={5}
                        borderTopWidth={1}
                        borderTopColor={isDark ? '$borderDark700' : '#E9E9E9'}
                    >
                        <Text
                            fontSize={11}
                            fontWeight="$semibold"
                            color={isDark ? '$textDark50' : '$textLight900'}
                            numberOfLines={1}
                        >
                            {brandName}
                        </Text>
                        {brandModel && (
                            <Text
                                fontSize={10}
                                color={isDark ? '$textDark400' : '$textLight500'}
                                numberOfLines={1}
                                mt={2}
                            >
                                {brandModel}
                            </Text>
                        )}
                    </Box>
                </Box>
            </Pressable>
        );
    };

    const renderFooter = () => {
        if (!isFetchingNextPage) return null;
        
        return (
            <Box py="$4" justifyContent="center" alignItems="center">
                <ActivityIndicator size="small" color={isDark ? '#FFF' : '#000'} />
            </Box>
        );
    };

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
            <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
                <Header
                    title="Select from Inventory"
                    leftAction="back"
                    onLeftActionPress={onClose}
                    rightButton={{
                        icon: 'refresh-cw',
                        onPress: () => refetch(),
                        disabled: isLoading || isRefetching,
                    }}
                />

                {/* Search Bar */}
                <Box px={HORIZONTAL_PADDING} pt="$3" pb="$2">
                    <Input
                        bg={isDark ? '$backgroundDark900' : '$white'}
                        borderWidth={1}
                        borderColor={isDark ? '$borderDark700' : '#E0E0E0'}
                        borderRadius={8}
                        h={44}
                    >
                        <Box pl="$3" pr="$2" justifyContent="center">
                            <Feather
                                name="search"
                                size={18}
                                color={isDark ? '#999' : '#666'}
                            />
                        </Box>
                        <InputField
                            placeholder="Search products..."
                            placeholderTextColor={isDark ? '#999' : '#999'}
                            color={isDark ? '$textDark50' : '$textLight900'}
                            fontSize={15}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <Pressable
                                onPress={() => setSearchQuery('')}
                                pr="$3"
                                justifyContent="center"
                            >
                                <Feather
                                    name="x"
                                    size={18}
                                    color={isDark ? '#999' : '#666'}
                                />
                            </Pressable>
                        )}
                    </Input>
                </Box>

                {/* Loading State */}
                {isLoading && (
                    <Box flex={1} justifyContent="center" alignItems="center">
                        <ActivityIndicator size="large" color={isDark ? '#FFF' : '#000'} />
                        <Text
                            mt="$3"
                            color={isDark ? '$textDark400' : '$textLight500'}
                            fontSize={14}
                        >
                            Loading inventory...
                        </Text>
                    </Box>
                )}

                {/* Error State */}
                {isError && (
                    <Box flex={1} justifyContent="center" alignItems="center" px="$6">
                        <Feather
                            name="alert-circle"
                            size={48}
                            color={isDark ? '#999' : '#CCC'}
                        />
                        <Text
                            mt="$3"
                            color={isDark ? '$textDark400' : '$textLight500'}
                            fontSize={14}
                            textAlign="center"
                        >
                            Failed to load inventory
                        </Text>
                        <Text
                            mt="$2"
                            color={isDark ? '$textDark600' : '$textLight400'}
                            fontSize={12}
                            textAlign="center"
                        >
                            {error?.message || 'Please try again later'}
                        </Text>
                    </Box>
                )}

                {/* Empty State */}
                {!isLoading && !isError && filteredInventory.length === 0 && (
                    <Box flex={1} justifyContent="center" alignItems="center" px="$6">
                        <Feather
                            name="inbox"
                            size={48}
                            color={isDark ? '#999' : '#CCC'}
                        />
                        <Text
                            mt="$3"
                            color={isDark ? '$textDark400' : '$textLight500'}
                            fontSize={14}
                            textAlign="center"
                        >
                            {searchQuery.trim() ? 'No products found' : 'Your inventory is empty'}
                        </Text>
                        <Text
                            mt="$2"
                            color={isDark ? '$textDark600' : '$textLight400'}
                            fontSize={12}
                            textAlign="center"
                        >
                            {searchQuery.trim() ? 'Try different search terms' : 'Add products to your inventory first'}
                        </Text>
                    </Box>
                )}

                {/* Product List */}
                {!isLoading && !isError && filteredInventory.length > 0 && (
                    <FlatList
                        data={filteredInventory}
                        renderItem={renderProductCard}
                        keyExtractor={(item) => item.id}
                        numColumns={CARDS_PER_ROW}
                        columnWrapperStyle={{
                            paddingHorizontal: HORIZONTAL_PADDING,
                            justifyContent: 'space-between',
                            marginBottom: CARD_GAP,
                        }}
                        contentContainerStyle={{
                            paddingTop: 8,
                            paddingBottom: 20,
                        }}
                        showsVerticalScrollIndicator={false}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={renderFooter}
                    />
                )}
            </Box>
        </SafeAreaView>
    );
};
