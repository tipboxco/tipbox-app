import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Keyboard } from 'react-native';
import { Box, useToast, Toast, ToastTitle, ToastDescription, VStack, Text } from '@gluestack-ui/themed';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { FormProvider } from 'react-hook-form';
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
    
    // Get context information from flow store
    const contextType = useCreatePostFlowStore((state) => state.contextType);
    const contextId = useCreatePostFlowStore((state) => state.contextId);
    const clearFlow = useCreatePostFlowStore((state) => state.clearFlow);
    
    // Store AI split response
    const [experienceSnippetId, setExperienceSnippetId] = useState<string | undefined>(undefined);
    
    // Loading state (only for spinner)
    const [isSplitLoading, setIsSplitLoading] = useState(false);
    
    const selectedProduct = watch('selectedProduct');
    const step1Duration = watch('step1Duration');
    const selectedCondition = watch('selectedCondition');
    const selectedFrequency = watch('selectedFrequency');
    const experienceText = watch('experienceText');
    const priceRating = watch('priceRating');
    const productRating = watch('productRating');

    const handleBackPress = () => {
        // If we're in a multi-step flow, go back to previous step
        if (currentStep === 3) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            setCurrentStep(1);
        } else if (currentStep === 1) {
            // If we came from SelectProduct, go back to it, otherwise go to previous screen
            if (!product) {
                setCurrentStep(0);
            } else {
                // Go back to previous screen
                if (navigation.canGoBack()) {
                    navigation.goBack();
                } else {
                    // Fallback: Navigate to Feed screen
                    navigation.navigate('Main', {
                        screen: 'Feed',
                        params: {
                            screen: 'FeedScreen',
                        },
                    });
                }
            }
        } else if (currentStep === 0) {
            // Go back to previous screen
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                // Fallback: Navigate to Feed screen
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [
                            {
                                name: 'Main',
                                state: {
                                    routes: [
                                        {
                                            name: 'Feed',
                                            state: {
                                                routes: [{ name: 'FeedScreen' }],
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
        }
    };

    const handleNextPress = async () => {
        // Dismiss keyboard
        Keyboard.dismiss();
        
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
                // Product ID validation
                if (!selectedProduct?.id) {
                    toast.show({
                        placement: 'top',
                        render: ({ id }: { id: string }) => (
                            <Box maxWidth="90%" alignSelf="center" px="$4">
                                <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                                    <ToastTitle>Error</ToastTitle>
                                    <ToastDescription>Product not selected. Please select a product.</ToastDescription>
                                </Toast>
                            </Box>
                        ),
                    });
                    return;
                }

                // Experience text validation
                if (!experienceText || experienceText.trim().length < 10) {
                    toast.show({
                        placement: 'top',
                        render: ({ id }: { id: string }) => (
                            <Box maxWidth="90%" alignSelf="center" px="$4">
                                <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                                    <ToastTitle>Error</ToastTitle>
                                    <ToastDescription>Experience text must be at least 10 characters.</ToastDescription>
                                </Toast>
                            </Box>
                        ),
                    });
                    return;
                }

                // Gemini AI split request
                setIsSplitLoading(true);
                
                try {
                    console.log('[CreateExperiencePostScreen] 📤 Calling split-experience API...');
                    const response = await splitExperienceMutation.mutateAsync({
                        productId: selectedProduct.id,
                        content: experienceText.trim(),
                    });

                    console.log('[CreateExperiencePostScreen] ✅ Split response received:', response);

                    // Set AI response to form
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

                    // Store experienceSnippetId (will be used in final step)
                    setExperienceSnippetId(response.experienceSnippetId);

                    // Move to Step 3
                    setIsSplitLoading(false);
                    setCurrentStep(3);
                } catch (error: any) {
                    console.error('[CreateExperiencePostScreen] ❌ Split experience error:', error);
                    
                    setIsSplitLoading(false);
                    
                    // Timeout check
                    const isTimeout = error?.code === 'ECONNABORTED' || 
                                    error?.message?.includes('timeout') ||
                                    error?.message?.includes('exceeded');
                    
                    let errorMessage: string;
                    if (isTimeout) {
                        errorMessage = 'AI processing timed out. Please try again or continue manually.';
                    } else {
                        errorMessage = error?.response?.data?.message || 
                                       error?.response?.data?.error?.message ||
                                       error?.message || 
                                       'An error occurred while processing experience text. Please try again.';
                    }
                    
                    toast.show({
                        placement: 'top',
                        render: ({ id }: { id: string }) => (
                            <Box maxWidth="90%" alignSelf="center" px="$4">
                                <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                                    <ToastTitle>Hata</ToastTitle>
                                    <ToastDescription>{errorMessage}</ToastDescription>
                                </Toast>
                            </Box>
                        ),
                    });
                }
            }
        }
    };

    const handleProductSelect = (product: { id: string; name: string; brand?: string; description?: string; image: any }) => {
        setValue('selectedProduct', product, { shouldValidate: true });
        setCurrentStep(1);
    };


    // Convert duration, condition, frequency values from form to API ID format
    // TODO: Fetch experience options from backend and use real IDs
    const mapFormValueToId = (value: string): string => {
        // For now, we use the form value directly as ID
        // This mapping will be updated when options are fetched from backend
        return value;
    };

    const onSubmit = async (data: ExperiencePostFormData) => {
        console.log('[CreateExperiencePostScreen] Form submitted:', data);
        
        // ContextType and contextId validation
        if (!contextType || !contextId) {
            toast.show({
                placement: 'top',
                render: ({ id }: { id: string }) => {
                    return (
                        <Box maxWidth="90%" alignSelf="center" px="$4">
                            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                                <ToastTitle>Error</ToastTitle>
                                <ToastDescription>Context information not found. Please try again.</ToastDescription>
                            </Toast>
                        </Box>
                    );
                },
            });
            return;
        }
        
        // Product validation
        if (!data.selectedProduct) {
            toast.show({
                placement: 'top',
                render: ({ id }: { id: string }) => {
                    return (
                        <Box maxWidth="90%" alignSelf="center" px="$4">
                            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                                <ToastTitle>Error</ToastTitle>
                                <ToastDescription>Product selection is required.</ToastDescription>
                            </Toast>
                        </Box>
                    );
                },
            });
            return;
        }
        
        // Convert to API contextType
        const apiContextType = mapProductInfoTypeToContextType(contextType);
        
        // Create experience array
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
        
        // Experience array validation
        if (experience.length === 0) {
            toast.show({
                placement: 'top',
                render: ({ id }: { id: string }) => {
                    return (
                        <Box maxWidth="90%" alignSelf="center" px="$4">
                            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                                <ToastTitle>Error</ToastTitle>
                                <ToastDescription>At least one experience category must be filled.</ToastDescription>
                            </Toast>
                        </Box>
                    );
                },
            });
            return;
        }
        
        // Determine status (based on fromInventory and experienceOption)
        const status: 'own' | 'tested' = (fromInventory && experienceOption === 'own') ? 'own' : 'tested';
        
        // Convert form values to IDs
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
        
        // Required field validation
        if (!selectedDurationId || selectedDurationId.trim() === '') {
            toast.show({
                placement: 'top',
                render: ({ id }: { id: string }) => {
                    return (
                        <Box maxWidth="90%" alignSelf="center" px="$4">
                            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                                <ToastTitle>Error</ToastTitle>
                                <ToastDescription>Duration selection is required.</ToastDescription>
                            </Toast>
                        </Box>
                    );
                },
            });
            return;
        }
        
        if (!selectedLocationId || selectedLocationId.trim() === '') {
            toast.show({
                placement: 'top',
                render: ({ id }: { id: string }) => {
                    return (
                        <Box maxWidth="90%" alignSelf="center" px="$4">
                            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                                <ToastTitle>Error</ToastTitle>
                                <ToastDescription>Location selection is required.</ToastDescription>
                            </Toast>
                        </Box>
                    );
                },
            });
            return;
        }
        
        if (!selectedPurposeId || selectedPurposeId.trim() === '') {
            toast.show({
                placement: 'top',
                render: ({ id }: { id: string }) => {
                    return (
                        <Box maxWidth="90%" alignSelf="center" px="$4">
                            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                                <ToastTitle>Error</ToastTitle>
                                <ToastDescription>Purpose selection is required.</ToastDescription>
                            </Toast>
                        </Box>
                    );
                },
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
                experienceSnippetId: experienceSnippetId, // Snippet ID from AI split
            });
            
            console.log('[CreateExperiencePostScreen] ✅ API Response:', response);
            
            // Show success toast
            toast.show({
                placement: 'top',
                render: ({ id }: { id: string }) => {
                    return (
                        <Box maxWidth="90%" alignSelf="center" px="$4">
                            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                                <ToastTitle>Post Created</ToastTitle>
                                <ToastDescription>Your experience post has been created successfully!</ToastDescription>
                            </Toast>
                        </Box>
                    );
                },
            });
            
            // Clear flow context on successful submit
            clearFlow();
            
            // If successful, navigate to Feed screen so user can see their post
            // Clear navigation stack using CommonActions.reset
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [
                        {
                            name: 'Main',
                            state: {
                                routes: [
                                    {
                                        name: 'Feed',
                                        state: {
                                            routes: [{ name: 'FeedScreen' }],
                                        },
                                    },
                                ],
                                index: 0,
                            },
                        },
                    ],
                })
            );
        } catch (error: any) {
            console.error('[CreateExperiencePostScreen] ❌ API Error:', error);
            
            // Show error toast
            const errorMessage = error?.response?.data?.message || 
                                error?.message || 
                                'An error occurred while creating the post. Please try again.';
            
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

    const handleImagePicker = async () => {
        try {
            const currentImages = getValues('selectedImages') || [];
            const remainingSlots = 10 - currentImages.length;
            
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
                    const updatedImages = [...currentImages, ...newImageUris];
                    setValue('selectedImages', updatedImages, { shouldValidate: true });
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
                                text: 'Next',
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
                            
                            {/* Loading Overlay - Only spinner (no screen darkening) */}
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
                                            Processing experience content...
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
