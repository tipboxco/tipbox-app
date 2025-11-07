import React from 'react';
import {
    Box,
    VStack,
    Text,
    Image,
    Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

export interface Category {
    id: string;
    name: string;
    image: any;
    category?: string;
}

interface CategoryCardProps {
    category: Category;
    onPress: (category: Category) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onPress }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <Pressable
            onPress={() => onPress(category)}
            width={114}
            height={132}
            borderRadius={5}
            bg={isDark ? '#2A2A2A' : '#FDFDFD'}
            borderWidth={1}
            borderColor={isDark ? '#404040' : '#E9E9E9'}
            justifyContent="center"
            alignItems="center"
            style={({ pressed }) => ({
                transform: [{ scale: pressed ? 0.95 : 1 }],
                opacity: pressed ? 0.8 : 1,
            })}
        >
            <VStack alignItems="center" space="sm" flex={1} justifyContent="center">
                {/* Category Icon */}
                <Box
                    width={86}
                    height={86}
                    borderRadius={5}
                    bg={'transparent'}
                    justifyContent="center"
                    alignItems="center"
                    py={'$1'}
                >
                    <Image
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                        source={category.image}
                        alt={category.name}
                        borderRadius={5}
                        resizeMode="contain"
                    />
                </Box>

                {/* Category Name */}
                <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize={8}
                    fontWeight="$bold"
                    textAlign="center"
                    numberOfLines={2}
                    px="$1"
                    lineHeight={10}
                >
                    {category.name}
                </Text>
            </VStack>
        </Pressable>
    );
};

export default CategoryCard;

