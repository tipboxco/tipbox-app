import React, { useState, useMemo, useCallback } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
    Image,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { TrashIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useDraftStore, type Draft } from '@/src/store/draftStore';

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
    onDraftSelect?: (draft: Draft) => void;
    selectedProduct?: SelectedProduct;
    stage?: CatalogStage;
    showExperienceOptionsDirectly?: boolean;
}

type ViewType = 'options' | 'experience';

interface ExperienceOption {
    id: 'own' | 'tried';
    titleKey: string;
    descriptionKey: string;
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
    titleKey: string;
    descriptionKey: string;
}

const postOptions: PostOption[] = [
    { id: 'experience', titleKey: 'createPost.types.experience', descriptionKey: 'createPost.types.experienceDesc' },
    { id: 'tips', titleKey: 'createPost.types.tips', descriptionKey: 'createPost.types.tipsDesc' },
    { id: 'benchmark', titleKey: 'createPost.types.benchmark', descriptionKey: 'createPost.types.benchmarkDesc' },
    { id: 'update', titleKey: 'createPost.types.update', descriptionKey: 'createPost.types.updateDesc' },
    { id: 'question', titleKey: 'createPost.types.question', descriptionKey: 'createPost.types.questionDesc' },
    { id: 'free', titleKey: 'createPost.types.free', descriptionKey: 'createPost.types.freeDesc' },
];

const experienceOptions: ExperienceOption[] = [
    { id: 'own', titleKey: 'createPost.experienceOptions.own', descriptionKey: 'createPost.experienceOptions.ownDesc' },
    { id: 'tried', titleKey: 'createPost.experienceOptions.tried', descriptionKey: 'createPost.experienceOptions.triedDesc' },
];

const POST_TYPE_LABELS: Record<PostType, string> = {
    experience: 'createPost.types.experience',
    tips: 'createPost.types.tips',
    benchmark: 'createPost.types.benchmark',
    update: 'createPost.types.update',
    question: 'createPost.types.question',
    free: 'createPost.types.free',
};

const formatDraftDate = (isoDate: string) => {
    try {
        const d = new Date(isoDate);
        return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
        return '';
    }
};

