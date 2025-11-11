import React, { useState } from 'react';
import { Box } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { StepOneScreen } from '../components/CreateExperienceSteps/StepOneScreen';
import { StepTwoScreen } from '../components/CreateExperienceSteps/StepTwoScreen';
import { StepThreeScreen } from '../components/CreateExperienceSteps/StepThreeScreen';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type CreateExperiencePostScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CreateExperiencePostScreen = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<CreateExperiencePostScreenNavigationProp>();
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    
    // Step 1 states
    const [selectedDuration, setSelectedDuration] = useState<string>('');
    const [selectedCondition, setSelectedCondition] = useState<string>('');
    const [selectedFrequency, setSelectedFrequency] = useState<string>('');
    
    // Step 2 states
    const [experienceText, setExperienceText] = useState('');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    
    // Step 3 states
    const [priceExperienceText, setPriceExperienceText] = useState('');
    const [productExperienceText, setProductExperienceText] = useState('');
    const [priceRating, setPriceRating] = useState<number>(0);
    const [productRating, setProductRating] = useState<number>(0);
    const [editingField, setEditingField] = useState<'price' | 'product' | null>(null);

    const handleBackPress = () => {
        if (currentStep === 3) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            setCurrentStep(1);
        } else {
            // Navigate to Feed screen
            navigation.navigate('Main', {
                screen: 'Feed',
                params: {
                    screen: 'FeedScreen',
                },
            });
        }
    };

    const handleNextPress = () => {
        if (currentStep === 1 && isStep1NextEnabled) {
            setCurrentStep(2);
        } else if (currentStep === 2 && isStep2NextEnabled) {
            // TODO: Backend'den AI ile ayrılmış metinleri al
            // Şimdilik mock data kullanıyoruz
            setPriceExperienceText('Price and shopping experience summary...');
            setProductExperienceText('Product and usage experience summary...');
            setCurrentStep(3);
        }
    };

    const handleSharePress = () => {
        console.log('Share pressed');
        // Handle share action
    };

    const handleImagePicker = () => {
        console.log('Open image picker');
        // TODO: Implement image picker
    };

    const handleRemoveImage = (index: number) => {
        setSelectedImages(selectedImages.filter((_, i) => i !== index));
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

    // Check if Next button should be enabled for Step 1 (All 3 selectboxes filled)
    const isStep1NextEnabled = selectedDuration.length > 0 && selectedCondition.length > 0 && selectedFrequency.length > 0;

    // Check if Next button should be enabled for Step 2 (Experience text filled)
    const isStep2NextEnabled = experienceText.trim().length > 0;

    // Check if Share button should be enabled (Both ratings selected and not editing)
    const isShareEnabled = priceRating > 0 && productRating > 0 && editingField === null;

    // Render Step 3
    if (currentStep === 3) {
        return (
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
                            text: 'Share',
                            backgroundColor: isShareEnabled ? '#D0F205' : '#EDEDED',
                            borderWidth: 1,
                            borderColor: isShareEnabled ? '#B8CC04' : '#B1B1B1',
                            textColor: isShareEnabled ? '#111111' : '#B1B1B1',
                            fontSize: 12,
                            borderRadius: 25,
                            paddingX: 24,
                            paddingY: 8,
                            onPress: handleSharePress,
                        }
                    }
                />

                {/* Step 3 Content */}
                <StepThreeScreen
                    priceExperienceText={priceExperienceText}
                    productExperienceText={productExperienceText}
                    priceRating={priceRating}
                    productRating={productRating}
                    onPriceExperienceTextChange={setPriceExperienceText}
                    onProductExperienceTextChange={setProductExperienceText}
                    onPriceRatingChange={setPriceRating}
                    onProductRatingChange={setProductRating}
                    selectedDuration={selectedDuration}
                    selectedCondition={selectedCondition}
                    selectedFrequency={selectedFrequency}
                    selectedImages={selectedImages}
                    onImagePicker={handleImagePicker}
                    onRemoveImage={handleRemoveImage}
                    onEditPress={handleEditPress}
                    editingField={editingField}
                />
            </Box>
        );
    }

    // Render Step 2
    if (currentStep === 2) {
        return (
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
                    experienceText={experienceText}
                    onExperienceTextChange={setExperienceText}
                    selectedDuration={selectedDuration}
                    selectedCondition={selectedCondition}
                    selectedFrequency={selectedFrequency}
                    selectedImages={selectedImages}
                    onImagePicker={handleImagePicker}
                    onRemoveImage={handleRemoveImage}
                />
            </Box>
        );
    }

    // Render Step 1
    return (
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
                selectedDuration={selectedDuration}
                selectedCondition={selectedCondition}
                selectedFrequency={selectedFrequency}
                onDurationChange={setSelectedDuration}
                onConditionChange={setSelectedCondition}
                onFrequencyChange={setSelectedFrequency}
            />
        </Box>
    );
};
