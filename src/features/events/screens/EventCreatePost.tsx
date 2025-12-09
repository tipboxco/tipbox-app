import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
    Textarea,
    TextareaInput,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { EventsStackParamList } from '../navigation';
import { Feather } from '@expo/vector-icons';
import { CreateEventPostBottomSheet } from '../components/CreateEventPostBottomSheet';
import { Category } from '../components/CategoryCard';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { EventType } from '@/src/utils';
import { EventProduct } from '@/src/mock/events/communityEvents/types';
import { AddProductFromCatalog } from '@/src/components/AddProductFromCatalog';
import { AddProductFromInventory } from '@/src/components/AddProductFromInventory';
import { Product } from '@/src/mock/catalog/productCatalog/types';
import { InventoryItem } from '@/src/mock/inventory/types';
import { Header } from '@/src/components/Header';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

type EventCreatePostNavigationProp = NativeStackNavigationProp<EventsStackParamList, 'EventCreatePost'>;
type EventCreatePostRouteProp = RouteProp<EventsStackParamList, 'EventCreatePost'>;

const EventCreatePost: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<EventCreatePostNavigationProp>();
    const route = useRoute<EventCreatePostRouteProp>();

    const [content, setContent] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Category | null>(null);
    const [showProductSelector, setShowProductSelector] = useState(false);
    const [productSource, setProductSource] = useState<'Catalog' | 'Inventory' | null>(null);
    
    // Global bottom sheet hook
    const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
    
    // Safe area and tab bar insets
    const insets = useSafeAreaInsets();
    const tabBarHeight = useBottomTabBarHeight();
    
    // Get eventType, product, and productSource from route params
    const eventType = route.params?.eventType;
    const eventProduct = route.params?.product;
    const routeProductSource = route.params?.productSource;
    
    // Auto-select product if eventType is TYPE2
    useEffect(() => {
        if (eventType === EventType.TYPE2 && eventProduct) {
            const productCategory: Category = {
                id: eventProduct.id,
                name: eventProduct.name,
                image: eventProduct.image,
                category: eventProduct.category,
            };
            setSelectedProduct(productCategory);
        }
    }, [eventType, eventProduct]);

    // Show product selector if productSource is provided (only once)
    useEffect(() => {
        if (routeProductSource) {
            setProductSource(routeProductSource);
            setShowProductSelector(true);
        }
    }, [routeProductSource]);

    // handleProductSelect'i önce tanımla (handleSelectProduct'ta kullanılıyor)
    const handleProductSelect = useCallback((product: Category) => {
        setSelectedProduct(product);
        closeBottomSheet();
    }, [closeBottomSheet]);

    const handleSelectProduct = useCallback(() => {
        // Open bottom sheet using global manager
        // Navigation'ı prop olarak geç (GlobalBottomSheet içinde navigation context yok)
        openBottomSheet(
            <CreateEventPostBottomSheet
                onClose={closeBottomSheet}
                onProductSelect={handleProductSelect}
                navigation={navigation}
            />,
            {
                enablePanDownToClose: true,
                enableOverDrag: false,
                enableHandlePanningGesture: true,
                enableContentPanningGesture: true,
                enableDynamicSizing: true,
                animateOnMount: true,
                paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : tabBarHeight + 8,
            }
        );
    }, [openBottomSheet, closeBottomSheet, handleProductSelect, navigation]);

    const handleCatalogProductSelect = (product: Product) => {
        const productCategory: Category = {
            id: product.id,
            name: product.name,
            image: product.image,
            category: undefined,
        };
        setSelectedProduct(productCategory);
        setShowProductSelector(false);
        setProductSource(null);
        // Clear route params to prevent re-triggering
        navigation.setParams({ productSource: undefined });
    };

    const handleInventoryProductSelect = (product: InventoryItem) => {
        const productCategory: Category = {
            id: product.id,
            name: `${product.brand} ${product.model}`,
            image: product.image,
            category: product.brand,
        };
        setSelectedProduct(productCategory);
        setShowProductSelector(false);
        setProductSource(null);
        // Clear route params to prevent re-triggering
        navigation.setParams({ productSource: undefined });
    };

    const handleCloseProductSelector = () => {
        setShowProductSelector(false);
        setProductSource(null);
        // Clear route params to prevent re-triggering
        navigation.setParams({ productSource: undefined });
    };

    const handleAddPhoto = () => {
        // TODO: Implement image picker
        console.log('Add photo');
    };

    const handleShare = () => {
        console.log('Share button pressed');
    };

    // Check if share button should be enabled (product selected and content entered)
    const isShareEnabled = selectedProduct !== null && content.trim().length > 0;

    // Show product selector if productSource is set
    if (showProductSelector && productSource) {
        if (productSource === 'Catalog') {
            return (
                <AddProductFromCatalog
                    onProductSelect={handleCatalogProductSelect}
                    onClose={handleCloseProductSelector}
                />
            );
        } else if (productSource === 'Inventory') {
            return (
                <AddProductFromInventory
                    onProductSelect={handleInventoryProductSelect}
                    onClose={handleCloseProductSelector}
                />
            );
        }
    }

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
            {/* Header */}
            <Header
                title="Write a Post"
                leftAction="back"
                onLeftActionPress={() => navigation.goBack()}
                rightButton={{
                    text: 'Share',
                    backgroundColor: isShareEnabled ? '#D0F205' : '#EDEDED',
                    borderWidth: 1,
                    borderColor: isShareEnabled ? '#B8CC04' : '#B1B1B1',
                    textColor: isShareEnabled ? '#111111' : '#B1B1B1',
                    fontSize: 12,
                    borderRadius: 25,
                    paddingX: 24,
                    paddingY: 8,
                    onPress: handleShare,
                }}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                <VStack space="lg" p="$4">
                    {/* Select Product Button or Selected Product Card */}
                    {/* Show product selection if eventType is TYPE1 or undefined (default events) */}
                    {(eventType === EventType.TYPE1 || eventType === undefined) && (
                        <>
                            {selectedProduct ? (
                                <ProductInfoCard
                                    size="big"
                                    type={ProductInfoType.PRODUCT}
                                    image={selectedProduct.image}
                                    title={selectedProduct.name}
                                    subName={selectedProduct.category}
                                    onPress={handleSelectProduct}
                                />
                            ) : (
                                <Pressable
                                    onPress={handleSelectProduct}
                                    borderWidth={1}
                                    borderColor={isDark ? '#333' : '#D9D9D9'}
                                    borderRadius={8}
                                    minHeight={42}
                                    justifyContent="center"
                                    alignItems="center"
                                    bg={isDark ? '#1A1A1A' : '$backgroundLight0'}
                                >
                                    <HStack space="sm" alignItems="center">
                                        <Feather
                                            name="plus"
                                            size={20}
                                            color={isDark ? '#999' : '#CCCCCC'}
                                        />
                                        <Text
                                            color={isDark ? '#999' : '#CCCCCC'}
                                            fontSize={15}
                                        >
                                            Select Product
                                        </Text>
                                    </HStack>
                                </Pressable>
                            )}
                        </>
                    )}
                    
                    {/* Show selected product card if eventType is TYPE2 */}
                    {eventType === EventType.TYPE2 && selectedProduct && (
                        <ProductInfoCard
                            size="big"
                            type={ProductInfoType.PRODUCT}
                            image={selectedProduct.image}
                            title={selectedProduct.name}
                            subName={selectedProduct.category}
                        />
                    )}

                    {/* Post Description */}
                    <VStack space="xs">
                        <Text
                            color={isDark ? '$textDark200' : '#999999'}
                            fontSize={14}
                        >
                            Post Description
                        </Text>
                        <Textarea
                            bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                            borderWidth={1}
                            borderColor={isDark ? '#333' : '#D9D9D9'}
                            borderRadius={8}
                            height={180}
                        >
                            <TextareaInput
                                placeholder="Type your Post here..."
                                value={content}
                                onChangeText={(text) => {
                                    if (text.length <= 500) {
                                        setContent(text);
                                    }
                                }}
                                color={isDark ? '$textDark50' : '$textLight900'}
                                placeholderTextColor={isDark ? '#666' : '#999'}
                                fontSize={15}
                                multiline
                            />
                        </Textarea>
                        <Text
                            position="absolute"
                            bottom={8}
                            right={12}
                            color="#CCCCCC"
                            fontSize={12}
                        >
                            {content.length}/500
                        </Text>
                    </VStack>

                    {/* Images Section */}
                    <VStack space="xs">
                        <Text
                            color={isDark ? '$textDark200' : '#999999'}
                            fontSize={14}
                        >
                            Images
                        </Text>
                        <Pressable
                            onPress={handleAddPhoto}
                            borderWidth={2}
                            borderStyle="dashed"
                            borderColor={isDark ? '#333' : '#D9D9D9'}
                            borderRadius={8}
                            width={64}
                            height={64}
                            justifyContent="center"
                            alignItems="center"
                            bg="transparent"
                        >
                            <Feather
                                name="plus"
                                size={36}
                                color={isDark ? '#666' : '#CCCCCC'}
                            />
                        </Pressable>
                    </VStack>
                </VStack>
            </ScrollView>

        </Box>
        </SafeAreaView>
    );
};

EventCreatePost.displayName = 'EventCreatePost';

export default EventCreatePost;

