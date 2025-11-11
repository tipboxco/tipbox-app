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
    onViewChange?: (view: 'options' | 'experience') => void;
    selectedProduct?: SelectedProduct;
    stage?: CatalogStage;
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
        // Reset view to options before closing
        setCurrentView('options');
        onViewChange?.('options');
        onPostTypeSelect?.('experience');
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

