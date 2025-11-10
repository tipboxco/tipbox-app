import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { ScrollView, Alert } from 'react-native';
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
import { SelectedProductCard } from '../components/SelectedProductCard';
import { Category } from '../components/CategoryCard';
import { EventType, EventProduct } from '@/src/mock/events/communityEvents/types';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { AddProductFromCatalog } from '@/src/components/AddProductFromCatalog';
import { AddProductFromInventory } from '@/src/components/AddProductFromInventory';
import { Product } from '@/src/mock/catalog/productCatalog/types';
import { InventoryItem } from '@/src/mock/inventory/types';
import { Header } from '@/src/components/Header';

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
    
    // Get eventType, product, and productSource from route params
    const eventType = route.params?.eventType;
    const eventProduct = route.params?.product;
    const routeProductSource = route.params?.productSource;
    
    // Auto-select product if eventType is PRODUCT
    useEffect(() => {
        if (eventType === EventType.PRODUCT && eventProduct) {
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

    // Bottom sheet refs
    const bottomSheetRef = useRef<BottomSheet>(null);

    // Bottom sheet snap points
    const snapPoints = useMemo(() => ['40%'], []);

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

    const handleSelectProduct = () => {
        // Open bottom sheet
        if (bottomSheetRef.current) {
            bottomSheetRef.current.snapToIndex(0);
        }
    };

    const handleCloseBottomSheet = () => {
        bottomSheetRef.current?.close();
    };

    const handleProductSelect = (product: Category) => {
        setSelectedProduct(product);
        handleCloseBottomSheet();
    };

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
                    {/* Only show product selection if eventType is not PRODUCT */}
                    {eventType !== EventType.PRODUCT && (
                        <>
                            {selectedProduct ? (
                                <SelectedProductCard
                                    productName={selectedProduct.name}
                                    productImage={selectedProduct.image}
                                    productCategory={selectedProduct.category}
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
                    
                    {/* Show selected product card if eventType is PRODUCT */}
                    {eventType === EventType.PRODUCT && selectedProduct && (
                        <SelectedProductCard
                            productName={selectedProduct.name}
                            productImage={selectedProduct.image}
                            productCategory={selectedProduct.category}
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

            {/* Select Product Bottom Sheet */}
            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                enableOverDrag={false}
                enableHandlePanningGesture={true}
                enableContentPanningGesture={true}
                animateOnMount={true}
                backdropComponent={renderBackdrop}
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
                    backgroundColor: isDark ? '#333333' : '#CCCCCC',
                    width: 40,
                    height: 4,
                }}
            >
                <BottomSheetView>
                    <CreateEventPostBottomSheet
                        onClose={handleCloseBottomSheet}
                        onProductSelect={handleProductSelect}
                    />
                </BottomSheetView>
            </BottomSheet>
        </Box>
    );
};

EventCreatePost.displayName = 'EventCreatePost';

export default EventCreatePost;

