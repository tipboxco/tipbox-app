import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator } from 'react-native';
import { Box, useToast, VStack, Text } from '@gluestack-ui/themed';
import { showCustomToast } from '@/src/components/CustomToast';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { FormProvider, SubmitHandler } from 'react-hook-form';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { StepOneScreen } from '../components/CreateExperienceSteps/StepOneScreen';
import { StepTwoScreen } from '../components/CreateExperienceSteps/StepTwoScreen';
import { StepThreeScreen } from '../components/CreateExperienceSteps/StepThreeScreen';
import { SelectProduct } from '../components/CreateExperienceSteps/SelectProduct';
import { useExperiencePostForm } from '../hooks/useExperiencePostForm';
import { imagePickerService } from '@/src/services/ExpoImagePickerService';
import { useCreateExperiencePost, useSplitExperience } from '../api/hooks';
import { useCreatePostFlowStore } from '../store/createPostFlowStore';
import { mapProductInfoTypeToContextType } from '../types';
import { useAppStore } from '@/src/store/appStore';
import { useQueryClient } from '@tanstack/react-query';
import { profileKeys } from '@/src/features/profile/api/hooks';
import { invalidateCatalogPosts } from '../api/hooks';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { ProductInfoType } from '@/src/types/common';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PostStackParamList } from '../navigation';
import type { ExperiencePostFormData } from '../schemas/experiencePostSchema';

type CreateExperiencePostScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CreateExperiencePostScreenRouteProp = RouteProp<PostStackParamList, 'CreateExperiencePostScreen'>;

