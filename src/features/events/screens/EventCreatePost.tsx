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
    useToast,
    Toast,
    ToastTitle,
    ToastDescription,
    Image,
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
import { imagePickerService } from '@/src/services/ExpoImagePickerService';
import { useCreateEventPost } from '../api/hooks';

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
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    
    // Global bottom sheet hook
    const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
    const toast = useToast();
    
    // Safe area and tab bar insets
    const insets = useSafeAreaInsets();
    const tabBarHeight = useBottomTabBarHeight();
    
    // Get eventId, eventType, product, and productSource from route params
    const eventId = route.params?.eventId;
    const eventType = route.params?.eventType;
    const eventProduct = route.params?.product;
    const routeProductSource = route.params?.productSource;
    
    // Event post mutation hook
    const createEventPostMutation = useCreateEventPost(eventId || '');
    
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

    const handleAddPhoto = async () => {
        try {
            const remainingSlots = 10 - selectedImages.length;
            
            if (remainingSlots <= 0) {
                toast.show({
                    placement: 'top',
                    render: ({ id }: { id: string }) => {
                        return (
                            <Box maxWidth="90%" alignSelf="center" px="$4">
                                <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                                    <ToastTitle>Limit Aşıldı</ToastTitle>
                                    <ToastDescription>Maksimum 10 görsel seçebilirsiniz.</ToastDescription>
                                </Toast>
                            </Box>
                        );
                    },
                });
                return;
            }

            const result = await imagePickerService.pickMultipleFromGallery(remainingSlots);
            
            if (result.success && result.assets && result.assets.length > 0) {
                const newImageUris = result.assets
                    .map(asset => asset.uri)
                    .filter((uri): uri is string => !!uri);
                
                if (newImageUris.length > 0) {
                    setSelectedImages(prev => [...prev, ...newImageUris]);
                } else {
                    toast.show({
                        placement: 'top',
                        render: ({ id }: { id: string }) => {
                            return (
                                <Box maxWidth="90%" alignSelf="center" px="$4">
                                    <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                                        <ToastTitle>Hata</ToastTitle>
                                        <ToastDescription>Seçilen görsellerin URI'leri bulunamadı.</ToastDescription>
                                    </Toast>
                                </Box>
                            );
                        },
                    });
                }
            } else if (result.error) {
                toast.show({
                    placement: 'top',
                    render: ({ id }: { id: string }) => {
                        return (
                            <Box maxWidth="90%" alignSelf="center" px="$4">
                                <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                                    <ToastTitle>Hata</ToastTitle>
                                    <ToastDescription>{result.error}</ToastDescription>
                                </Toast>
                            </Box>
                        );
                    },
                });
            }
        } catch (error: any) {
            console.error('Image picker error:', error);
            const errorMessage = error?.message || 'Görsel seçilirken bir hata oluştu';
            toast.show({
                placement: 'top',
                render: ({ id }: { id: string }) => {
                    return (
                        <Box maxWidth="90%" alignSelf="center" px="$4">
                            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                                <ToastTitle>Hata</ToastTitle>
                                <ToastDescription>{errorMessage}</ToastDescription>
                            </Toast>
                        </Box>
                    );
                },
            });
        }
    };

    const handleRemoveImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleShare = async () => {
        try {
            // Validation
            if (!eventId) {
                toast.show({
                    placement: 'top',
                    render: ({ id }: { id: string }) => {
                        return (
                            <Box maxWidth="90%" alignSelf="center" px="$4">
                                <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                                    <ToastTitle>Hata</ToastTitle>
                                    <ToastDescription>Event ID bulunamadı.</ToastDescription>
                                </Toast>
                            </Box>
                        );
                    },
                });
                return;
            }

            if (!content.trim()) {
                toast.show({
                    placement: 'top',
                    render: ({ id }: { id: string }) => {
                        return (
                            <Box maxWidth="90%" alignSelf="center" px="$4">
                                <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                                    <ToastTitle>Hata</ToastTitle>
                                    <ToastDescription>Post açıklaması gereklidir.</ToastDescription>
                                </Toast>
                            </Box>
                        );
                    },
                });
                return;
            }

            // Product ID'yi al (eğer product seçildiyse)
            const productId = selectedProduct?.id;

            // API çağrısı
            const response = await createEventPostMutation.mutateAsync({
                description: content.trim(),
                productId: productId,
                images: selectedImages,
            });

            console.log('Event post created:', response);

            // Başarılı toast göster
            toast.show({
                placement: 'top',
                render: ({ id }: { id: string }) => {
                    return (
                        <Box maxWidth="90%" alignSelf="center" px="$4">
                            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                                <ToastTitle>Başarılı</ToastTitle>
                                <ToastDescription>Post başarıyla oluşturuldu!</ToastDescription>
                            </Toast>
                        </Box>
                    );
                },
            });

            // Event detail ekranına geri dön
            navigation.goBack();
        } catch (error: any) {
            console.error('Event post creation error:', error);
            
            const errorMessage = error?.response?.data?.message || 
                                error?.message || 
                                'Post oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.';
            
            toast.show({
                placement: 'top',
                render: ({ id }: { id: string }) => {
                    return (
                        <Box maxWidth="90%" alignSelf="center" px="$4">
                            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                                <ToastTitle>Hata</ToastTitle>
                                <ToastDescription>{errorMessage}</ToastDescription>
                            </Toast>
                        </Box>
                    );
                },
            });
        }
    };

    // Check if share button should be enabled
    // TYPE2 event'lerde product zaten seçili, TYPE1'de product seçilmeli
    // Her durumda content ve eventId gereklidir
    const isShareEnabled = !!eventId && 
                           content.trim().length > 0 && 
                           (eventType === EventType.TYPE2 || selectedProduct !== null);

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
                        <HStack space="sm" flexWrap="wrap">
                            {/* Display selected images */}
                            {selectedImages.map((imageUri, index) => (
                                <Box
                                    key={index}
                                    width={64}
                                    height={64}
                                    borderRadius={5}
                                    overflow="hidden"
                                    position="relative"
                                >
                                    <Image
                                        source={{ uri: imageUri }}
                                        width={64}
                                        height={64}
                                        resizeMode="cover"
                                        alt={`Selected image ${index + 1}`}
                                    />
                        <Pressable
                                        position="absolute"
                                        top={2}
                                        right={2}
                                        bg="rgba(0, 0, 0, 0.5)"
                                        borderRadius={12}
                                        width={20}
                                        height={20}
                                        justifyContent="center"
                                        alignItems="center"
                                        onPress={() => handleRemoveImage(index)}
                                    >
                                        <Feather
                                            name="x"
                                            size={12}
                                            color="#FFFFFF"
                                        />
                                    </Pressable>
                                </Box>
                            ))}

                            {/* Add Image Button */}
                            {selectedImages.length < 10 && (
                                <Pressable onPress={handleAddPhoto}>
                                    <Box
                            width={64}
                            height={64}
                                        bg={isDark ? '$backgroundDark800' : '#F5F5F5'}
                                        borderWidth={1}
                                        borderColor="#9E9E9E"
                                        borderStyle="dashed"
                                        borderRadius={5}
                            justifyContent="center"
                            alignItems="center"
                        >
                            <Feather
                                name="plus"
                                            size={24}
                                            color={isDark ? '#C1BEBF' : '#C1BEBF'}
                            />
                                    </Box>
                        </Pressable>
                            )}
                        </HStack>
                    </VStack>
                </VStack>
            </ScrollView>

        </Box>
        </SafeAreaView>
    );
};

EventCreatePost.displayName = 'EventCreatePost';

export default EventCreatePost;

