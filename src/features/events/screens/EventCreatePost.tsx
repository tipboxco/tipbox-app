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
import { EventType, toImageSource } from '@/src/utils';
import { EventProduct } from '@/src/mock/events/communityEvents/types';
import { AddProductFromCatalog } from '@/src/components/AddProductFromCatalog';
import { AddProductFromInventory } from '@/src/components/AddProductFromInventory';
import { Product } from '@/src/mock/catalog/productCatalog/types';
import { InventoryItem } from '@/src/features/profile/types';
import { Header } from '@/src/components/Header';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { imagePickerService } from '@/src/services/ExpoImagePickerService';
import { useCreateEventPostWithContext } from '../api/hooks';

type EventCreatePostNavigationProp = NativeStackNavigationProp<EventStackParamList, 'EventCreatePost'>;
type EventCreatePostRouteProp = RouteProp<EventStackParamList, 'EventCreatePost'>;

const EventCreatePost: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<EventCreatePostNavigationProp>();
    const route = useRoute<EventCreatePostRouteProp>();

    const [content, setContent] = useState(''); // Body field (max 2000 char)
    const [selectedProduct, setSelectedProduct] = useState<Category | null>(null);
    const [showProductSelector, setShowProductSelector] = useState(false);
    const [productSource, setProductSource] = useState<'Catalog' | 'Inventory' | null>(null);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [productStatus, setProductStatus] = useState<'own' | 'tried' | ''>('');
    const [showProductStatusDropdown, setShowProductStatusDropdown] = useState(false);
    
    // Global bottom sheet hook
    const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
    const toast = useToast();
    
    // Safe area insets (tab bar yok, EventNavigator RootNavigator'ın DetailsGroup'unda)
    const insets = useSafeAreaInsets();
    
    // Get eventId, eventType, product, productSource, and selectedProduct from route params
    const routeEventId = route.params?.eventId;
    const eventType = route.params?.eventType;
    const eventProduct = route.params?.product;
    const eventTypeRaw = route.params?.eventTypeRaw;
    const roastProduct = route.params?.roastProduct;
    const routeProductSource = route.params?.productSource;
    const selectedProductFromCatalog = route.params?.selectedProduct;
    const selectedProductFromInventory = route.params?.selectedInventoryProduct; // ✅ YENİ

    const isRoastsEvent = String(eventTypeRaw ?? '').toLowerCase() === 'roasts';
    
    // Debug log - Initial route params
    useEffect(() => {
        console.log('🚀 [EventCreatePost] Component Mount / Route Params Changed:', {
            routeParams: route.params,
            routeEventId: routeEventId || 'undefined',
            eventType: eventType || 'undefined',
            eventTypeRaw: eventTypeRaw || 'undefined',
            eventProduct: eventProduct ? 'exists' : 'undefined',
            roastProduct: roastProduct ? 'exists' : 'undefined',
            routeProductSource: routeProductSource || 'undefined',
            selectedProductFromCatalog: selectedProductFromCatalog ? 'exists' : 'undefined',
            selectedProductFromInventory: selectedProductFromInventory ? {
                id: selectedProductFromInventory.id,
                hasProductId: !!selectedProductFromInventory.productId,
                brand: selectedProductFromInventory.brand?.name,
            } : 'undefined', // ✅ YENİ
        });
    }, [
        route.params,
        routeEventId,
        eventType,
        eventTypeRaw,
        eventProduct,
        roastProduct,
        routeProductSource,
        selectedProductFromCatalog,
        selectedProductFromInventory,
    ]);
    
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
    
    // YENİ: /posts/{eventId}/post endpoint'ini kullanan mutation hook
    const createPostMutation = useCreateEventPostWithContext();
    
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

    // Auto-select product for Roasts event (EventDetail'den gelen product)
    useEffect(() => {
        if (isRoastsEvent && roastProduct?.id && roastProduct?.name) {
            const productCategory: Category = {
                id: roastProduct.id,
                name: roastProduct.name,
                image: toImageSource(roastProduct.image, require('@/assets/inventory/product_01.png')),
                category: roastProduct.shortDescription ?? roastProduct.description ?? undefined,
            };
            setSelectedProduct(productCategory);
        }
    }, [isRoastsEvent, roastProduct]);

    // Show product selector if productSource is provided (only once)
    useEffect(() => {
        if (routeProductSource && !isRoastsEvent) {
            setProductSource(routeProductSource);
            setShowProductSelector(true);
        }
    }, [routeProductSource, isRoastsEvent]);

    // handleProductSelect'i önce tanımla (handleSelectProduct'ta kullanılıyor)
    const handleProductSelect = useCallback((product: Category) => {
        setSelectedProduct(product);
        closeBottomSheet();
    }, [closeBottomSheet]);

    // handleInventoryProductSelect'i önce tanımla (useEffect ve useFocusEffect'te kullanılıyor)
    const handleInventoryProductSelect = useCallback((product: InventoryItem) => {
        console.log('🔍 [EventCreatePost] Inventory product selected (API):', {
            inventoryItemId: product.id,
            productId: product.productId,
            brand: product.brand,
            image: product.image,
            willSendInventoryId: true,
        });
        
        // Backend inventoryId'den productId'yi bulacak
        const brandName = product.brand?.name || 'Unknown';
        const brandModel = product.brand?.model || '';
        
        const productCategory: Category = {
            id: product.id, // Inventory item ID (UI'da gösterim için)
            name: brandModel ? `${brandName} ${brandModel}` : brandName,
            image: product.image,
            category: brandName,
            inventoryId: product.id, // ✅ Backend için inventory ID
        };
        
        console.log('✅ [EventCreatePost] Product category created from inventory:', {
            inventoryItemId: product.id,
            categoryId: productCategory.id,
            categoryInventoryId: productCategory.inventoryId,
            name: productCategory.name,
            inventoryId: productCategory.inventoryId,
            willSendInventoryIdToBackend: true,
            backendWillFetchProductId: true,
            CHECK: {
                hasInventoryId: !!productCategory.inventoryId ? '✅ YES' : '❌ NO',
                inventoryIdValue: productCategory.inventoryId,
            }
        });
        
        // CRITICAL: inventoryId yoksa hata ver
        if (!productCategory.inventoryId) {
            console.error('❌ [EventCreatePost] CRITICAL: inventoryId is missing after creation!');
        }
        
        setSelectedProduct(productCategory);
        setShowProductSelector(false);
        setProductSource(null);
        navigation.setParams({ productSource: undefined });
    }, [navigation]);

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

    const handleInventoryProductSelect = useCallback((product: InventoryItem) => {
        console.log('🔍 [EventCreatePost] Inventory product selected (API):', {
            inventoryItemId: product.id,
            productId: product.productId,
            brand: product.brand,
            image: product.image,
            willSendInventoryId: true,
        });
        
        // Backend inventoryId'den productId'yi bulacak
        const brandName = product.brand?.name || 'Unknown';
        const brandModel = product.brand?.model || '';
        
        const productCategory: Category = {
            id: product.id, // Inventory item ID (UI'da gösterim için)
            name: brandModel ? `${brandName} ${brandModel}` : brandName,
            image: product.image,
            category: brandName,
            inventoryId: product.id, // ✅ Backend için inventory ID
            productId: product.productId, // ✅ Backend'in beklediği productId
        };
        
        console.log('✅ [EventCreatePost] Product category created from inventory:', {
            inventoryItemId: product.id,
            categoryId: productCategory.id,
            categoryInventoryId: productCategory.inventoryId,
            categoryProductId: productCategory.productId,
            name: productCategory.name,
            inventoryId: productCategory.inventoryId,
            willSendInventoryIdToBackend: true,
            backendWillFetchProductId: true,
            CHECK: {
                hasInventoryId: !!productCategory.inventoryId ? '✅ YES' : '❌ NO',
                inventoryIdValue: productCategory.inventoryId,
                hasProductId: !!productCategory.productId ? '✅ YES' : '❌ NO',
                productIdValue: productCategory.productId,
            }
        });
        
        // CRITICAL: inventoryId yoksa hata ver
        if (!productCategory.inventoryId) {
            console.error('❌ [EventCreatePost] CRITICAL: inventoryId is missing after creation!');
        }
        // CRITICAL: productId yoksa hata ver (backend contextType=product için gerekli)
        if (!productCategory.productId) {
            console.error('❌ [EventCreatePost] CRITICAL: productId is missing on inventory item!');
        }
        
        setSelectedProduct(productCategory);
        setShowProductSelector(false);
        setProductSource(null);
        navigation.setParams({ productSource: undefined });
    }, [navigation]);
    
    // ✅ YENİ: Handle selected product from Inventory
    useEffect(() => {
        if (selectedProductFromInventory) {
            console.log('🔍 [EventCreatePost] Inventory product received from navigation:', {
                inventoryItemId: selectedProductFromInventory.id,
                productId: selectedProductFromInventory.productId,
                brand: selectedProductFromInventory.brand,
                image: selectedProductFromInventory.image,
            });
            
            // Convert route params to InventoryItem format
            const inventoryItem: InventoryItem = {
                id: selectedProductFromInventory.id,
                productId: selectedProductFromInventory.productId,
                brand: selectedProductFromInventory.brand,
                image: selectedProductFromInventory.image,
                reviews: [], // Not needed for post creation
                tags: [], // Not needed for post creation
            };
            
            handleInventoryProductSelect(inventoryItem);
            
            // Clear from params
            navigation.setParams({ selectedInventoryProduct: undefined });
        }
    }, [selectedProductFromInventory, navigation, handleInventoryProductSelect]);
    
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
            
            // ✅ YENİ: Handle inventory product from focus
            if (selectedProductFromInventory) {
                console.log('🔍 [EventCreatePost] Inventory product received on focus:', {
                    inventoryItemId: selectedProductFromInventory.id,
                    productId: selectedProductFromInventory.productId,
                });
                
                // Convert route params to InventoryItem format
                const inventoryItem: InventoryItem = {
                    id: selectedProductFromInventory.id,
                    productId: selectedProductFromInventory.productId,
                    brand: selectedProductFromInventory.brand,
                    image: selectedProductFromInventory.image,
                    reviews: [], // Not needed for post creation
                    tags: [], // Not needed for post creation
                };
                
                handleInventoryProductSelect(inventoryItem);
            }
        }, [selectedProductFromCatalog, selectedProductFromInventory, handleInventoryProductSelect])
    );

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
        console.log('🔍 [EventCreatePost] Catalog product selected:', {
            id: product.id,
            name: product.name,
            image: product.image,
            fullProduct: product,
        });
        
        const productCategory: Category = {
            id: product.id,
            name: product.name,
            image: product.image,
            category: undefined,
        };
        
        console.log('✅ [EventCreatePost] Product category created:', {
            id: productCategory.id,
            name: productCategory.name,
            category: productCategory.category,
        });
        
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

            // Roast event flow: product EventDetail'den gelir + productStatus zorunlu
            if (isRoastsEvent) {
                if (!selectedProduct) {
                    showCustomToast(toast, {
                        title: 'Error',
                        description: 'Product is missing.',
                        action: 'error',
                    });
                    return;
                }

                if (!productStatus) {
                    showCustomToast(toast, {
                        title: 'Error',
                        description: 'Please select a product status.',
                        action: 'error',
                    });
                    return;
                }

                if (!eventId) {
                    showCustomToast(toast, {
                        title: 'Error',
                        description: 'Event ID is missing. Please try again.',
                        action: 'error',
                    });
                    return;
                }

                const requestPayload = {
                    eventId,
                    body: content.trim(),
                    contextType: 'product',
                    contextId: selectedProduct.id,
                    productId: selectedProduct.id,
                    productStatus,
                    imageCount: selectedImages.length,
                    images: selectedImages.length > 0 ? selectedImages.map((uri, i) => ({
                        index: i,
                        uri: uri.substring(0, 80) + '...'
                    })) : [],
                };

                console.log('📤 [EventCreatePost] Request Payload (JSON):', JSON.stringify(requestPayload, null, 2));

                console.log('🚀 [EventCreatePost] Sending ROAST post creation request:', {
                    eventId,
                    body: content.trim().substring(0, 50) + '...',
                    bodyLength: content.trim().length,
                    productId: selectedProduct.id,
                    productStatus,
                    imageCount: selectedImages.length,
                });

                const response = await createPostMutation.mutateAsync({
                    eventId,
                    body: content.trim(),
                    contextType: 'product',
                    contextId: selectedProduct.id,
                    productId: selectedProduct.id,
                    productStatus,
                    images: selectedImages.length > 0 ? selectedImages : undefined,
                });

                console.log('✅ [EventCreatePost] Post created successfully (JSON):', JSON.stringify(response, null, 2));

                showCustomToast(toast, {
                    title: 'Success',
                    description: 'Post created successfully!',
                    action: 'success',
                });

                navigation.goBack();
                return;
            }

            // Validation - Product seçimi zorunlu (inventoryId için)
            if (!selectedProduct) {
                showCustomToast(toast, {
                    title: 'Error',
                    description: 'Please select a product before sharing.',
                    action: 'error',
                });
                return;
            }

            // Validation - inventoryId zorunlu
            if (!selectedProduct.inventoryId) {
                showCustomToast(toast, {
                    title: 'Error',
                    description: 'Please select a product from inventory.',
                    action: 'error',
                });
                return;
            }

            // Validation - productId zorunlu (inventory item içinden gelmeli)
            if (!selectedProduct.productId) {
                showCustomToast(toast, {
                    title: 'Error',
                    description: 'Selected inventory product has no productId. Please try another item.',
                    action: 'error',
                });
                return;
            }

            // Validation - eventId zorunlu
            if (!eventId) {
                showCustomToast(toast, {
                    title: 'Error',
                    description: 'Event ID is missing. Please try again.',
                    action: 'error',
                });
                return;
            }

            // Sadece inventoryId gönder - Backend her şeyi halleder
            const inventoryId = selectedProduct.inventoryId;
            const productId = selectedProduct.productId;
            
            const requestPayload = {
                eventId,
                body: content.trim(),
                contextType: 'product',
                contextId: productId,
                productId,
                inventoryId,
                imageCount: selectedImages.length,
                images: selectedImages.length > 0 ? selectedImages.map((uri, i) => ({
                    index: i,
                    uri: uri.substring(0, 80) + '...'
                })) : [],
            };
            
            console.log('📤 [EventCreatePost] Request Payload (JSON):', JSON.stringify(requestPayload, null, 2));
            
            console.log('🔍 [EventCreatePost] Request preparation:', {
                inventoryId: inventoryId,
                productId,
                selectedProduct: selectedProduct.name,
                backendWillHandle: 'optional inventoryId cross-check / lookup',
            });

            // Debug log - Request data
            console.log('🚀 [EventCreatePost] Sending post creation request:', {
                eventId,
                body: content.trim().substring(0, 50) + '...',
                bodyLength: content.trim().length,
                inventoryId,
                imageCount: selectedImages.length,
            });

            // API çağrısı - Sadece inventoryId gönder
            const response = await createPostMutation.mutateAsync({
                eventId,
                body: content.trim(),
                contextType: 'product',
                contextId: productId,
                inventoryId, // ekstra bilgi (backend isterse doğrulama/lookup yapabilir)
                images: selectedImages.length > 0 ? selectedImages : undefined,
            });

            console.log('✅ [EventCreatePost] Post created successfully (JSON):', JSON.stringify(response, null, 2));

            // Başarılı toast göster
            showCustomToast(toast, {
                title: 'Success',
                description: 'Post created successfully!',
                action: 'success',
            });

            // Event detail ekranına geri dön
            navigation.goBack();
        } catch (error: any) {
            const errorJson = {
                errorType: 'PostCreationError',
                status: error?.response?.status,
                errorData: error?.response?.data,
                errorMessage: error?.message,
                timestamp: new Date().toISOString(),
            };
            
            console.error('❌ [EventCreatePost] Post creation error (JSON):', JSON.stringify(errorJson, null, 2));
            
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
    // /posts/{eventId}/post endpoint'i için:
    // - content (body) zorunlu
    // - selectedProduct zorunlu (inventoryId için)
    // - selectedProduct.inventoryId zorunlu
    // - eventId zorunlu
    const hasContent = content.trim().length > 0;
    const hasProduct = !!selectedProduct;
    const hasInventoryId = !!selectedProduct?.inventoryId;
    const hasEventId = !!eventId;
    const hasProductStatus = !isRoastsEvent || productStatus !== '';
    
    const isShareEnabled = isRoastsEvent
        ? (hasContent && hasProduct && hasEventId && hasProductStatus)
        : (hasContent && hasProduct && hasInventoryId && hasEventId);
    
    // Debug log - Share button state kontrolü
    useEffect(() => {
        console.log('🔘 [EventCreatePost] Share Button State (DEBUG):', {
            isRoastsEvent,
            hasContent,
            hasProduct,
            hasInventoryId,
            hasEventId,
            hasProductStatus,
            productStatus,
            isShareEnabled,
            details: {
                content: content ? `"${content.substring(0, 30)}..."` : 'EMPTY',
                contentLength: content.length,
                selectedProduct: selectedProduct ? {
                    id: selectedProduct.id,
                    name: selectedProduct.name,
                    inventoryId: selectedProduct.inventoryId || 'MISSING ❌',
                    hasInventoryId: !!selectedProduct.inventoryId
                } : 'NULL ❌',
                eventId: eventId || 'MISSING ❌',
            },
            verdict: isShareEnabled ? '✅ ENABLED' : '❌ DISABLED',
        });
    }, [
        isRoastsEvent,
        hasContent,
        hasProduct,
        hasInventoryId,
        hasEventId,
        hasProductStatus,
        productStatus,
        isShareEnabled,
        eventId,
        content,
        selectedProduct,
    ]);

    // Show product selector if productSource is set
    if (showProductSelector && productSource && !isRoastsEvent) {
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
                    fontSize: 11,
                    borderRadius: 25,
                    paddingX: 16,
                    paddingY: 7,
                    onPress: handleShare,
                    disabled: !isShareEnabled,
                }}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                onScrollBeginDrag={() => setShowProductStatusDropdown(false)}
            >
                <VStack space="lg" p="$4">
                    {/* Select Product Button or Selected Product Card */}
                    {/* Roasts: product EventDetail'den gelir, değiştirilemez */}
                    {isRoastsEvent && selectedProduct && (
                        <ProductInfoCard
                            size="big"
                            type={ProductInfoType.PRODUCT}
                            image={selectedProduct.image}
                            title={selectedProduct.name}
                            subName={selectedProduct.category}
                        />
                    )}

                    {/* Show product selection if eventType is TYPE1 or undefined (default events) */}
                    {!isRoastsEvent && (eventType === EventType.TYPE1 || eventType === undefined) && (
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
                    {!isRoastsEvent && eventType === EventType.TYPE2 && selectedProduct && (
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

                    {/* Product Status (Roasts) */}
                    {isRoastsEvent ? (
                        <VStack space="xs" position="relative">
                            <Text
                                color={isDark ? '$textDark200' : '#999999'}
                                fontSize={14}
                            >
                                Product Status
                            </Text>

                            <Pressable onPress={() => setShowProductStatusDropdown((v) => !v)}>
                                <Box
                                    bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                                    borderWidth={1}
                                    borderColor="#E9E9E9"
                                    borderTopLeftRadius={10}
                                    borderTopRightRadius={10}
                                    borderBottomLeftRadius={showProductStatusDropdown ? 0 : 10}
                                    borderBottomRightRadius={showProductStatusDropdown ? 0 : 10}
                                    height={44}
                                    px={16}
                                    justifyContent="center"
                                >
                                    <HStack
                                        flex={1}
                                        alignItems="center"
                                        justifyContent="space-between"
                                    >
                                        <Text
                                            color={
                                                productStatus
                                                    ? (isDark ? '$textDark50' : '#000000')
                                                    : (isDark ? '#8C8C8C' : '#8C8C8C')
                                            }
                                            fontSize="$sm"
                                            fontWeight="$medium"
                                            flex={1}
                                        >
                                            {productStatus === 'own'
                                                ? 'I Own the Product'
                                                : productStatus === 'tried'
                                                    ? 'Tried / Tested'
                                                    : 'Product Status'}
                                        </Text>
                                        <Feather
                                            name={showProductStatusDropdown ? 'chevron-up' : 'chevron-down'}
                                            size={20}
                                            color="#000000"
                                        />
                                    </HStack>
                                </Box>
                            </Pressable>

                            {showProductStatusDropdown && (
                                <Box
                                    bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                                    borderWidth={1}
                                    borderColor="#E9E9E9"
                                    borderTopWidth={0}
                                    borderTopLeftRadius={0}
                                    borderTopRightRadius={0}
                                    borderBottomLeftRadius={10}
                                    borderBottomRightRadius={10}
                                    overflow="hidden"
                                >
                                    <VStack>
                                        <Pressable
                                            onPress={() => {
                                                setProductStatus('own');
                                                setShowProductStatusDropdown(false);
                                            }}
                                        >
                                            <HStack px="$3" py="$3" alignItems="center" space="sm">
                                                <Text
                                                    color={isDark ? '$textDark50' : '#2F2F2F'}
                                                    fontSize="$sm"
                                                    fontWeight="$medium"
                                                >
                                                    I Own the Product
                                                </Text>
                                            </HStack>
                                        </Pressable>
                                        <Box height={1} bg="#E9E9E9" width="100%" />
                                        <Pressable
                                            onPress={() => {
                                                setProductStatus('tried');
                                                setShowProductStatusDropdown(false);
                                            }}
                                        >
                                            <HStack px="$3" py="$3" alignItems="center" space="sm">
                                                <Text
                                                    color={isDark ? '$textDark50' : '#2F2F2F'}
                                                    fontSize="$sm"
                                                    fontWeight="$medium"
                                                >
                                                    Tried / Tested
                                                </Text>
                                            </HStack>
                                        </Pressable>
                                    </VStack>
                                </Box>
                            )}
                        </VStack>
                    ) : null}

                    {/* Images Section */}
                    <VStack space="xs">
                        <Text
                            color={isDark ? '$textDark200' : '#999999'}
                            fontSize={14}
                        >
                            Images (Optional)
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
                </VStack>
            </ScrollView>

        </Box>
        </SafeAreaView>
    );
};

EventCreatePost.displayName = 'EventCreatePost';

export default EventCreatePost;

