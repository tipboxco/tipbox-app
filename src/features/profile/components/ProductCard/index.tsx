import React from 'react';
import { Box, Image, Text, VStack, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { WishlistDetailItem } from '../../types';

interface ProductCardProps {
    item?: WishlistDetailItem;
    onPress?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ item, onPress }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    if (!item) return null;

    return (
        <Pressable onPress={onPress}>
            <VStack width={100} space="xs" alignItems="center">
                <Box
                    width={100}
                    height={100}
                    borderRadius="$lg"
                    overflow="hidden"
                    borderWidth={1}
                    borderColor={isDark ? '$borderDark100' : '$borderLight200'}
                    bg={isDark ? '$backgroundDark900' : '$backgroundLight0'}
                >
                    <Image
                        source={item.image}
                        alt={item.productName}
                        width={100}
                        height={100}
                        resizeMode="cover"
                    />
                </Box>
                <Text
                    fontSize={12}
                    color={isDark ? '$textDark50' : '$textLight900'}
                    numberOfLines={2}
                    textAlign="center"
                    width="100%"
                >
                    {item.productName}
                </Text>
            </VStack>
        </Pressable>
    );
};