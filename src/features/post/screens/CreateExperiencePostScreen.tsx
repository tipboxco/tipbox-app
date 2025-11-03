import React, { useState } from 'react';
import { Box, ScrollView, VStack, HStack, Text, Pressable, Textarea, TextareaInput, Image } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProductInfoCard } from '../components/ProductInfoCard';

// Mock data for product info
const productInfo = {
    image: require('@/assets/product/product_01.png'),
    title: 'Dyson V15s\nDetect Submarine™ Wet & Dry Cordl...',
};

// Usage context tags (from Figma)
const usageContextTags = ['2 Weeks', 'Could Be Better', 'Daily Use'];

export const CreateExperiencePostScreen = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation();
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    const [experienceText, setExperienceText] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [priceExperienceText, setPriceExperienceText] = useState('');
    const [productExperienceText, setProductExperienceText] = useState('');
    const [priceRating, setPriceRating] = useState<number>(0);
    const [productRating, setProductRating] = useState<number>(0);
    const [priceTextAreaHeight, setPriceTextAreaHeight] = useState<number>(56);
    const [productTextAreaHeight, setProductTextAreaHeight] = useState<number>(56);
    const [editingField, setEditingField] = useState<'price' | 'product' | null>(null);

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleNextPress = () => {
        if (isNextEnabled) {
            setCurrentStep(2);
        }
    };

    const handleSharePress = () => {
        console.log('Share pressed');
        // Handle share action
    };

    const handleEditPress = (field: 'price' | 'product') => {
        // Eğer aynı alan zaten düzenleniyorsa, düzenlemeyi bitir (kaydet)
        if (editingField === field) {
            setEditingField(null);
            // Değişiklikler zaten state'te, kaydetme işlemi burada yapılabilir
        } else {
            // Yeni bir alanı düzenleme moduna al
            setEditingField(field);
        }
    };

    const handleSavePress = () => {
        setEditingField(null);
        // Save changes
    };

    // Check if Next button should be enabled (Experience text filled)
    const isNextEnabled = experienceText.trim().length > 0;

    // Check if Share button should be enabled (Both ratings selected and not editing)
    const isShareEnabled = priceRating > 0 && productRating > 0 && editingField === null;

    // Check if any field is being edited
    const isEditing = editingField !== null;

    const handleImagePicker = () => {
        console.log('Open image picker');
    };

    const handleTagPress = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const characterCount = experienceText.length;
    const maxCharacters = 500;

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
                <HStack space="xs" >
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

    // Render Step 2
    if (currentStep === 2) {
        return (
            <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
                {/* Header */}
                <Header
                    title="Experience Post"
                    showBackButton={true}
                    onBackPress={() => {
                        if (editingField) {
                            setEditingField(null);
                        } else {
                            setCurrentStep(1);
                        }
                    }}
                    rightAction={
                        isEditing ? (
                            <Pressable
                                onPress={handleSavePress}
                                bg="#D8FF08"
                                borderRadius={20}
                                px={14}
                                py={4}
                            >
                                <Text
                                    fontSize={11}
                                    fontWeight="$bold"
                                    color="#000000"
                                >
                                    Save
                                </Text>
                            </Pressable>
                        ) : null
                    }
                />

                {/* Content */}
                <ScrollView flex={1} showsVerticalScrollIndicator={false}>
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
                                            onChangeText={editingField === 'price' ? setPriceExperienceText : undefined}
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
                                    {renderStarRating(priceRating, setPriceRating, editingField !== 'price' && isEditing)}
                                </Box>

                                {/* Edit Icon */}
                                <Box position="absolute" top={12} right={12}>
                                    <Pressable
                                        onPress={() => handleEditPress('price')}
                                        disabled={isEditing && editingField !== 'price'}
                                    >
                                        <Feather 
                                            name="edit-3" 
                                            size={20} 
                                            color={isDark ? '#FFFFFF' : '#B9B9B9'}
                                        />
                                    </Pressable>
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
                                            onChangeText={editingField === 'product' ? setProductExperienceText : undefined}
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
                                    {renderStarRating(productRating, setProductRating, editingField !== 'product' && isEditing)}
                                </Box>

                                {/* Edit Icon */}
                                <Box position="absolute" top={12} right={12}>
                                    <Pressable
                                        onPress={() => handleEditPress('product')}
                                        disabled={isEditing && editingField !== 'product'}
                                    >
                                        <Feather 
                                            name="edit-3" 
                                            size={20} 
                                            color={isDark ? '#FFFFFF' : '#B9B9B9'}
                                        />
                                    </Pressable>
                                </Box>
                            </Box>
                        </Box>

                        {/* Usage Context Tags */}
                        <VStack px={16} space="xs" opacity={isEditing ? 0.3 : 1} pointerEvents={isEditing ? 'none' : 'auto'}>
                            <HStack flexWrap="wrap" gap={4}>
                                {usageContextTags.map((tag) => (
                                    <Box
                                        key={tag}
                                        bg="rgba(255, 255, 255, 0.8)"
                                        $dark-bg="rgba(255, 255, 255, 0.1)"
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
                                <Pressable onPress={handleImagePicker}>
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
                            </HStack>
                        </VStack>
                    </VStack>
                </ScrollView>

                {/* Share Button - Fixed at bottom */}
                <Box
                    position="absolute"
                    bottom={0}
                    left={0}
                    right={0}
                    bg={isDark ? '$backgroundDark950' : '#FAFAFA'}
                    borderTopWidth={1}
                    borderTopColor={isDark ? '$borderDark600' : '#E9E9E9'}
                    px="$4"
                    py="$4"
                    pb="$8"
                >
                    <Pressable
                        onPress={handleSharePress}
                        disabled={!isShareEnabled}
                        bg={isShareEnabled ? '#C2E607' : '#EDEDEC'}
                        $dark-bg={isShareEnabled ? '#C2E607' : '$backgroundDark700'}
                        borderWidth={1}
                        borderColor={isShareEnabled ? '#C2E607' : '#B1B1B1'}
                        $dark-borderColor={isShareEnabled ? '#C2E607' : '$borderDark600'}
                        rounded={8}
                        h={44}
                        justifyContent="center"
                        alignItems="center"
                        opacity={isShareEnabled ? 1 : 0.5}
                    >
                        <Text
                            fontSize={14}
                            fontWeight="$bold"
                            color={isShareEnabled ? '#000000' : '#B1B1B1'}
                            $dark-color={isShareEnabled ? '#000000' : '$textDark400'}
                        >
                            Share
                        </Text>
                    </Pressable>
                </Box>
            </Box>
        );
    }

    // Render Step 1
    return (
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
            {/* Header */}
            <Header
                title="Experience Post"
                showBackButton={true}
                onBackPress={handleBackPress}
            />

            {/* Content */}
            <ScrollView flex={1} showsVerticalScrollIndicator={false}>
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
                                    onChangeText={setExperienceText}
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

                    {/* Usage Context Tags */}
                    <VStack px={16} space="xs">
                        {/* Tags Container */}
                        <HStack flexWrap="wrap" gap={4}>
                            {usageContextTags.map((tag) => (
                                <Pressable
                                    key={tag}
                                    onPress={() => handleTagPress(tag)}
                                >
                                    <Box
                                        bg={selectedTags.includes(tag) ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)'}
                                        $dark-bg={selectedTags.includes(tag) ? '$backgroundDark800' : 'rgba(255, 255, 255, 0.1)'}
                                        borderWidth={1}
                                        borderColor={selectedTags.includes(tag) ? '#EFEFEF' : '#EFEFEF'}
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
                                </Pressable>
                            ))}
                        </HStack>
                    </VStack>

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
                            {/* First Image Slot */}
                            <Pressable onPress={handleImagePicker}>
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

                            {/* Additional image slots can be added here */}
                        </HStack>
                    </VStack>
                </VStack>
            </ScrollView>

            {/* Next Button - Fixed at bottom */}
            <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                bg={isDark ? '$backgroundDark950' : '#FAFAFA'}
                borderTopWidth={1}
                borderTopColor={isDark ? '$borderDark600' : '#E9E9E9'}
                px="$4"
                py="$4"
                pb="$8"
            >
                <Pressable
                    onPress={handleNextPress}
                    disabled={!isNextEnabled}
                    bg={isNextEnabled ? '#C2E607' : '#EDEDEC'}
                    $dark-bg={isNextEnabled ? '#C2E607' : '$backgroundDark700'}
                    borderWidth={1}
                    borderColor={isNextEnabled ? '#C2E607' : '#B1B1B1'}
                    $dark-borderColor={isNextEnabled ? '#C2E607' : '$borderDark600'}
                    rounded={8}
                    h={44}
                    justifyContent="center"
                    alignItems="center"
                    opacity={isNextEnabled ? 1 : 0.5}
                >
                    <Text
                        fontSize={14}
                        fontWeight="$bold"
                        color={isNextEnabled ? '#000000' : '#B1B1B1'}
                        $dark-color={isNextEnabled ? '#000000' : '$textDark400'}
                    >
                        Next
                    </Text>
                </Pressable>
            </Box>
        </Box>
    );
};

