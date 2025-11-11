import React, { useState } from 'react';
import { 
    Box, 
    ScrollView, 
    VStack, 
    HStack, 
    Text, 
    Pressable, 
    Textarea, 
    TextareaInput,
    Image
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ProductInfoCard } from '../../components/ProductInfoCard';

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
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    
    const [priceTextAreaHeight, setPriceTextAreaHeight] = useState<number>(56);
    const [productTextAreaHeight, setProductTextAreaHeight] = useState<number>(56);

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
            <VStack space="xs">
                <Text
                    fontSize={11}
                    fontWeight="$semibold"
                    color={isDark ? '$textDark50' : '#3B3B3B'}
                >
                    Rate Experience
                </Text>
                <HStack space="xs">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Pressable 
                            key={star} 
                            onPress={() => onRatingChange(star)}
                            disabled={disabled}
                        >
                            <Feather
                                name="star"
                                size={24}
                                color={star <= rating ? '#829905' : '#E9E9E9'}
                                fill={star <= rating ? '#829905' : 'transparent'}
                            />
                        </Pressable>
                    ))}
                </HStack>
            </VStack>
        );
    };

    return (
        <ScrollView 
            flex={1} 
            showsVerticalScrollIndicator={false}
        >
            <VStack space="md" pb={100}>
                {/* Product Info Card */}
                <Box opacity={isEditing ? 0.3 : 1} pointerEvents={isEditing ? 'none' : 'auto'}>
                    <ProductInfoCard
                        image={productInfo.image}
                        title={productInfo.title}
                    />
                </Box>

                {/* Price and Shopping Experience Card */}
                <Box mx="$4">
                    <Box
                        bg="#FDFDFD"
                        $dark-bg="$backgroundDark800"
                        borderWidth={1}
                        borderColor="#E9E9E9"
                        $dark-borderColor="$borderDark600"
                        borderRadius={10}
                        overflow="hidden"
                        opacity={isEditing && editingField !== 'price' ? 0.3 : 1}
                    >
                        {/* Card Header */}
                        <VStack px={16} py={8} space="xs">
                            <HStack alignItems="center" justifyContent="space-between">
                                <HStack alignItems="center" space="xs">
                                    <Feather name="tag" size={18} color={isDark ? '#FFFFFF' : '#000000'} />
                                    <Text
                                        fontSize={11}
                                        fontWeight="$semibold"
                                        color={isDark ? '$textDark50' : '#3B3B3B'}
                                    >
                                        Price and Shopping Experience
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
                            <Textarea
                                bg="transparent"
                                borderWidth={0}
                                height={priceTextAreaHeight}
                            >
                                <TextareaInput
                                    placeholder="Describe your price and shopping experience..."
                                    placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                                    color={isDark ? '$textDark50' : '#000000'}
                                    fontSize={10}
                                    lineHeight={14}
                                    value={priceExperienceText}
                                    onChangeText={editingField === 'price' ? onPriceExperienceTextChange : undefined}
                                    editable={editingField === 'price'}
                                    pointerEvents={editingField === 'price' ? 'auto' : 'none'}
                                    onContentSizeChange={(event) => {
                                        if (editingField === 'price') {
                                            const { height } = event.nativeEvent.contentSize;
                                            setPriceTextAreaHeight(Math.max(56, height + 16));
                                        }
                                    }}
                                    style={{
                                        textAlignVertical: 'top',
                                        paddingTop: 0,
                                        paddingBottom: 0,
                                        paddingLeft: 0,
                                        paddingRight: 0,
                                    }}
                                />
                            </Textarea>
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
                        bg="#FDFDFD"
                        $dark-bg="$backgroundDark800"
                        borderWidth={1}
                        borderColor="#E9E9E9"
                        $dark-borderColor="$borderDark600"
                        borderRadius={10}
                        overflow="hidden"
                        opacity={isEditing && editingField !== 'product' ? 0.3 : 1}
                    >
                        {/* Card Header */}
                        <VStack px={16} py={8} space="xs">
                            <HStack alignItems="center" justifyContent="space-between">
                                <HStack alignItems="center" space="xs">
                                    <Feather name="package" size={18} color={isDark ? '#FFFFFF' : '#000000'} />
                                    <Text
                                        fontSize={11}
                                        fontWeight="$semibold"
                                        color={isDark ? '$textDark50' : '#3B3B3B'}
                                    >
                                        Product and Usage Experience
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
                            <Textarea
                                bg="transparent"
                                borderWidth={0}
                                height={productTextAreaHeight}
                            >
                                <TextareaInput
                                    placeholder="Describe your product and usage experience..."
                                    placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                                    color={isDark ? '$textDark50' : '#000000'}
                                    fontSize={10}
                                    lineHeight={14}
                                    value={productExperienceText}
                                    onChangeText={editingField === 'product' ? onProductExperienceTextChange : undefined}
                                    editable={editingField === 'product'}
                                    pointerEvents={editingField === 'product' ? 'auto' : 'none'}
                                    onContentSizeChange={(event) => {
                                        if (editingField === 'product') {
                                            const { height } = event.nativeEvent.contentSize;
                                            setProductTextAreaHeight(Math.max(56, height + 16));
                                        }
                                    }}
                                    style={{
                                        textAlignVertical: 'top',
                                        paddingTop: 0,
                                        paddingBottom: 0,
                                        paddingLeft: 0,
                                        paddingRight: 0,
                                    }}
                                />
                            </Textarea>
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
                                    borderColor="#EFEFEF"
                                    $dark-borderColor="$borderDark600"
                                    borderRadius={10}
                                    px={12}
                                    py={3}
                                >
                                    <Text
                                        fontSize={8}
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
                        fontSize={10}
                        fontWeight="$bold"
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
                            <Pressable onPress={onImagePicker}>
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
    );
};

