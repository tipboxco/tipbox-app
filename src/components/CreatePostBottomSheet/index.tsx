import React, { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
    Image,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface SelectedProduct {
    id: string;
    name: string;
    subName?: string;
    image?: any;
    hasDiscount?: boolean;
}

type CatalogStage = 'subcategories' | 'productgroups' | 'products';

interface CreatePostBottomSheetProps {
    onClose: () => void;
    onPostTypeSelect?: (type: PostType) => void;
    onViewChange?: (view: 'options' | 'experience' | 'product-selection') => void;
    selectedProduct?: SelectedProduct;
    stage?: CatalogStage;
}

type ViewType = 'options' | 'experience' | 'product-selection';

interface ExperienceOption {
    id: 'own' | 'tried';
    title: string;
    description: string;
}

export type PostType =
    | 'free'
    | 'tips'
    | 'question'
    | 'experience'
    | 'comparison'
    | 'update';

interface PostOption {
    id: PostType;
    title: string;
    description: string;
}

const postOptions: PostOption[] = [
    {
        id: 'free',
        title: 'Serbest Gönderi',
        description: 'Herhangi bir konuda serbest gönderi oluştur',
    },
    {
        id: 'tips',
        title: 'İpucu Gönderisi',
        description: 'Bu ürün hakkında bir ipucu paylaş',
    },
    {
        id: 'question',
        title: 'Soru Gönderisi',
        description: 'Bu ürün hakkında bir soru sor',
    },
    {
        id: 'experience',
        title: 'Deneyim Gönderisi',
        description: 'Bu ürün hakkında deneyimini paylaş',
    },
    {
        id: 'comparison',
        title: 'Karşılaştırma Gönderisi',
        description: 'Bu ürünü benzerleriyle karşılaştır',
    },
    {
        id: 'update',
        title: 'Güncelleme',
        description: 'Bu ürün hakkında bir güncelleme yap',
    },
];

const experienceOptions: ExperienceOption[] = [
    {
        id: 'own',
        title: 'I Own the Product',
        description: 'Added to inventory; experience snippets shared as a post.',
    },
    {
        id: 'tried',
        title: 'Tried / Tested',
        description: 'Experience snippets shared as a post; not added to inventory',
    },
];

export const CreatePostBottomSheet: React.FC<CreatePostBottomSheetProps> = ({
    onClose,
    onPostTypeSelect,
    onViewChange,
    selectedProduct,
    stage,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [currentView, setCurrentView] = useState<ViewType>('options');
    const [selectedExperienceType, setSelectedExperienceType] = useState<'own' | 'tried' | null>(null);
    const [usageDuration, setUsageDuration] = useState<string>('');
    const [usageLocation, setUsageLocation] = useState<string>('');
    const [usagePurpose, setUsagePurpose] = useState<string>('');
    const [showDurationDropdown, setShowDurationDropdown] = useState(false);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [showPurposeDropdown, setShowPurposeDropdown] = useState(false);

    // Usage options
    const durationOptions = ['2 Week', '1 Month', '3 Months', '6 Months', '1 Year', 'More than 1 Year'];
    const locationOptions = ['Home', 'Office', 'Outdoor', 'Travel', 'Other'];
    const purposeOptions = ['Daily Use', 'Occasional Use', 'Work', 'Entertainment', 'Other'];

    // Filter post options based on stage
    const getFilteredPostOptions = (): PostOption[] => {
        if (!stage) {
            // If no stage specified, show all options
            return postOptions;
        }

        switch (stage) {
            case 'subcategories':
            case 'productgroups':
                // Show only: Serbest Gönderi, İpucu Gönderisi, Soru Gönderisi
                return postOptions.filter(option => 
                    option.id === 'free' || 
                    option.id === 'tips' || 
                    option.id === 'question'
                );
            case 'products':
                // Show: Deneyim Gönderisi, İpucu Gönderisi, Karşılaştırma Gönderisi, Güncelleme, Soru Gönderisi
                return postOptions.filter(option => 
                    option.id === 'experience' || 
                    option.id === 'tips' || 
                    option.id === 'comparison' || 
                    option.id === 'update' || 
                    option.id === 'question'
                );
            default:
                return postOptions;
        }
    };

    const filteredPostOptions = getFilteredPostOptions();

    const handlePostTypePress = (type: PostType) => {
        console.log('Selected post type:', type);
        if (type === 'experience') {
            // Show experience options view
            setCurrentView('experience');
            onViewChange?.('experience');
        } else {
            onPostTypeSelect?.(type);
            onClose();
        }
    };

    const handleExperienceOptionPress = (optionId: 'own' | 'tried') => {
        console.log('Selected experience option:', optionId);
        setSelectedExperienceType(optionId);
        // Navigate to product selection view
        setCurrentView('product-selection');
        onViewChange?.('product-selection');
    };

    const handleBackPress = () => {
        if (currentView === 'product-selection') {
            // Go back to experience options
            setCurrentView('experience');
            onViewChange?.('experience');
            setSelectedExperienceType(null);
        } else if (currentView === 'experience') {
            // Go back to options
            setCurrentView('options');
            onViewChange?.('options');
        }
    };

    const handleConfirmPress = () => {
        if (!isConfirmEnabled) return;
        
        console.log('Confirm pressed with:', {
            experienceType: selectedExperienceType,
            product: selectedProduct,
            usageDuration,
            usageLocation,
            usagePurpose,
        });
        // Close bottom sheet and navigate will be handled by parent
        onClose();
        // Trigger navigation to CreateExperiencePostScreen
        onPostTypeSelect?.('experience');
    };

    // Check if all fields are filled (product must be selected from catalog)
    const isConfirmEnabled = Boolean(selectedProduct) && 
        usageDuration !== '' && 
        usageLocation !== '' && 
        usagePurpose !== '';

    // Render product selection view
    if (currentView === 'product-selection') {
        return (
            <Box flex={1} bg="#FDFDFB" $dark-bg="$backgroundDark950">
                {/* Header with back button */}
                <VStack space="sm" mb="$4" px="$4" pt="$4">
                    <HStack justifyContent="space-between" alignItems="center" w="100%">
                        <Pressable onPress={handleBackPress}>
                            <Feather
                                name="arrow-left"
                                size={24}
                                color={isDark ? '#FFFFFF' : '#000000'}
                            />
                        </Pressable>
                        <Text
                            fontSize={16}
                            fontWeight="$bold"
                            color="#000000"
                            $dark-color="$textDark50"
                            textAlign="center"
                            flex={1}
                        >
                            Deneyim Gönderisi
                        </Text>
                        <Box w={24} />
                    </HStack>
                </VStack>

                {/* Selected Product Info Card */}
                {selectedProduct ? (
                    <Box mx="$4" mb="$4">
                        <HStack 
                            alignItems="center"
                            space="md"
                        >
                            {/* Product Image - 74x74 */}
                            <Box
                                width={74}
                                height={74}
                                borderWidth={0.5}
                                borderColor="#E9E9E9"
                                $dark-borderColor="$borderDark600"
                                borderRadius={5}
                                overflow="hidden"
                            >
                                <Image
                                    width={74}
                                    height={74}
                                    source={selectedProduct.image || require('@/assets/inventory/product_01.png')}
                                    alt={selectedProduct.name}
                                    resizeMode="cover"
                                />
                            </Box>
                            
                            {/* Product Info */}
                            <VStack flex={1} space="xs">
                                <Text
                                    color={isDark ? '$textDark50' : '#A3A3A3'}
                                    fontSize={11}
                                    fontWeight="$bold"
                                    numberOfLines={2}
                                    lineHeight={13}
                                >
                                    {selectedProduct.name}
                                </Text>
                                {selectedProduct.subName && (
                                    <Text
                                        color={isDark ? '$textDark400' : '#A3A3A3'}
                                        fontSize={11}
                                        fontWeight="$bold"
                                        numberOfLines={1}
                                    >
                                        {selectedProduct.subName}
                                    </Text>
                                )}
                            </VStack>
                            
                            {/* Progress Icon */}
                            <Box
                                width={36}
                                height={43}
                                justifyContent="center"
                                alignItems="center"
                            >
                                {/* Circular progress indicator */}
                                <Box
                                    width={36}
                                    height={36}
                                    borderWidth={2}
                                    borderColor="#E8E8E8"
                                    $dark-borderColor="$borderDark600"
                                    borderRadius={18}
                                    justifyContent="center"
                                    alignItems="center"
                                    position="relative"
                                >
                                    {/* Progress bar - placeholder */}
                                    <Box
                                        width={18}
                                        height={4.45}
                                        bg="#E8E8E8"
                                        $dark-bg="$borderDark600"
                                        borderRadius={2}
                                        position="absolute"
                                        bottom={-8}
                                    />
                                </Box>
                            </Box>
                        </HStack>
                    </Box>
                ) : (
                    // Empty state - no product selected
                    <Box mx="$4" mb="$4">
                        <Pressable
                            bg="#FDFDFD"
                            $dark-bg="$backgroundDark800"
                            borderWidth={1}
                            borderColor="#E9E9E9"
                            $dark-borderColor="$borderDark600"
                            borderRadius={10}
                            h={74}
                            px="$4"
                        >
                            <HStack 
                                alignItems="center"
                                justifyContent="space-between"
                                h="100%"
                            >
                                <Text
                                    color={isDark ? '$textDark400' : '#C1BEBF'}
                                    fontSize={12}
                                    fontWeight="$medium"
                                >
                                    Select Product
                                </Text>
                                <Feather
                                    name="chevron-right"
                                    size={24}
                                    color={isDark ? '$textDark400' : '#C1BEBF'}
                                />
                            </HStack>
                        </Pressable>
                    </Box>
                )}

                {/* Usage Options */}
                <Box px="$4" position="relative">
                    <VStack space="xs">
                        {/* Usage Duration */}
                        <Box position="relative">
                            <Pressable
                                onPress={() => {
                                    setShowDurationDropdown(!showDurationDropdown);
                                    setShowLocationDropdown(false);
                                    setShowPurposeDropdown(false);
                                }}
                                bg="#F5F5F5"
                                $dark-bg="$backgroundDark800"
                                borderWidth={1}
                                borderColor="#E9E9E9"
                                $dark-borderColor="$borderDark600"
                                rounded={10}
                                h={44}
                            >
                                <HStack
                                    alignItems="center"
                                    justifyContent="space-between"
                                    px={16}
                                    py={10}
                                    h="100%"
                                >
                                    <Text
                                        fontSize={12}
                                        fontWeight="$medium"
                                        color={usageDuration ? (isDark ? '$textDark50' : '#000000') : '#C1BEBF'}
                                        $dark-color={usageDuration ? '$textDark50' : '$textDark400'}
                                    >
                                        {usageDuration || 'Usage Duration'}
                                    </Text>
                                    <Feather
                                        name={showDurationDropdown ? "chevron-up" : "chevron-down"}
                                        size={24}
                                        color="#C1BEBF"
                                        $dark-color="$textDark400"
                                    />
                                </HStack>
                            </Pressable>
                            {showDurationDropdown && (
                                <Box
                                    position="absolute"
                                    top={50}
                                    left={0}
                                    right={0}
                                    bg="#FDFDFD"
                                    $dark-bg="$backgroundDark800"
                                    borderWidth={1}
                                    borderColor="#E9E9E9"
                                    $dark-borderColor="$borderDark600"
                                    borderRadius={10}
                                    zIndex={1000}
                                    maxHeight={200}
                                    overflow="hidden"
                                >
                                    <VStack>
                                        {durationOptions.map((option, index) => (
                                            <Box key={option}>
                                                {index > 0 && (
                                                    <Box height={1} bg="#E9E9E9" width="100%" />
                                                )}
                                                <Pressable
                                                    onPress={() => {
                                                        setUsageDuration(option);
                                                        setShowDurationDropdown(false);
                                                    }}
                                                >
                                                    <HStack px={16} py={12} alignItems="center">
                                                        <Text
                                                            fontSize={12}
                                                            fontWeight="$medium"
                                                            color={isDark ? '$textDark50' : '#000000'}
                                                        >
                                                            {option}
                                                        </Text>
                                                    </HStack>
                                                </Pressable>
                                            </Box>
                                        ))}
                                    </VStack>
                                </Box>
                            )}
                        </Box>

                        {/* Usage Location */}
                        <Box position="relative">
                            <Pressable
                                onPress={() => {
                                    setShowLocationDropdown(!showLocationDropdown);
                                    setShowDurationDropdown(false);
                                    setShowPurposeDropdown(false);
                                }}
                                bg="#F5F5F5"
                                $dark-bg="$backgroundDark800"
                                borderWidth={1}
                                borderColor="#E9E9E9"
                                $dark-borderColor="$borderDark600"
                                rounded={10}
                                h={44}
                            >
                                <HStack
                                    alignItems="center"
                                    justifyContent="space-between"
                                    px={16}
                                    py={10}
                                    h="100%"
                                >
                                    <Text
                                        fontSize={12}
                                        fontWeight="$medium"
                                        color={usageLocation ? (isDark ? '$textDark50' : '#000000') : '#C1BEBF'}
                                        $dark-color={usageLocation ? '$textDark50' : '$textDark400'}
                                    >
                                        {usageLocation || 'Usage Location'}
                                    </Text>
                                    <Feather
                                        name={showLocationDropdown ? "chevron-up" : "chevron-down"}
                                        size={24}
                                        color="#C1BEBF"
                                        $dark-color="$textDark400"
                                    />
                                </HStack>
                            </Pressable>
                            {showLocationDropdown && (
                                <Box
                                    position="absolute"
                                    top={50}
                                    left={0}
                                    right={0}
                                    bg="#FDFDFD"
                                    $dark-bg="$backgroundDark800"
                                    borderWidth={1}
                                    borderColor="#E9E9E9"
                                    $dark-borderColor="$borderDark600"
                                    borderRadius={10}
                                    zIndex={1000}
                                    maxHeight={200}
                                    overflow="hidden"
                                >
                                    <VStack>
                                        {locationOptions.map((option, index) => (
                                            <Box key={option}>
                                                {index > 0 && (
                                                    <Box height={1} bg="#E9E9E9" width="100%" />
                                                )}
                                                <Pressable
                                                    onPress={() => {
                                                        setUsageLocation(option);
                                                        setShowLocationDropdown(false);
                                                    }}
                                                >
                                                    <HStack px={16} py={12} alignItems="center">
                                                        <Text
                                                            fontSize={12}
                                                            fontWeight="$medium"
                                                            color={isDark ? '$textDark50' : '#000000'}
                                                        >
                                                            {option}
                                                        </Text>
                                                    </HStack>
                                                </Pressable>
                                            </Box>
                                        ))}
                                    </VStack>
                                </Box>
                            )}
                        </Box>

                        {/* Usage Purpose */}
                        <Box position="relative">
                            <Pressable
                                onPress={() => {
                                    setShowPurposeDropdown(!showPurposeDropdown);
                                    setShowDurationDropdown(false);
                                    setShowLocationDropdown(false);
                                }}
                                bg="#F5F5F5"
                                $dark-bg="$backgroundDark800"
                                borderWidth={1}
                                borderColor="#E9E9E9"
                                $dark-borderColor="$borderDark600"
                                rounded={10}
                                h={44}
                            >
                                <HStack
                                    alignItems="center"
                                    justifyContent="space-between"
                                    px={16}
                                    py={10}
                                    h="100%"
                                >
                                    <Text
                                        fontSize={12}
                                        fontWeight="$medium"
                                        color={usagePurpose ? (isDark ? '$textDark50' : '#000000') : '#C1BEBF'}
                                        $dark-color={usagePurpose ? '$textDark50' : '$textDark400'}
                                    >
                                        {usagePurpose || 'Usage Purpose'}
                                    </Text>
                                    <Feather
                                        name={showPurposeDropdown ? "chevron-up" : "chevron-down"}
                                        size={24}
                                        color="#C1BEBF"
                                        $dark-color="$textDark400"
                                    />
                                </HStack>
                            </Pressable>
                            {showPurposeDropdown && (
                                <Box
                                    position="absolute"
                                    top={50}
                                    left={0}
                                    right={0}
                                    bg="#FDFDFD"
                                    $dark-bg="$backgroundDark800"
                                    borderWidth={1}
                                    borderColor="#E9E9E9"
                                    $dark-borderColor="$borderDark600"
                                    borderRadius={10}
                                    zIndex={1000}
                                    maxHeight={200}
                                    overflow="hidden"
                                >
                                    <VStack>
                                        {purposeOptions.map((option, index) => (
                                            <Box key={option}>
                                                {index > 0 && (
                                                    <Box height={1} bg="#E9E9E9" width="100%" />
                                                )}
                                                <Pressable
                                                    onPress={() => {
                                                        setUsagePurpose(option);
                                                        setShowPurposeDropdown(false);
                                                    }}
                                                >
                                                    <HStack px={16} py={12} alignItems="center">
                                                        <Text
                                                            fontSize={12}
                                                            fontWeight="$medium"
                                                            color={isDark ? '$textDark50' : '#000000'}
                                                        >
                                                            {option}
                                                        </Text>
                                                    </HStack>
                                                </Pressable>
                                            </Box>
                                        ))}
                                    </VStack>
                                </Box>
                            )}
                        </Box>
                    </VStack>

                    {/* Click outside overlay to close dropdowns */}
                    {(showDurationDropdown || showLocationDropdown || showPurposeDropdown) && (
                        <Pressable
                            position="absolute"
                            top={0}
                            left={0}
                            right={0}
                            bottom={-300}
                            zIndex={999}
                            onPress={() => {
                                setShowDurationDropdown(false);
                                setShowLocationDropdown(false);
                                setShowPurposeDropdown(false);
                            }}
                        />
                    )}
                </Box>

                {/* Confirm Button */}
                <Box px="$4" pb="$8" pt="$4">
                    <Pressable
                        onPress={handleConfirmPress}
                        disabled={!isConfirmEnabled}
                        bg={isConfirmEnabled ? '#C2E607' : '#EDEDEC'}
                        $dark-bg={isConfirmEnabled ? '#C2E607' : '$backgroundDark700'}
                        borderWidth={1}
                        borderColor={isConfirmEnabled ? '#C2E607' : '#B1B1B1'}
                        $dark-borderColor={isConfirmEnabled ? '#C2E607' : '$borderDark600'}
                        rounded={8}
                        h={44}
                        justifyContent="center"
                        alignItems="center"
                        opacity={isConfirmEnabled ? 1 : 0.5}
                    >
                        <Text
                            fontSize={14}
                            fontWeight="$bold"
                            color={isConfirmEnabled ? '#000000' : '#B1B1B1'}
                            $dark-color={isConfirmEnabled ? '#000000' : '$textDark400'}
                        >
                            Confirm
                        </Text>
                    </Pressable>
                </Box>
            </Box>
        );
    }

    // Render experience options view
    if (currentView === 'experience') {
        return (
            <Box flex={1} bg="#FDFDFB" $dark-bg="$backgroundDark950">
                {/* Header with back button */}
                <VStack space="sm" mb="$4" px="$4" pt="$4">
                    <HStack justifyContent="space-between" alignItems="center" w="100%">
                        <Pressable onPress={handleBackPress}>
                            <Feather
                                name="arrow-left"
                                size={24}
                                color={isDark ? '#FFFFFF' : '#000000'}
                            />
                        </Pressable>
                        <Text
                            fontSize={16}
                            fontWeight="$bold"
                            color="#000000"
                            $dark-color="$textDark50"
                            textAlign="center"
                            flex={1}
                        >
                            Deneyim Gönderisi
                        </Text>
                        <Box w={24} />
                    </HStack>
                </VStack>

                {/* Experience Options */}
                <VStack space="md" px="$4" pb="$8">
                    {experienceOptions.map((option) => (
                        <Pressable
                            key={option.id}
                            onPress={() => handleExperienceOptionPress(option.id)}
                            bg="#FDFDFD"
                            $dark-bg="$backgroundDark800"
                            borderWidth={1}
                            borderColor="#E9E9E9"
                            $dark-borderColor="$borderDark600"
                            rounded={10}
                            overflow="hidden"
                            w="100%"
                            maxWidth={358}
                            alignSelf="center"
                        >
                            <HStack alignItems="flex-start" px={13} py={16} space="sm">
                                {/* Icon Box - Left side with dashed border */}
                                <Box
                                    w={24}
                                    h={24}
                                    justifyContent="center"
                                    alignItems="center"
                                    mt="$0.5"
                                >
                                    {/* Dashed Rectangle Icon Container */}
                                    <Box
                                        w={24}
                                        h={24}
                                        borderWidth={1}
                                        borderColor="#E8E8E8"
                                        $dark-borderColor="$borderDark600"
                                        borderStyle="dashed"
                                        borderRadius={2}
                                        justifyContent="center"
                                        alignItems="center"
                                        bg="#FFFFFF"
                                        $dark-bg="$backgroundDark800"
                                    >
                                        <Image
                                            source={require('@/assets/add_post.png')}
                                            alt={option.title}
                                            w={24}
                                            h={24}
                                            resizeMode="contain"
                                        />
                                    </Box>
                                </Box>

                                {/* Text Content */}
                                <VStack flex={1} space="xs">
                                    <Text
                                        fontSize={12}
                                        fontWeight="$semibold"
                                        color="#000000"
                                        $dark-color="$textDark50"
                                    >
                                        {option.title}
                                    </Text>
                                    <Text
                                        fontSize={10}
                                        fontWeight="$normal"
                                        color="#B9B9B9"
                                        $dark-color="$textDark400"
                                        lineHeight={14}
                                    >
                                        {option.description}
                                    </Text>
                                </VStack>
                            </HStack>
                        </Pressable>
                    ))}
                </VStack>
            </Box>
        );
    }

    // Render options view (default)
    return (
        <Box flex={1} bg="#FDFDFB" $dark-bg="$backgroundDark950">
            {/* Header */}
            <VStack space="md" mb="$4" px="$4" pt="$4">
                <HStack justifyContent="center" alignItems="center" w="100%">
                    <Text
                        fontSize={16}
                        fontWeight="$bold"
                        color="#000000"
                        $dark-color="$textDark50"
                        textAlign="center"
                    >
                        Gönderi Oluştur
                    </Text>
                </HStack>
            </VStack>

            {/* Post Options */}
            <VStack space="sm" px="$4" pb="$8">
                {filteredPostOptions.map((option) => (
                    <Pressable
                        key={option.id}
                        onPress={() => handlePostTypePress(option.id)}
                        bg="#FFFFFF"
                        $dark-bg="$backgroundDark800"
                        borderWidth={1}
                        borderColor="#E2E2E2"
                        $dark-borderColor="$borderDark600"
                        rounded={5}
                        overflow="hidden"
                        w="100%"
                        maxWidth={358}
                        h={60}
                        alignSelf="center"
                    >
                        <HStack alignItems="center" h="100%" pl="$3" pr="$3" py="$3.5">
                            {/* Icon Box - Left side with dashed border */}
                            <Box
                                w={24}
                                h={24}
                                justifyContent="center"
                                alignItems="center"
                                mr="$3"
                            >
                                {/* Dashed Rectangle Icon Container */}
                                <Box
                                    w={24}
                                    h={24}
                                    borderWidth={1}
                                    borderColor="#E8E8E8"
                                    $dark-borderColor="$borderDark600"
                                    borderStyle="dashed"
                                    borderRadius={2}
                                    justifyContent="center"
                                    alignItems="center"
                                    bg="#FFFFFF"
                                    $dark-bg="$backgroundDark800"
                                >
                                    <Image
                                        source={require('@/assets/add_post.png')}
                                        alt="Add Post"
                                        w={24}
                                        h={24}
                                        resizeMode="contain"
                                    />
                                </Box>
                            </Box>

                            {/* Text Content */}
                            <VStack flex={1} space="xs" justifyContent="center">
                                <Text
                                    fontSize={12}
                                    fontWeight="$semibold"
                                    color="#000000"
                                    $dark-color="$textDark50"
                                >
                                    {option.title}
                                </Text>
                                <Text
                                    fontSize={9}
                                    fontWeight="$normal"
                                    color="#B9B9B9"
                                    $dark-color="$textDark400"
                                >
                                    {option.description}
                                </Text>
                            </VStack>
                        </HStack>
                    </Pressable>
                ))}
            </VStack>
        </Box>
    );
};

