import React from 'react';
import {
    Box,
    HStack,
    VStack,
    Text,
    Pressable,
    Image,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';

interface ActionButtonsProps {
    onShowPosts: () => void;
    onCreatePost: () => void;
    categoryName?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onShowPosts, onCreatePost, categoryName = 'Category' }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const { t } = useTranslation('catalog');

    return (
        <HStack space="sm" px="$4" pt="$4" pb="$2">
            {/* Show Posts Button */}
            <Pressable
                onPress={onShowPosts}
                flex={1}
                height={54}
                bg={isDark ? '#2A2A2A' : '#FDFDFD'}
                borderWidth={1}
                borderColor={isDark ? '#404040' : '#E9E9E9'}
                borderRadius={5}
                style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    opacity: pressed ? 0.8 : 1,
                })}
            >
                <HStack alignItems="center" flex={1}>
                    {/* Icon - Sol kenara yaslanmış */}
                    <Box
                        width={42}
                        height={54}
                        bg="#341385"
                        justifyContent="center"
                        alignItems="center"
                        borderTopLeftRadius={5}
                        borderBottomLeftRadius={5}
                    >
                        <Image
                            source={require('@/assets/catalog/show.png')}
                            alt="Show Posts"
                            width={26}
                            height={26}
                            resizeMode="contain"
                        />
                    </Box>

                    {/* Text Content */}
                    <VStack flex={1} alignItems="flex-start" justifyContent="center" px="$3">
                        <Text
                            color="#341385"
                            fontSize="$xs"
                            fontWeight="$bold"
                            textAlign="left"
                        >
                            {t('actionButtons.showPosts')}
                        </Text>
                        <Text
                            color={isDark ? '#ACACAC' : '#ACACAC'}
                            fontSize="$2xs"
                            fontWeight="$semibold"
                            textAlign="left"
                            numberOfLines={1}
                        >
                            {categoryName}
                        </Text>
                    </VStack>
                </HStack>
            </Pressable>

            {/* Create a Post Button */}
            <Pressable
                onPress={onCreatePost}
                flex={1}
                height={54}
                bg={isDark ? '#2A2A2A' : '#FDFDFD'}
                borderWidth={1}
                borderColor={isDark ? '#404040' : '#E9E9E9'}
                borderRadius={5}
                style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    opacity: pressed ? 0.8 : 1,
                })}
            >
                <HStack alignItems="center" flex={1}>
                    {/* Icon - Sol kenara yaslanmış */}
                    <Box
                        width={42}
                        height={54}
                        bg="#839A07"
                        justifyContent="center"
                        alignItems="center"
                        borderTopLeftRadius={5}
                        borderBottomLeftRadius={5}
                    >
                        <Image
                            source={require('@/assets/catalog/add.png')}
                            alt="Create a Post"
                            width={26}
                            height={26}
                            resizeMode="contain"
                        />
                    </Box>

                    {/* Text Content */}
                    <VStack flex={1} alignItems="flex-start" justifyContent="center" px="$3">
                        <Text
                            color="#829905"
                            fontSize="$xs"
                            fontWeight="$bold"
                            textAlign="left"
                        >
                            {t('actionButtons.createPost')}
                        </Text>
                        <Text
                            color={isDark ? '#ACACAC' : '#ACACAC'}
                            fontSize="$2xs"
                            fontWeight="$semibold"
                            textAlign="left"
                            numberOfLines={1}
                        >
                            {categoryName}
                        </Text>
                    </VStack>
                </HStack>
            </Pressable>
        </HStack>
    );
};

export default ActionButtons;
