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

interface StepTwoScreenProps {
    experienceText: string;
    onExperienceTextChange: (text: string) => void;
    selectedDuration: string;
    selectedCondition: string;
    selectedFrequency: string;
    selectedImages: string[];
    onImagePicker: () => void;
    onRemoveImage?: (index: number) => void;
}

export const StepTwoScreen: React.FC<StepTwoScreenProps> = ({
    experienceText,
    onExperienceTextChange,
    selectedDuration,
    selectedCondition,
    selectedFrequency,
    selectedImages,
    onImagePicker,
    onRemoveImage,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    
    const characterCount = experienceText.length;
    const maxCharacters = 500;

    // Create tags from selected values
    const experienceTags = [
        selectedDuration,
        selectedCondition,
        selectedFrequency,
    ].filter(Boolean);

    return (
        <ScrollView 
            flex={1} 
            showsVerticalScrollIndicator={false}
        >
            <VStack space="md" pb={100}>
                {/* Product Info Card */}
                <ProductInfoCard
                    image={productInfo.image}
                    title={productInfo.title}
                />

                {/* Experience Section */}
                <VStack px={16} space="xs">
                    {/* Section Title */}
                    <Text
                        color={isDark ? '$textDark400' : '#B9B9B9'}
                        fontSize={10}
                        fontWeight="$bold"
                    >
                        Experience
                    </Text>

                    {/* Text Input Area */}
                    <Box
                        bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                        borderWidth={1}
                        borderColor="#E9E9E9"
                        $dark-borderColor="$borderDark600"
                        borderRadius={5}
                        overflow="hidden"
                        minHeight={174}
                        position="relative"
                    >
                        {/* Text Input */}
                        <Textarea
                            bg="transparent"
                            borderWidth={0}
                            flex={1}
                            minHeight={174}
                        >
                            <TextareaInput
                                placeholder="Type your Experience here..."
                                placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                                color={isDark ? '$textDark50' : '#343434'}
                                fontSize={10}
                                lineHeight={12}
                                value={experienceText}
                                onChangeText={onExperienceTextChange}
                                maxLength={maxCharacters}
                                style={{
                                    textAlignVertical: 'top',
                                    paddingTop: 10,
                                    paddingBottom: 32,
                                    paddingLeft: 8,
                                    paddingRight: 8,
                                }}
                            />
                        </Textarea>

                        {/* Character Count - Bottom Right */}
                        <Box
                            position="absolute"
                            bottom={10}
                            right={8}
                        >
                            <Text
                                color={isDark ? '$textDark400' : '#A3A3A3'}
                                fontSize={9}
                                fontWeight="$medium"
                            >
                                {characterCount}/{maxCharacters}
                            </Text>
                        </Box>
                    </Box>
                </VStack>

                {/* Experience Tags Section */}
                {experienceTags.length > 0 && (
                    <VStack px={16} space="xs">
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
                <VStack px={16} space="xs">
                    {/* Section Title */}
                    <Text
                        color={isDark ? '$textDark400' : '#A3A3A3'}
                        fontSize={10}
                        fontWeight="$bold"
                    >
                        Images
                    </Text>

                    {/* Image Picker Areas */}
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

