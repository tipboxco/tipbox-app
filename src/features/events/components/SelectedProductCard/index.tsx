import React from 'react';
import {
    Box,
    HStack,
    VStack,
    Text,
    Image,
    Pressable,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface SelectedProductCardProps {
    productName: string;
    productImage: any;
    productCategory?: string;
    onPress?: () => void;
}

export const SelectedProductCard: React.FC<SelectedProductCardProps> = ({
    productName,
    productImage,
    productCategory,
    onPress,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <Pressable onPress={onPress}>
            <Box
                bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                borderRadius={8}
                borderWidth={1}
                borderColor={isDark ? '#333' : '#E9E9E9'}
                p="$3"
            >
                <HStack space="md" alignItems="center">
                    {/* Product Image */}
                    <Box
                        width={42}
                        height={42}
                        borderRadius={5}
                        overflow="hidden"
                    >
                        <Image
                            source={productImage}
                            alt={productName}
                            w={42}
                            h={42}
                            resizeMode="contain"
                        />
                    </Box>

                    {/* Product Info */}
                    <VStack flex={1}>
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={14}
                            fontWeight="$semibold"
                            numberOfLines={1}
                        >
                            {productName}
                        </Text>
                        {productCategory && (
                            <Text
                                color={isDark ? '#999' : '#666'}
                                fontSize={12}
                                numberOfLines={1}
                                mt="$1"
                            >
                                {productCategory}
                            </Text>
                        )}
                    </VStack>

                    {/* Chevron Right Icon */}
                    <Feather
                        name="chevron-right"
                        size={20}
                        color={isDark ? '#999' : '#666'}
                    />
                </HStack>
            </Box>
        </Pressable>
    );
};

export default SelectedProductCard;

