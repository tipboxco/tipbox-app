import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
    Image,
} from '@gluestack-ui/themed';
import { showCustomToast } from '@/src/components/CustomToast';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { EventStackParamList } from '../EventNavigator';
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
import { imagePickerService } from '@/src/services/ExpoImagePickerService';
import { useCreateEventPostNew } from '../api/hooks';
import { useCreateFreePost } from '@/src/features/post/api/hooks';
import type { ApiContextType } from '@/src/features/post/types';

type EventCreatePostNavigationProp = NativeStackNavigationProp<EventStackParamList, 'EventCreatePost'>;
type EventCreatePostRouteProp = RouteProp<EventStackParamList, 'EventCreatePost'>;

const EventCreatePost: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<EventCreatePostNavigationProp>();
    const route = useRoute<EventCreatePostRouteProp>();

    const [title, setTitle] = useState(''); // YENİ: Title field (max 200 char)
    const [content, setContent] = useState(''); // Body field (max 2000 char)
    const [selectedProduct, setSelectedProduct] = useState<Category | null>(null);
    const [showProductSelector, setShowProductSelector] = useState(false);
    const [productSource, setProductSource] = useState<'Catalog' | 'Inventory' | null>(null);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    
    // Global bottom sheet hook
    const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
    const toast = useToast();
    
    // Safe area insets (tab bar yok, EventNavigator RootNavigator'ın DetailsGroup'unda)
    const insets = useSafeAreaInsets();
    
    // Get eventId, eventType, product, productSource, and selectedProduct from route params
    const routeEventId = route.params?.eventId;
    const eventType = route.params?.eventType;
    const eventProduct = route.params?.product;
    const routeProductSource = route.params?.productSource;
    const selectedProductFromCatalog = route.params?.selectedProduct;
    
    // Debug log - Initial route params
    useEffect(() => {
        console.log('🚀 [EventCreatePost] Component Mount / Route Params Changed:', {
            routeParams: route.params,
            routeEventId: routeEventId || 'undefined',
            eventType: eventType || 'undefined',
            eventProduct: eventProduct ? 'exists' : 'undefined',
            routeProductSource: routeProductSource || 'undefined',
            selectedProductFromCatalog: selectedProductFromCatalog ? 'exists' : 'undefined',
        });
    }, [route.params, routeEventId, eventType, eventProduct, routeProductSource, selectedProductFromCatalog]);
    
    // Store eventId in state to preserve it when navigating from Catalog/Inventory
    // eventId is preserved in state so it remains available when user navigates to Catalog/Inventory
    // and comes back to EventCreatePost
    // Use useRef to persist eventId across navigation changes
    const eventIdRef = useRef<string | undefined>(routeEventId);
    const [eventId, setEventId] = useState<string | undefined>(routeEventId);
    
    // Try to get eventId from navigation state if route params don't have it (initial mount)
    useEffect(() => {
        if (!routeEventId && !eventId) {
            try {
                const navState = navigation.getState();
                // Find EventCreatePost in navigation state
                const findEventCreatePost = (routes: any[]): any => {
                    for (const route of routes) {
                        if (route.name === 'EventCreatePost' && route.params?.eventId) {
                            return route.params.eventId;
                        }
                        if (route.state?.routes) {
                            const found = findEventCreatePost(route.state.routes);
                            if (found) return found;
                        }
                    }
                    return null;
                };
                const eventIdFromState = findEventCreatePost(navState.routes || []);
                if (eventIdFromState) {
                    console.log('🔄 [EventCreatePost] Found eventId from navigation state:', eventIdFromState);
                    setEventId(eventIdFromState);
                    eventIdRef.current = eventIdFromState;
                }
            } catch (error) {
                console.warn('[EventCreatePost] Failed to get eventId from navigation state:', error);
            }
        }
    }, []); // Only run once on mount
    
    // Update ref when route params change
    useEffect(() => {
        if (routeEventId) {
            eventIdRef.current = routeEventId;
        }
    }, [routeEventId]);
    
    // Debug log - eventId state tracking
    useEffect(() => {
        console.log('🔍 [EventCreatePost] eventId State Update:', {
            routeEventId: routeEventId || 'undefined',
            stateEventId: eventId || 'undefined',
            refEventId: eventIdRef.current || 'undefined',
            willUpdate: !!routeEventId,
            willPreserve: !routeEventId && !!eventId,
        });
    }, [routeEventId, eventId]);
    
    // Update eventId when route params change, but preserve if route params don't have it
    // This ensures eventId is preserved when navigating from Catalog/Inventory screens
    useEffect(() => {
        if (routeEventId) {
            console.log('✅ [EventCreatePost] Updating eventId from route params:', routeEventId);
            setEventId(routeEventId);
            eventIdRef.current = routeEventId;
        } else if (eventIdRef.current && !eventId) {
            // If route params don't have eventId but ref has it, restore from ref
            console.log('🔄 [EventCreatePost] Restoring eventId from ref:', eventIdRef.current);
            setEventId(eventIdRef.current);
        } else if (!routeEventId && eventId) {
            // Preserve existing state eventId
            console.log('⚠️ [EventCreatePost] No eventId in route params, preserving state:', eventId);
        }
    }, [routeEventId, eventId]);
    
    // YENİ: Free post mutation hook (/posts/free endpoint kullanır)
    // Bu endpoint eventId'yi optional olarak alır ve contextType/contextId gerektirir
    const createFreePostMutation = useCreateFreePost();
    
    // Debug log - eventId validation before API call
    useEffect(() => {
        if (!eventId) {
            console.warn('⚠️ [EventCreatePost] eventId is undefined! Post will be created without eventId.');
        }
    }, [eventId]);
    
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

    // Handle selected product from CatalogScreen or InventoryScreen
    // selectedProduct is stored in state and preserved when navigating back from Catalog/Inventory
    useEffect(() => {
        if (selectedProductFromCatalog) {
            const productCategory: Category = {
                id: selectedProductFromCatalog.id,
                name: selectedProductFromCatalog.name,
                image: selectedProductFromCatalog.image,
                category: undefined,
            };
            setSelectedProduct(productCategory);
            setShowProductSelector(false);
            setProductSource(null);
            // Clear route params to prevent re-triggering
            navigation.setParams({ selectedProduct: undefined });
        }
    }, [selectedProductFromCatalog, navigation]);
    
    // Handle focus effect - when returning from Catalog/Inventory, update params
    // This ensures params are updated even if navigation.goBack() was used
    useFocusEffect(
        useCallback(() => {
            // When screen comes into focus, check if selectedProduct param exists
            // This handles the case when we navigate back from Catalog/Inventory
            if (selectedProductFromCatalog) {
                const productCategory: Category = {
                    id: selectedProductFromCatalog.id,
                    name: selectedProductFromCatalog.name,
                    image: selectedProductFromCatalog.image,
                    category: undefined,
                };
                setSelectedProduct(productCategory);
                setShowProductSelector(false);
                setProductSource(null);
            }
        }, [selectedProductFromCatalog])
    );

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
                animateOnMount: false, // PERFORMANCE FIX: Disabled for instant opening
                paddingBottom: insets.bottom + 8,
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
                showCustomToast(toast, {
                    title: 'Limit Exceeded',
                    description: 'You can select a maximum of 10 images.',
                    action: 'error',
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
                    showCustomToast(toast, {
                        title: 'Error',
                        description: 'Could not find URIs of selected images.',
                        action: 'error',
                    });
                }
            } else if (result.error) {
                showCustomToast(toast, {
                    title: 'Error',
                    description: result.error,
                    action: 'error',
                });
            }
        } catch (error: any) {
            console.error('Image picker error:', error);
            const errorMessage = error?.message || 'An error occurred while selecting images';
            showCustomToast(toast, {
                title: 'Error',
                description: errorMessage,
                action: 'error',
            });
        }
    };

    const handleRemoveImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleShare = async () => {
        try {
            // Validation - Content is required
            if (!content.trim()) {
                showCustomToast(toast, {
                    title: 'Error',
                    description: 'Content is required.',
                    action: 'error',
                });
                return;
            }

            // Validation - Product seçimi zorunlu (contextType ve contextId için)
            if (!selectedProduct) {
                showCustomToast(toast, {
                    title: 'Error',
                    description: 'Please select a product before sharing.',
                    action: 'error',
                });
                return;
            }

            // Title ve content'i birleştirerek description oluştur
            // Eğer title varsa, title + content şeklinde birleştir
            const description = title.trim() 
                ? `${title.trim()}\n\n${content.trim()}`
                : content.trim();

            // ContextType ve contextId belirleme
            // Product seçildiğinde, contextType'ı "product" olarak varsay
            // Kullanıcının gösterdiği örnekte "product_group" var ama şu anda Category interface'inde bu bilgi yok
            // Şimdilik "product" olarak kullanacağız, gerekirse daha sonra güncellenebilir
            const contextType: ApiContextType = 'product'; // Varsayılan olarak "product"
            const contextId = selectedProduct.id;

            // YENİ API çağrısı - /posts/free endpoint'ini kullan
            const response = await createFreePostMutation.mutateAsync({
                contextType,
                contextId,
                description,
                images: selectedImages.length > 0 ? selectedImages : undefined,
                eventId: eventId || undefined, // Optional - eventId varsa gönder
            });

            console.log('Event post created:', response);

            // Başarılı toast göster
            showCustomToast(toast, {
                title: 'Success',
                description: 'Post created successfully!',
                action: 'success',
            });

            // Event detail ekranına geri dön
            navigation.goBack();
        } catch (error: any) {
            console.error('Event post creation error:', error);
            
            // Backend hata mesajlarını parse et
            const errorCode = error?.response?.data?.error?.code;
            const errorMessage = error?.response?.data?.error?.message || error?.response?.data?.message;
            
            let displayMessage = 'An error occurred while creating the post. Please try again.';
            
            switch (errorCode) {
                case 'EVENT_NOT_FOUND':
                    displayMessage = 'Event not found';
                    break;
                case 'NOT_JOINED':
                    displayMessage = 'You must join this event before sharing a post';
                    break;
                case 'VALIDATION_ERROR':
                    displayMessage = errorMessage || 'Please fill in all fields';
                    break;
                default:
                    displayMessage = errorMessage || displayMessage;
            }
            
            showCustomToast(toast, {
                title: 'Error',
                description: displayMessage,
                action: 'error',
            });
        }
    };

    // Check if share button should be enabled
    // /posts/free endpoint'i için:
    // - content (description) zorunlu
    // - selectedProduct zorunlu (contextType ve contextId için)
    // - eventId opsiyonel
    const hasContent = content.trim().length > 0;
    const hasProduct = !!selectedProduct;
    
    const isShareEnabled = hasContent && hasProduct;
    
    // Debug log - Share button state kontrolü
    useEffect(() => {
        console.log('🔍 [EventCreatePost] Share Button State:', {
            hasContent,
            hasProduct,
            isShareEnabled,
            eventId: eventId || 'undefined',
            title: title || 'empty',
            titleLength: title.length,
            titleTrimmed: title.trim().length,
            content: content || 'empty',
            contentLength: content.length,
            contentTrimmed: content.trim().length,
            selectedProduct: selectedProduct ? {
                id: selectedProduct.id,
                name: selectedProduct.name
            } : 'null',
            routeParams: {
                eventId: route.params?.eventId || 'undefined',
                eventType: route.params?.eventType || 'undefined',
                selectedProduct: route.params?.selectedProduct ? 'exists' : 'undefined',
            },
            state: {
                eventId: eventId || 'undefined',
                title: title || 'empty',
                content: content || 'empty',
            }
        });
    }, [hasContent, hasProduct, isShareEnabled, eventId, title, content, selectedProduct, route.params]);

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
                    disabled: !isShareEnabled,
                }}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                <VStack space="lg" p="$4">
                    {/* Title Field - YENİ (EVENT_GUIDE.MD Section 3.1) */}
                    <VStack space="xs">
                        <Text
                            color={isDark ? '$textDark200' : '#999999'}
                            fontSize={14}
                        >
                            Post Title
                        </Text>
                        <Textarea
                            bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                            borderWidth={1}
                            borderColor={isDark ? '#333' : '#D9D9D9'}
                            borderRadius={8}
                            height={60}
                        >
                            <TextareaInput
                                placeholder="Enter title... (max 200 characters)"
                                value={title}
                                onChangeText={(text) => {
                                    if (text.length <= 200) {
                                        setTitle(text);
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
                            {title.length}/200
                        </Text>
                    </VStack>
                    
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

                    {/* Post Description (Body - max 2000 char) */}
                    <VStack space="xs">
                        <Text
                            color={isDark ? '$textDark200' : '#999999'}
                            fontSize={14}
                        >
                            Content
                        </Text>
                        <Textarea
                            bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                            borderWidth={1}
                            borderColor={isDark ? '#333' : '#D9D9D9'}
                            borderRadius={8}
                            height={180}
                        >
                            <TextareaInput
                                placeholder="Write your content... (max 2000 characters)"
                                value={content}
                                onChangeText={(text) => {
                                    if (text.length <= 2000) {
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
                            {content.length}/2000
                        </Text>
                    </VStack>

                    {/* Images Section - OPSIYONEL (şimdilik UI'da var ama yeni API'de image desteği yok) */}
                    {/* YENİ API'de images field'ı yok, bu bölümü gizliyoruz */}
                    {/* 
                    <VStack space="xs">
                        <Text
                            color={isDark ? '$textDark200' : '#999999'}
                            fontSize={14}
                        >
                            Images
                        </Text>
                        <HStack space="sm" flexWrap="wrap">
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
                    */}
                </VStack>
            </ScrollView>

        </Box>
        </SafeAreaView>
    );
};

EventCreatePost.displayName = 'EventCreatePost';

export default EventCreatePost;