export const CreateExperiencePostScreen = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<CreateExperiencePostScreenNavigationProp>();
    const route = useRoute<CreateExperiencePostScreenRouteProp>();
    const { product, fromInventory, experienceOption } = route.params || {};
    
    // If product is undefined, start with SelectProduct (step 0), otherwise start with StepOneScreen (step 1)
    const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3>(product ? 1 : 0);
    const [editingField, setEditingField] = useState<'price' | 'product' | null>(null);
    
    const methods = useExperiencePostForm(
      product ? {
        selectedProduct: {
          id: product.id,
          name: product.name,
          brand: product.brand,
          description: product.description,
          image: product.image,
        },
      } : undefined
    );
    const { handleSubmit, formState, validateStep, watch, setValue, getValues } = methods;
    const toast = useToast();
    const createExperiencePostMutation = useCreateExperiencePost();
    const splitExperienceMutation = useSplitExperience();
    const { user } = useAppStore();
    const queryClient = useQueryClient();
    
    // Flow store'dan context bilgilerini al
    const contextType = useCreatePostFlowStore((state) => state.contextType);
    const contextId = useCreatePostFlowStore((state) => state.contextId);
    const productInfoSnapshot = useCreatePostFlowStore((state) => state.productInfoSnapshot);
    const clearFlow = useCreatePostFlowStore((state) => state.clearFlow);
    
    // AI split response'u sakla
    const [experienceSnippetId, setExperienceSnippetId] = useState<string | undefined>(undefined);
    
    // Loading state (sadece spinner için)
    const [isSplitLoading, setIsSplitLoading] = useState(false);
    
    const selectedProduct = watch('selectedProduct');
    const step1Duration = watch('step1Duration');
    const selectedCondition = watch('selectedCondition');
    const selectedFrequency = watch('selectedFrequency');
    const experienceText = watch('experienceText');
    const priceRating = watch('priceRating');
    const productRating = watch('productRating');

    const handleBackPress = () => {
        if (currentStep === 3) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            setCurrentStep(1);
        } else if (currentStep === 1) {
            // If we came from SelectProduct, go back to it, otherwise go to Feed
            if (!product) {
                setCurrentStep(0);
            } else {
                // Navigate to Feed screen
                // ARCHITECTURE FIX: Doğru navigation yapısı: App → MainTabs → FeedScreen
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [
                            {
                                name: 'App',
                                state: {
                                    routes: [
                                        {
                                            name: 'MainTabs',
                                            state: {
                                                routes: [{ name: 'FeedScreen' }],
                                                index: 0,
                                            },
                                        },
                                    ],
                                    index: 0,
                                },
                            },
                        ],
                    })
                );
            }
        } else if (currentStep === 0) {
            // Navigate to Feed screen
            navigation.dispatch(
                // ARCHITECTURE FIX: Doğru navigation yapısı: App → MainTabs → FeedScreen
                CommonActions.reset({
                    index: 0,
                    routes: [
                        {
                            name: 'App',
                            state: {
                                routes: [
                                    {
                                        name: 'MainTabs',
                                        state: {
                                            routes: [{ name: 'FeedScreen' }],
                                            index: 0,
                                        },
                                    },
                                ],
                                index: 0,
                            },
                        },
                    ],
                })
            );
        }
    };

    const handleNextPress = async () => {
        if (currentStep === 0) {
            const isValid = await validateStep(0);
            if (isValid) {
                setCurrentStep(1);
            }
        } else if (currentStep === 1) {
            const isValid = await validateStep(1);
            if (isValid) {
                setCurrentStep(2);
            }
        } else if (currentStep === 2) {
            const isValid = await validateStep(2);
            if (isValid) {
                // Product ID kontrolü
                if (!selectedProduct?.id) {
                    showCustomToast(toast, {
                        title: 'Error',
                        description: 'Product not selected. Please select a product.',
                        action: 'error',
                    });
                    return;
                }

                // Experience text kontrolü
                if (!experienceText || experienceText.trim().length < 10) {
                    showCustomToast(toast, {
                        title: 'Hata',
                        description: 'Deneyim metni en az 10 karakter olmalıdır.',
                        action: 'error',
                    });
                    return;
                }

                // Gemini AI split isteği
                setIsSplitLoading(true);
                
                try {
                    console.log('[CreateExperiencePostScreen] 📤 Calling split-experience API...');
                    const response = await splitExperienceMutation.mutateAsync({
                        productId: selectedProduct.id,
                        content: experienceText.trim(),
                    });

                    console.log('[CreateExperiencePostScreen] ✅ Split response received:', response);

                    // AI response'u form'a set et
                    if (response.priceAndShopping) {
                        setValue('priceExperienceText', response.priceAndShopping.content);
                        setValue('priceRating', response.priceAndShopping.rating);
                    } else {
                        setValue('priceExperienceText', '');
                        setValue('priceRating', 0);
                    }

                    if (response.productAndUsage) {
                        setValue('productExperienceText', response.productAndUsage.content);
                        setValue('productRating', response.productAndUsage.rating);
                    } else {
                        setValue('productExperienceText', '');
                        setValue('productRating', 0);
                    }

                    // experienceSnippetId'yi sakla (son adımda kullanılacak)
                    setExperienceSnippetId(response.experienceSnippetId);

                    // Step 3'e geç
                    setIsSplitLoading(false);
                    setCurrentStep(3);
                } catch (error: any) {
                    console.error('[CreateExperiencePostScreen] ❌ Split experience error:', error);
                    
                    setIsSplitLoading(false);
                    
                    // Timeout kontrolü
                    const isTimeout = error?.code === 'ECONNABORTED' || 
                                    error?.message?.includes('timeout') ||
                                    error?.message?.includes('exceeded');
                    
                    let errorMessage: string;
                    if (isTimeout) {
                        errorMessage = 'AI işlemi zaman aşımına uğradı. Lütfen tekrar deneyin veya manuel olarak devam edebilirsiniz.';
                    } else {
                        errorMessage = error?.response?.data?.message || 
                                       error?.response?.data?.error?.message ||
                                       error?.message || 
                                       'Deneyim metni işlenirken bir hata oluştu. Lütfen tekrar deneyin.';
                    }
                    
                    showCustomToast(toast, {
                        title: 'Error',
                        description: errorMessage,
                        action: 'error',
                    });
                }
            }
        }
    };

    const handleProductSelect = (product: { id: string; name: string; brand?: string; description?: string; image: any }) => {
        setValue('selectedProduct', product, { shouldValidate: true });
        setCurrentStep(1);
    };


    // Form'daki duration, condition, frequency değerlerini API ID formatına çevir
    // TODO: Backend'den experience options'ı çekip gerçek ID'leri kullan
    const mapFormValueToId = (value: string): string => {
        // Şimdilik form değerini direkt ID olarak kullanıyoruz
        // Backend'den options çekildiğinde bu mapping güncellenecek
        return value;
    };

    const onSubmit: SubmitHandler<ExperiencePostFormData> = async (data) => {
        console.log('[CreateExperiencePostScreen] Form submitted:', data);
        
        // ContextType ve contextId kontrolü
        if (!contextType || !contextId) {
            showCustomToast(toast, {
                title: 'Hata',
                description: 'Context bilgisi bulunamadı. Lütfen tekrar deneyin.',
                action: 'error',
            });
            return;
        }
        
        // Ürün kontrolü
        if (!data.selectedProduct) {
            showCustomToast(toast, {
                title: 'Error',
                description: 'Product selection is required.',
                action: 'error',
            });
            return;
        }
        
        // API contextType'a çevir
        const apiContextType = mapProductInfoTypeToContextType(contextType);
        
        // Experience array'ini oluştur
        const experience = [];
        
        // Price and shopping experience
        if (data.priceExperienceText && data.priceRating) {
            experience.push({
                type: 'price_and_shopping' as const,
                content: data.priceExperienceText,
                rating: data.priceRating,
            });
        }
        
        // Product and usage experience
        if (data.productExperienceText && data.productRating) {
            experience.push({
                type: 'product_and_usage' as const,
                content: data.productExperienceText,
                rating: data.productRating,
            });
        }
        
        // Experience array kontrolü
        if (experience.length === 0) {
            showCustomToast(toast, {
                title: 'Hata',
                description: 'En az bir deneyim kategorisi doldurulmalıdır.',
                action: 'error',
            });
            return;
        }
        
        // Status'u belirle (fromInventory ve experienceOption'a göre)
        const status: 'own' | 'tested' = (fromInventory && experienceOption === 'own') ? 'own' : 'tested';
        
        // Form değerlerini ID'lere çevir
        const selectedDurationId = mapFormValueToId(data.step1Duration);
        const selectedLocationId = mapFormValueToId(data.selectedCondition); // Condition -> Location mapping
        const selectedPurposeId = mapFormValueToId(data.selectedFrequency); // Frequency -> Purpose mapping
        
        console.log('[CreateExperiencePostScreen] Mapping form values to IDs:', {
            step1Duration: data.step1Duration,
            selectedDurationId: selectedDurationId,
            selectedCondition: data.selectedCondition,
            selectedLocationId: selectedLocationId,
            selectedFrequency: data.selectedFrequency,
            selectedPurposeId: selectedPurposeId,
        });
        
        // Zorunlu alan kontrolü
        if (!selectedDurationId || selectedDurationId.trim() === '') {
            showCustomToast(toast, {
                title: 'Error',
                description: 'Duration selection is required.',
                action: 'error',
            });
            return;
        }
        
        if (!selectedLocationId || selectedLocationId.trim() === '') {
            showCustomToast(toast, {
                title: 'Hata',
                description: 'Location seçimi zorunludur.',
                action: 'error',
            });
            return;
        }
        
        if (!selectedPurposeId || selectedPurposeId.trim() === '') {
            showCustomToast(toast, {
                title: 'Hata',
                description: 'Purpose seçimi zorunludur.',
                action: 'error',
            });
            return;
        }
        
        console.log('[CreateExperiencePostScreen] Submitting with:', {
            contextType: apiContextType,
            contextId: contextId,
            selectedDurationId: selectedDurationId,
            selectedLocationId: selectedLocationId,
            selectedPurposeId: selectedPurposeId,
            content: data.experienceText?.substring(0, 50) + '...',
            experience: experience,
            status: status,
            imagesCount: data.selectedImages?.length || 0,
            experienceSnippetId: experienceSnippetId,
        });
        
        try {
            const response = await createExperiencePostMutation.mutateAsync({
                contextType: apiContextType,
                contextId: contextId,
                selectedDurationId: selectedDurationId,
                selectedLocationId: selectedLocationId,
                selectedPurposeId: selectedPurposeId,
                content: data.experienceText,
                experience: experience,
                status: status,
                images: data.selectedImages || [],
                experienceSnippetId: experienceSnippetId, // AI split'ten gelen snippet ID
            });
            
            console.log('[CreateExperiencePostScreen] ✅ API Response:', response);
            
            // Başarılı toast göster
            showCustomToast(toast, {
                title: 'Post Created',
                description: 'Your experience post has been created successfully!',
                action: 'success',
            });
            
            // Invalidate catalog posts to refresh the feed
            if (apiContextType && contextId) {
                invalidateCatalogPosts(queryClient, apiContextType, contextId);
            }
            
            // Profil verilerini invalidate et - yeni post görünsün
            if (user?.id) {
                queryClient.invalidateQueries({
                    queryKey: profileKeys.userPosts(user.id),
                });
                queryClient.invalidateQueries({
                    queryKey: profileKeys.profile(user.id),
                });
            }
            
            // Save context info before clearing flow
            const savedContextType = contextType;
            const savedContextId = contextId;
            const savedProductInfo = productInfoSnapshot;
            
            // Clear flow context on successful submit
            clearFlow();
            
            // Navigate to PostsScreen if context is available
            // CRITICAL: Clear navigation stack to prevent going back to create post screens
            if (savedContextType && savedContextId && savedProductInfo) {
                // Determine stage from contextType
                let stage: 'SubCategories' | 'ProductGroup' | 'Product' = 'SubCategories';
                switch (savedContextType) {
                    case ProductInfoType.PRODUCT:
                        stage = 'Product';
                        break;
                    case ProductInfoType.PRODUCT_GROUP:
                        stage = 'ProductGroup';
                        break;
                    case ProductInfoType.SUB_CATEGORY:
                        stage = 'SubCategories';
                        break;
                }
                
                // Get current navigation state to preserve App state
                const currentState = navigation.getState();
                const appRoute = currentState?.routes?.find((route) => route.name === 'App');
                
                // Reset navigation stack and navigate to PostsScreen
                // This clears all create post screens from the stack
                navigation.dispatch(
                    CommonActions.reset({
                        index: 1,
                        routes: [
                            {
                                name: 'App',
                                state: appRoute?.state,
                            },
                            {
                                name: ROOT_ROUTES.POST as any,
                                state: {
                                    routes: [
                                        {
                                            name: 'PostsScreen' as any,
                                            params: {
                                                stage,
                                                name: savedProductInfo.title,
                                                productInfo: savedProductInfo,
                                                contextType: savedContextType,
                                                contextId: savedContextId,
                                            },
                                        },
                                    ],
                                    index: 0,
                                },
                            },
                        ],
                    })
                );
            } else if (user?.id) {
                // Fallback: ProfileScreen'e yönlendir
                const currentState = navigation.getState();
                const appRoute = currentState?.routes?.find((route) => route.name === 'App');
                
                navigation.dispatch(
                    CommonActions.reset({
                        index: 1,
                        routes: [
                            {
                                name: 'App',
                                state: appRoute?.state,
                            },
                            {
                                name: 'Profile',
                                params: {
                                    screen: 'ProfileMain',
                                    params: { userId: user.id },
                                },
                            },
                        ],
                    })
                );
            } else {
                // Fallback: Feed ekranına yönlendir
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [
                            {
                                name: 'App',
                                state: {
                                    routes: [
                                        {
                                            name: 'MainTabs',
                                            state: {
                                                routes: [{ name: 'FeedScreen' }],
                                                index: 0,
                                            },
                                        },
                                    ],
                                    index: 0,
                                },
                            },
                        ],
                    })
                );
            }
        } catch (error: any) {
            console.error('[CreateExperiencePostScreen] ❌ API Error:', error);
            
            // Hata toast göster
            const errorMessage = error?.response?.data?.message || 
                                error?.message || 
                                'Post oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.';
            
            showCustomToast(toast, {
                title: 'Hata',
                description: errorMessage,
                action: 'error',
            });
        }
    };

    const handleImagePicker = async () => {
        try {
            const currentImages = getValues('selectedImages') || [];
            const remainingSlots = 10 - currentImages.length;
            
            if (remainingSlots <= 0) {
                showCustomToast(toast, {
                    title: 'Limit Aşıldı',
                    description: 'Maksimum 10 görsel seçebilirsiniz.',
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
                    const updatedImages = [...currentImages, ...newImageUris];
                    setValue('selectedImages', updatedImages, { shouldValidate: true });
                } else {
                    showCustomToast(toast, {
                        title: 'Hata',
                        description: "Seçilen görsellerin URI'leri bulunamadı.",
                        action: 'error',
                    });
                }
            } else if (result.error) {
                showCustomToast(toast, {
                    title: 'Hata',
                    description: result.error,
                    action: 'error',
                });
            }
        } catch (error: any) {
            console.error('Image picker error:', error);
            const errorMessage = error?.message || 'Görsel seçilirken bir hata oluştu';
            showCustomToast(toast, {
                title: 'Hata',
                description: errorMessage,
                action: 'error',
            });
        }
    };

    const handleRemoveImage = (index: number) => {
        const images = watch('selectedImages') || [];
        const newImages = images.filter((_: string, i: number) => i !== index);
        setValue('selectedImages', newImages);
    };

    const handleEditPress = (field: 'price' | 'product') => {
        if (editingField === field) {
            setEditingField(null);
        } else {
            setEditingField(field);
        }
    };

    const handleSavePress = () => {
        setEditingField(null);
    };

    // Check if Next button should be enabled for Step 1
    const isStep1NextEnabled = step1Duration && selectedCondition && selectedFrequency;

    // Check if Next button should be enabled for Step 2
    const isStep2NextEnabled = experienceText && experienceText.trim().length > 0;

    // Check if Share button should be enabled (Both ratings selected and not editing)
    const isShareEnabled = priceRating > 0 && productRating > 0 && editingField === null;

    // Check if Next button should be enabled for SelectProduct (product selected)
    const isSelectProductNextEnabled = selectedProduct !== null;

    // Render Step 0 (SelectProduct)
    if (currentStep === 0) {
        return (
            <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
                <FormProvider {...methods}>
                    <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
                        {/* Header */}
                        <Header
                            title={fromInventory ? "Add to Inventory" : "Experience Post"}
                            leftAction="cancel"
                            onLeftActionPress={handleBackPress}
                            rightButton={{
                                text: 'Next',
                                backgroundColor: isSelectProductNextEnabled ? '#D0F205' : '#EDEDED',
                                borderWidth: 1,
                                borderColor: isSelectProductNextEnabled ? '#B8CC04' : '#B1B1B1',
                                textColor: isSelectProductNextEnabled ? '#111111' : '#B1B1B1',
                                fontSize: 12,
                                borderRadius: 25,
                                paddingX: 24,
                                paddingY: 8,
                                onPress: handleNextPress,
                            }}
                        />

                        {/* SelectProduct Content */}
                        <SelectProduct
                            onProductSelect={handleProductSelect}
                            selectedProduct={selectedProduct}
                        />
                    </Box>
                </FormProvider>
            </SafeAreaView>
        );
    }

    // Render Step 3
    if (currentStep === 3) {
        // Determine button text based on fromInventory and experienceOption
        const getButtonText = () => {
            if (editingField) {
                return 'Save';
            }
            if (fromInventory && experienceOption === 'own') {
                return 'Done';
            }
            return 'Share';
        };

        const buttonText = getButtonText();

        return (
            <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
                <FormProvider {...methods}>
                    <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
                        {/* Header */}
                        <Header
                            title="Experience Post"
                            leftAction="back"
                            onLeftActionPress={handleBackPress}
                            rightButton={
                                editingField ? {
                                    text: 'Save',
                                    backgroundColor: '#D8FF08',
                                    borderWidth: 0,
                                    borderColor: 'transparent',
                                    textColor: '#000000',
                                    fontSize: 11,
                                    borderRadius: 20,
                                    paddingX: 14,
                                    paddingY: 4,
                                    onPress: handleSavePress,
                                } : {
                                    text: buttonText,
                                    backgroundColor: isShareEnabled ? '#D0F205' : '#EDEDED',
                                    borderWidth: 1,
                                    borderColor: isShareEnabled ? '#B8CC04' : '#B1B1B1',
                                    textColor: isShareEnabled ? '#111111' : '#B1B1B1',
                                    fontSize: 12,
                                    borderRadius: 25,
                                    paddingX: 24,
                                    paddingY: 8,
                                    onPress: handleSubmit(onSubmit),
                                }
                            }
                        />

                        {/* Step 3 Content */}
                        <StepThreeScreen
                            priceExperienceText={watch('priceExperienceText') || ''}
                            productExperienceText={watch('productExperienceText') || ''}
                            priceRating={priceRating}
                            productRating={productRating}
                            onPriceExperienceTextChange={(text) => setValue('priceExperienceText', text)}
                            onProductExperienceTextChange={(text) => setValue('productExperienceText', text)}
                            onPriceRatingChange={(rating) => setValue('priceRating', rating, { shouldValidate: true })}
                            onProductRatingChange={(rating) => setValue('productRating', rating, { shouldValidate: true })}
                            selectedDuration={step1Duration || ''}
                            selectedCondition={selectedCondition || ''}
                            selectedFrequency={selectedFrequency || ''}
                            selectedImages={watch('selectedImages') || []}
                            onImagePicker={handleImagePicker}
                            onRemoveImage={handleRemoveImage}
                            onEditPress={handleEditPress}
                            editingField={editingField}
                            selectedProduct={selectedProduct}
                            fromInventory={fromInventory}
                            experienceOption={experienceOption}
                        />
                    </Box>
                </FormProvider>
            </SafeAreaView>
        );
    }

    // Render Step 2
    if (currentStep === 2) {
        const isStep2Loading = isSplitLoading || splitExperienceMutation.isPending;
        const isStep2NextDisabled = !isStep2NextEnabled || isStep2Loading;
        
        return (
            <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
                <FormProvider {...methods}>
                    <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
                        {/* Header */}
                        <Header
                            title="Experience Post"
                            leftAction="back"
                            onLeftActionPress={handleBackPress}
                            rightButton={{
                                text: isStep2Loading ? 'İşleniyor...' : 'Next',
                                backgroundColor: isStep2NextDisabled ? '#EDEDED' : '#D0F205',
                                borderWidth: 1,
                                borderColor: isStep2NextDisabled ? '#B1B1B1' : '#B8CC04',
                                textColor: isStep2NextDisabled ? '#B1B1B1' : '#111111',
                                fontSize: 12,
                                borderRadius: 25,
                                paddingX: 24,
                                paddingY: 8,
                                onPress: handleNextPress,
                                disabled: isStep2NextDisabled,
                            }}
                        />

                        {/* Step 2 Content */}
                        <Box flex={1} position="relative">
                            <StepTwoScreen
                                experienceText={experienceText || ''}
                                onExperienceTextChange={(text) => setValue('experienceText', text)}
                                selectedDuration={step1Duration || ''}
                                selectedCondition={selectedCondition || ''}
                                selectedFrequency={selectedFrequency || ''}
                                selectedImages={watch('selectedImages') || []}
                                onImagePicker={handleImagePicker}
                                onRemoveImage={handleRemoveImage}
                                selectedProduct={selectedProduct}
                            />
                            
                            {/* Loading Overlay - Sadece spinner (ekran kararmadan) */}
                            {isStep2Loading && (
                                <Box
                                    position="absolute"
                                    top={0}
                                    left={0}
                                    right={0}
                                    bottom={0}
                                    bg="transparent"
                                    justifyContent="center"
                                    alignItems="center"
                                    pointerEvents="box-none"
                                >
                                    <VStack space="md" alignItems="center" bg="transparent">
                                        <ActivityIndicator size="large" color={isDark ? '#E2FF46' : '#8B5CF6'} />
                                        <Text
                                            color={isDark ? '#FFFFFF' : '#000000'}
                                            fontSize={14}
                                            fontWeight="$medium"
                                        >
                                            Deneyim içeriği detaylandırılıyor...
                                        </Text>
                                    </VStack>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </FormProvider>
            </SafeAreaView>
        );
    }

    // Render Step 1
    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
            <FormProvider {...methods}>
                <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
                    {/* Header */}
                    <Header
                        title="Experience Post"
                        leftAction="cancel"
                        onLeftActionPress={handleBackPress}
                        rightButton={{
                            text: 'Next',
                            backgroundColor: isStep1NextEnabled ? '#D0F205' : '#EDEDED',
                            borderWidth: 1,
                            borderColor: isStep1NextEnabled ? '#B8CC04' : '#B1B1B1',
                            textColor: isStep1NextEnabled ? '#111111' : '#B1B1B1',
                            fontSize: 12,
                            borderRadius: 25,
                            paddingX: 24,
                            paddingY: 8,
                            onPress: handleNextPress,
                        }}
                    />

                    {/* Step 1 Content */}
                    <StepOneScreen
                        selectedDuration={step1Duration || ''}
                        selectedCondition={selectedCondition || ''}
                        selectedFrequency={selectedFrequency || ''}
                        onDurationChange={(value) => setValue('step1Duration', value, { shouldValidate: true })}
                        onConditionChange={(value) => setValue('selectedCondition', value, { shouldValidate: true })}
                        onFrequencyChange={(value) => setValue('selectedFrequency', value, { shouldValidate: true })}
                        selectedProduct={selectedProduct}
                    />
                </Box>
            </FormProvider>
        </SafeAreaView>
    );
};