export const CreatePostBottomSheet: React.FC<CreatePostBottomSheetProps> = ({
    onClose,
    onPostTypeSelect,
    onViewChange,
    onDraftSelect,
    selectedProduct,
    stage,
    showExperienceOptionsDirectly = false,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const { t } = useTranslation('common');
    const [currentView, setCurrentView] = useState<ViewType>(showExperienceOptionsDirectly ? 'experience' : 'options');
    const [showDrafts, setShowDrafts] = useState(false);

    const { drafts, deleteDraft } = useDraftStore();

    const filteredPostOptions = useMemo((): PostOption[] => {
        if (!stage) return postOptions;
        switch (stage) {
            case 'subcategories':
            case 'productgroups':
                return [
                    postOptions.find(o => o.id === 'free'),
                    postOptions.find(o => o.id === 'tips'),
                    postOptions.find(o => o.id === 'question'),
                ].filter((o): o is PostOption => o != null);
            case 'products':
                return postOptions;
            default:
                return postOptions;
        }
    }, [stage]);

    const handlePostTypePress = (type: PostType) => {
        if (type === 'experience') {
            setCurrentView('experience');
            onViewChange?.('experience');
        } else {
            onPostTypeSelect?.(type);
        }
    };

    const handleExperienceOptionPress = (optionId: 'own' | 'tried') => {
        if (!showExperienceOptionsDirectly) {
            setCurrentView('options');
            onViewChange?.('options');
        }
        onPostTypeSelect?.('experience', optionId);
    };

    const handleBackPress = () => {
        if (currentView === 'experience') {
            setCurrentView('options');
            onViewChange?.('options');
        }
    };

    const handleDraftDelete = useCallback((id: string) => {
        deleteDraft(id);
    }, [deleteDraft]);

    const handleDraftContinue = useCallback((draft: Draft) => {
        onDraftSelect?.(draft);
    }, [onDraftSelect]);

    const bg = isDark ? '$backgroundDark950' : '#FDFDFB';
    const borderColor = isDark ? '$borderDark600' : '#E2E2E2';
    const textColor = isDark ? '$textDark50' : '#000000';
    const subTextColor = isDark ? '$textDark400' : '#B9B9B9';

    if (currentView === 'experience') {
        return (
            <Box bg={bg} minHeight={300} width="100%">
                {!showExperienceOptionsDirectly && (
                    <VStack space="sm" mb="$4" px="$4" pt="$4">
                        <HStack justifyContent="space-between" alignItems="center" w="100%">
                            <Pressable onPress={handleBackPress}>
                                <Feather name="arrow-left" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                            </Pressable>
                            <Text fontSize={16} fontWeight="$bold" color={textColor} textAlign="center" flex={1}>
                                {t('createPost.types.experience')}
                            </Text>
                            <Box w={24} />
                        </HStack>
                    </VStack>
                )}
                {showExperienceOptionsDirectly && (
                    <VStack space="sm" mb="$4" px="$4" pt="$4">
                        <HStack justifyContent="center" alignItems="center" w="100%">
                            <Text fontSize={16} fontWeight="$bold" color={textColor} textAlign="center">
                                {t('createPost.types.experience')}
                            </Text>
                        </HStack>
                    </VStack>
                )}
                <VStack space="md" px="$4">
                    {experienceOptions.map((option) => (
                        <Pressable
                            key={option.id}
                            onPress={() => handleExperienceOptionPress(option.id)}
                            bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                            borderWidth={1}
                            borderColor={borderColor}
                            rounded={10}
                            overflow="hidden"
                            w="100%"
                            maxWidth={358}
                            alignSelf="center"
                        >
                            <HStack alignItems="flex-start" px={13} py={16} space="sm">
                                <Box w={24} h={24} justifyContent="center" alignItems="center">
                                    <Box w={24} h={24} borderWidth={1} borderColor={isDark ? '#444444' : '#E8E8E8'} borderStyle="dashed" borderRadius={2} justifyContent="center" alignItems="center" bg={isDark ? '$backgroundDark800' : '#FFFFFF'}>
                                        <Image source={require('@/assets/add_post.png')} alt={t(option.titleKey)} w={24} h={24} resizeMode="contain" />
                                    </Box>
                                </Box>
                                <VStack flex={1} space="xs">
                                    <Text fontSize={12} fontWeight="$semibold" color={textColor}>{t(option.titleKey)}</Text>
                                    <Text fontSize={10} fontWeight="$normal" color={subTextColor} lineHeight={14}>{t(option.descriptionKey)}</Text>
                                </VStack>
                            </HStack>
                        </Pressable>
                    ))}
                </VStack>
            </Box>
        );
    }

    return (
        <Box bg={bg} minHeight={300} width="100%">
            {/* Header */}
            <VStack space="md" mb="$4" px="$4" pt="$4">
                <HStack justifyContent="center" alignItems="center" w="100%">
                    <Text fontSize={16} fontWeight="$bold" color={textColor} textAlign="center">
                        {t('createPost.title')}
                    </Text>
                </HStack>
            </VStack>

            {/* Drafts Section */}
            {drafts.length > 0 && (
                <Box px="$4" mb="$3">
                    <Pressable
                        onPress={() => setShowDrafts(!showDrafts)}
                        py={8}
                        px={12}
                        borderRadius={8}
                        borderWidth={1}
                        borderColor={isDark ? '#333' : '#E9E9E9'}
                        bg={isDark ? '#1A1A1A' : '#F8F8F8'}
                    >
                        <HStack alignItems="center" justifyContent="space-between">
                            <HStack alignItems="center" space="sm">
                                <Feather name="file-text" size={14} color={isDark ? '#AAAAAA' : '#666666'} />
                                <Text fontSize={12} fontWeight="$semibold" color={isDark ? '#AAAAAA' : '#555555'}>
                                    {t('createPost.drafts.title')} ({drafts.length})
                                </Text>
                            </HStack>
                            <Feather name={showDrafts ? 'chevron-up' : 'chevron-down'} size={14} color={isDark ? '#AAAAAA' : '#666666'} />
                        </HStack>
                    </Pressable>

                    {showDrafts && (
                        <VStack space="xs" mt="$2">
                            {drafts.map((draft) => (
                                <HStack
                                    key={draft.id}
                                    alignItems="center"
                                    borderWidth={1}
                                    borderColor={isDark ? '#333' : '#E9E9E9'}
                                    borderRadius={6}
                                    px={12}
                                    py={8}
                                    bg={isDark ? '#0F0F0F' : '#FFFFFF'}
                                >
                                    <VStack flex={1}>
                                        <Text fontSize={11} fontWeight="$semibold" color={textColor} numberOfLines={1}>
                                            {t(POST_TYPE_LABELS[draft.type])}
                                            {draft.productName ? ` — ${draft.productName}` : ''}
                                        </Text>
                                        <Text fontSize={9} color={subTextColor}>
                                            {t('createPost.drafts.savedAt')} {formatDraftDate(draft.createdAt)}
                                        </Text>
                                    </VStack>
                                    <HStack space="sm" alignItems="center">
                                        {onDraftSelect && (
                                            <Pressable
                                                onPress={() => handleDraftContinue(draft)}
                                                px={8}
                                                py={4}
                                                borderRadius={4}
                                                bg={isDark ? '#2A2A2A' : '#F0F0F0'}
                                            >
                                                <Text fontSize={10} fontWeight="$semibold" color={textColor}>
                                                    {t('createPost.drafts.continue')}
                                                </Text>
                                            </Pressable>
                                        )}
                                        <Pressable onPress={() => handleDraftDelete(draft.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                            <TrashIcon width={14} height={14} color={isDark ? '#888' : '#999'} />
                                        </Pressable>
                                    </HStack>
                                </HStack>
                            ))}
                        </VStack>
                    )}
                </Box>
            )}

            {/* Post Options */}
            <VStack space="sm" px="$4">
                {filteredPostOptions.map((option) => (
                    <Pressable
                        key={option.id}
                        onPress={() => handlePostTypePress(option.id)}
                        bg={isDark ? '$backgroundDark800' : '#FFFFFF'}
                        borderWidth={1}
                        borderColor={isDark ? '$borderDark600' : '#E2E2E2'}
                        rounded={5}
                        overflow="hidden"
                        w="100%"
                        maxWidth={358}
                        h={60}
                        alignSelf="center"
                    >
                        <HStack alignItems="center" h="100%" px="$3">
                            <Box w={24} h={24} justifyContent="center" alignItems="center" mr="$3">
                                <Box w={24} h={24} borderWidth={1} borderColor={isDark ? '#444444' : '#E8E8E8'} borderStyle="dashed" borderRadius={2} justifyContent="center" alignItems="center" bg={isDark ? '$backgroundDark800' : '#FFFFFF'}>
                                    <Image source={require('@/assets/add_post.png')} alt="Add Post" w={24} h={24} resizeMode="contain" />
                                </Box>
                            </Box>
                            <VStack flex={1} space="xs" justifyContent="center">
                                <Text fontSize={12} fontWeight="$semibold" color={textColor}>{t(option.titleKey)}</Text>
                                <Text fontSize={9} fontWeight="$normal" color={subTextColor}>{t(option.descriptionKey)}</Text>
                            </VStack>
                        </HStack>
                    </Pressable>
                ))}
            </VStack>
        </Box>
    );
};
