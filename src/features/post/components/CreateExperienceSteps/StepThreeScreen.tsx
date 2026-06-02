import React, { useState } from 'react';
import {
    Box,
    ScrollView,
    VStack,
    HStack,
    Text,
    Pressable,
    Image
} from '@gluestack-ui/themed';
import { ActivityIndicator, TextInput } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import {
  TagIcon,
  CubeIcon,
} from 'react-native-heroicons/outline';
import { StarIcon as StarIconSolid } from 'react-native-heroicons/solid';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { useTranslation } from '@/src/hooks/useTranslation';

// Mock data for product info
const productInfo = {
    image: require('@/assets/product/product_01.png'),
    title: 'Dyson V15s\nDetect Submarine™ Wet & Dry Cordl...',
};

interface StepThreeScreenProps {
    priceExperienceText: string;
    productExperienceText: string;
    priceRating: number;
    productRating: number;
    onPriceExperienceTextChange: (text: string) => void;
    onProductExperienceTextChange: (text: string) => void;
    onPriceRatingChange: (rating: number) => void;
    onProductRatingChange: (rating: number) => void;
    selectedDuration: string;
    selectedCondition: string;
    selectedFrequency: string;
    selectedImages: string[];
    onImagePicker: () => void;
    onRemoveImage?: (index: number) => void;
    onEditPress: (field: 'price' | 'product') => void;
    editingField: 'price' | 'product' | null;
    selectedProduct?: { id: string; name: string; brand?: string; description?: string; image: any } | null;
    fromInventory?: boolean;
    experienceOption?: 'own' | 'tried';
    isImagePickerLoading?: boolean;
}

