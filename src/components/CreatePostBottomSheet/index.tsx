import React, { useState, useMemo } from 'react';
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
    onPostTypeSelect?: (type: PostType, experienceOption?: 'own' | 'tried') => void;
    onViewChange?: (view: 'options' | 'experience') => void;
    selectedProduct?: SelectedProduct;
    stage?: CatalogStage;
    showExperienceOptionsDirectly?: boolean; // If true, show experience options directly without showing post options
}

type ViewType = 'options' | 'experience';

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
    | 'benchmark'
    | 'update';

interface PostOption {
    id: PostType;
    title: string;
    description: string;
}

// Sıra: Experience -> Tips & Tricks -> Benchmark -> Update -> Question -> Free
const postOptions: PostOption[] = [
    {
        id: 'experience',
        title: 'Experience Post',
        description: 'Share your experience about this product',
    },
    {
        id: 'tips',
        title: 'Tips & Tricks',
        description: 'Share a tip about this product',
    },
    {
        id: 'benchmark',
        title: 'Benchmark Post',
        description: 'Compare this product with similar ones',
    },
    {
        id: 'update',
        title: 'Update Post',
        description: 'Share an update to your experience post',
    },
    {
        id: 'question',
        title: 'Question Post',
        description: 'Ask a question about this product',
    },
    {
        id: 'free',
        title: 'Free Post',
        description: 'Create a free post on any topic',
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
    showExperienceOptionsDirectly = false,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [currentView, setCurrentView] = useState<ViewType>(showExperienceOptionsDirectly ? 'experience' : 'options');

    // PERFORMANCE FIX: Cache filter operation with useMemo
    // This prevents recalculation on every render
    const filteredPostOptions = useMemo((): PostOption[] => {
        if (!stage) {
            // If no stage specified, show all options
            return postOptions;
        }

        switch (stage) {
            case 'subcategories':
            case 'productgroups':
                // Sıra: Free, Tips, Question (subcategory/productgroup seviyesinde)
                return [
                    postOptions.find(o => o.id === 'free'),
                    postOptions.find(o => o.id === 'tips'),
                    postOptions.find(o => o.id === 'question'),
                ].filter((o): o is PostOption => o != null);
            case 'products':
                // Product seviyesinde: Free, Experience, Update dahil tüm seçenekler
                return postOptions;
            default:
                return postOptions;
        }
    }, [stage]);


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
        // Reset view to options before closing (only if not showing directly)
        if (!showExperienceOptionsDirectly) {
            setCurrentView('options');
            onViewChange?.('options');
        }
        onPostTypeSelect?.('experience', optionId);
        onClose();
    };

    const handleBackPress = () => {
        if (currentView === 'experience') {
            // Go back to options
            setCurrentView('options');
            onViewChange?.('options');
        }
    };


    // Render experience options view
    if (currentView === 'experience') {
        return (
            <Box bg="#FDFDFB" $dark-bg="$backgroundDark950" minHeight={300} width="100%">
                {/* Header with back button - only show if not showing directly */}
                {!showExperienceOptionsDirectly && (
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
                                Experience Post
                            </Text>
                            <Box w={24} />
                        </HStack>
                    </VStack>
                )}
                
                {/* Header without back button when showing directly */}
                {showExperienceOptionsDirectly && (
                    <VStack space="sm" mb="$4" px="$4" pt="$4">
                        <HStack justifyContent="center" alignItems="center" w="100%">
                            <Text
                                fontSize={16}
                                fontWeight="$bold"
                                color="#000000"
                                $dark-color="$textDark50"
                                textAlign="center"
                            >
                                Experience Post
                            </Text>
                        </HStack>
                    </VStack>
                )}

                {/* Experience Options */}
                <VStack space="md" px="$4">
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
        <Box bg="#FDFDFB" $dark-bg="$backgroundDark950" minHeight={300} width="100%">
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
                        Create Post
                    </Text>
                </HStack>
            </VStack>

            {/* Post Options */}
            <VStack space="sm" px="$4">
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
                        <HStack alignItems="center" h="100%" px='$3'>
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

