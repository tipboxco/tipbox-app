import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from '@gluestack-ui/themed';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { FormProvider } from 'react-hook-form';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { StepOneScreen } from '../components/CreateExperienceSteps/StepOneScreen';
import { StepTwoScreen } from '../components/CreateExperienceSteps/StepTwoScreen';
import { StepThreeScreen } from '../components/CreateExperienceSteps/StepThreeScreen';
import { SelectProduct } from '../components/CreateExperienceSteps/SelectProduct';
import { useExperiencePostForm } from '../hooks/useExperiencePostForm';
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
    const { handleSubmit, formState, validateStep, watch, setValue } = methods;
    
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
                navigation.navigate('Main', {
                    screen: 'Feed',
                    params: {
                        screen: 'FeedScreen',
                    },
                });
            }
        } else if (currentStep === 0) {
            // Navigate to Feed screen
            navigation.navigate('Main', {
                screen: 'Feed',
                params: {
                    screen: 'FeedScreen',
                },
            });
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
                // TODO: Backend'den AI ile ayrılmış metinleri al
                // Şimdilik mock data kullanıyoruz
                setValue('priceExperienceText', 'Price and shopping experience summary...');
                setValue('productExperienceText', 'Product and usage experience summary...');
                setCurrentStep(3);
            }
        }
    };

    const handleProductSelect = (product: { id: string; name: string; brand?: string; description?: string; image: any }) => {
        setValue('selectedProduct', product, { shouldValidate: true });
        setCurrentStep(1);
    };

    const onSubmit = (data: ExperiencePostFormData) => {
        console.log('Form submitted:', data);
        // TODO: Backend entegrasyonu
    };

    const handleImagePicker = () => {
        console.log('Open image picker');
        // TODO: Implement image picker
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
                                backgroundColor: isStep2NextEnabled ? '#D0F205' : '#EDEDED',
                                borderWidth: 1,
                                borderColor: isStep2NextEnabled ? '#B8CC04' : '#B1B1B1',
                                textColor: isStep2NextEnabled ? '#111111' : '#B1B1B1',
                                fontSize: 12,
                                borderRadius: 25,
                                paddingX: 24,
                                paddingY: 8,
                                onPress: handleNextPress,
                            }}
                        />

                        {/* Step 2 Content */}
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