export const StepThreeScreen: React.FC<StepThreeScreenProps> = ({
    priceExperienceText,
    productExperienceText,
    priceRating,
    productRating,
    onPriceExperienceTextChange,
    onProductExperienceTextChange,
    onPriceRatingChange,
    onProductRatingChange,
    selectedDuration,
    selectedCondition,
    selectedFrequency,
    selectedImages,
    onImagePicker,
    onRemoveImage,
    onEditPress,
    editingField,
    selectedProduct,
    fromInventory,
    experienceOption,
    isImagePickerLoading = false,
}) => {
    const { t } = useTranslation('post');
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    // Check if any field is being edited
    const isEditing = editingField !== null;

    // Create tags from selected values
    const experienceTags = [
        selectedDuration,
        selectedCondition,
        selectedFrequency,
    ].filter(Boolean);

    // Render Star Rating Component
    const renderStarRating = (rating: number, onRatingChange: (rating: number) => void, disabled: boolean = false) => {
        return (
            <HStack space="xs">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                        key={star}
                        onPress={() => onRatingChange(star)}
                        disabled={disabled}
                    >
                        <StarIconSolid
                            width={24}
                            height={24}
                            color={star <= rating ? '#829905' : '#E9E9E9'}
                        />
                    </Pressable>
                ))}
            </HStack>
        );
    };

    return (
        <ScrollView 
            flex={1} 
            showsVerticalScrollIndicator={false}
        >
            <VStack space="md" pb={100}>
                {/* Product Info Card */}
                <Box px="$4" py="$2">
                    <Box opacity={isEditing ? 0.3 : 1} pointerEvents={isEditing ? 'none' : 'auto'}>
                        {selectedProduct ? (
                            <ProductInfoCard
                                image={selectedProduct.image}
                                title={selectedProduct.name}
                                subName={selectedProduct.description}
                                size="big"
                                type={ProductInfoType.SUB_CATEGORY}
                            />
                        ) : (
                            <ProductInfoCard
                                image={productInfo.image}
                                title={productInfo.title}
                                size="big"
                                type={ProductInfoType.SUB_CATEGORY}
                            />
                        )}
                    </Box>
                </Box>

                {/* Price and Shopping Experience Card */}
                <Box mx="$4">
                    <Box
                        bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                        $dark-bg="$backgroundDark800"
                        borderWidth={1}
                        borderColor={isDark ? '#333333' : '#E9E9E9'}
                        $dark-borderColor="$borderDark600"
                        borderRadius={10}
                        overflow="hidden"
                        opacity={isEditing && editingField !== 'price' ? 0.3 : 1}
                    >
                        {/* Card Header */}
                        <VStack px={16} py={8} space="xs">
                            <HStack alignItems="center" justifyContent="space-between">
                                <HStack alignItems="center" space="xs">
                                    <TagIcon width={18} height={18} color={isDark ? '#FFFFFF' : '#000000'} />
                                    <Text
                                        fontSize={14}
                                        fontWeight="$semibold"
                                        color={isDark ? '$textDark50' : '#3B3B3B'}
                                    >
                                        {t('create.experience.step3.priceAndShopping')}
                                    </Text>
                                </HStack>
                                {/* Edit Icon */}
                                <Pressable
                                    onPress={() => onEditPress('price')}
                                    disabled={isEditing && editingField !== 'price'}
                                >
                                    <Feather
                                        name="edit-3"
                                        size={20}
                                        color={isDark ? '#FFFFFF' : '#B9B9B9'}
                                    />
                                </Pressable>
                            </HStack>
                            {editingField === 'price' ? (
                                <TextInput
                                    placeholder={t('create.experience.step3.priceExperiencePlaceholder')}
                                    placeholderTextColor="#8C8C8C"
                                    value={priceExperienceText}
                                    onChangeText={onPriceExperienceTextChange}
                                    multiline
                                    scrollEnabled={false}
                                    style={{
                                        fontSize: 14,
                                        lineHeight: 20,
                                        color: isDark ? '#F5F5F5' : '#000000',
                                        textAlignVertical: 'top',
                                        minHeight: 56,
                                        padding: 0,
                                    }}
                                />
                            ) : (
                                <Text
                                    fontSize={14}
                                    lineHeight={20}
                                    color={priceExperienceText ? (isDark ? '$textDark50' : '#000000') : '#8C8C8C'}
                                    style={{ minHeight: 56 }}
                                >
                                    {priceExperienceText || t('create.experience.step3.priceExperiencePlaceholder')}
                                </Text>
                            )}
                        </VStack>

                        {/* Rating Section */}
                        <Box px={16} pb={12} alignItems='flex-start' opacity={editingField === 'price' ? 1 : (isEditing ? 0.3 : 1)}>
                            {renderStarRating(priceRating, onPriceRatingChange, editingField !== 'price' && isEditing)}
                        </Box>
                    </Box>
                </Box>

                {/* Product and Usage Experience Card */}
                <Box mx="$4">
                    <Box
                        bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                        $dark-bg="$backgroundDark800"
                        borderWidth={1}
                        borderColor={isDark ? '#333333' : '#E9E9E9'}
                        $dark-borderColor="$borderDark600"
                        borderRadius={10}
                        overflow="hidden"
                        opacity={isEditing && editingField !== 'product' ? 0.3 : 1}
                    >
                        {/* Card Header */}
                        <VStack px={16} py={8} space="xs">
                            <HStack alignItems="center" justifyContent="space-between">
                                <HStack alignItems="center" space="xs">
                                    <CubeIcon width={18} height={18} color={isDark ? '#FFFFFF' : '#000000'} />
                                    <Text
                                        fontSize={14}
                                        fontWeight="$semibold"
                                        color={isDark ? '$textDark50' : '#3B3B3B'}
                                    >
                                        {t('create.experience.step3.productAndUsage')}
                                    </Text>
                                </HStack>
                                {/* Edit Icon */}
                                <Pressable
                                    onPress={() => onEditPress('product')}
                                    disabled={isEditing && editingField !== 'product'}
                                >
                                    <Feather
                                        name="edit-3"
                                        size={20}
                                        color={isDark ? '#FFFFFF' : '#B9B9B9'}
                                    />
                                </Pressable>
                            </HStack>
                            {editingField === 'product' ? (
                                <TextInput
                                    placeholder={t('create.experience.step3.productExperiencePlaceholder')}
                                    placeholderTextColor="#8C8C8C"
                                    value={productExperienceText}
                                    onChangeText={onProductExperienceTextChange}
                                    multiline
                                    scrollEnabled={false}
                                    style={{
                                        fontSize: 14,
                                        lineHeight: 20,
                                        color: isDark ? '#F5F5F5' : '#000000',
                                        textAlignVertical: 'top',
                                        minHeight: 56,
                                        padding: 0,
                                    }}
                                />
                            ) : (
                                <Text
                                    fontSize={14}
                                    lineHeight={20}
                                    color={productExperienceText ? (isDark ? '$textDark50' : '#000000') : '#8C8C8C'}
                                    style={{ minHeight: 56 }}
                                >
                                    {productExperienceText || t('create.experience.step3.productExperiencePlaceholder')}
                                </Text>
                            )}
                        </VStack>

                        {/* Rating Section */}
                        <Box px={16} pb={12} opacity={editingField === 'product' ? 1 : (isEditing ? 0.3 : 1)}>
                            {renderStarRating(productRating, onProductRatingChange, editingField !== 'product' && isEditing)}
                        </Box>
                    </Box>
                </Box>

                {/* Experience Tags Section */}
                {experienceTags.length > 0 && (
                    <VStack px={16} space="xs" opacity={isEditing ? 0.3 : 1} pointerEvents={isEditing ? 'none' : 'auto'}>
                        <HStack flexWrap="wrap" gap={4}>
                            {experienceTags.map((tag, index) => (
                                <Box
                                    key={index}
                                    bg={isDark ? '$backgroundDark800' : '#FFFFFF'}
                                    borderWidth={1}
                                    borderColor={isDark ? '#333333' : '#EFEFEF'}
                                    $dark-borderColor="$borderDark600"
                                    borderRadius={10}
                                    px={12}
                                    py={3}
                                >
                                    <Text
                                        fontSize={12}
                                        fontWeight="$semibold"
                                        color={isDark ? '$textDark50' : '#000000'}
                                    >
                                        {tag}
                                    </Text>
                                </Box>
                            ))}
                        </HStack>
                    </VStack>
                )}

                {/* Images Section */}
                <VStack px={16} space="xs" opacity={isEditing ? 0.3 : 1} pointerEvents={isEditing ? 'none' : 'auto'}>
                    <Text
                        color={isDark ? '$textDark400' : '#A3A3A3'}
                        fontSize={14}
                        fontWeight="$bold"
                    >
                        {t('create.experience.step3.images')}
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
                                    alt={t('altTexts.selectedImage', { index: index + 1 })}
                                />
                                {onRemoveImage && (
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
                                        onPress={() => onRemoveImage(index)}
                                    >
                                        <Feather
                                            name="x"
                                            size={12}
                                            color="#FFFFFF"
                                        />
                                    </Pressable>
                                )}
                            </Box>
                        ))}

                        {/* Add Image Button */}
                        {selectedImages.length < 10 && (
                            <Pressable onPress={onImagePicker} disabled={isImagePickerLoading}>
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
                                    opacity={isImagePickerLoading ? 0.5 : 1}
                                >
                                    {isImagePickerLoading ? (
                                        <ActivityIndicator size="small" color={isDark ? '#D0F205' : '#829905'} />
                                    ) : (
                                        <Feather
                                            name="plus"
                                            size={24}
                                            color={isDark ? '#C1BEBF' : '#C1BEBF'}
                                        />
                                    )}
                                </Box>
                            </Pressable>
                        )}
                    </HStack>
                </VStack>
            </VStack>
        </ScrollView>
    );
};

