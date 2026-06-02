import React from 'react';
import { Dimensions } from 'react-native';
import {
    Box,
    VStack,
    Text,
    Image,
    Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2.5; // 16px padding on each side + 16px gap between cards

export interface ProductCardData {
    id: string;
    name: string;
    description: string;
    image: any;
}

interface ProductCardProps {
    data: ProductCardData;
    onPress?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ data, onPress }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <Pressable onPress={onPress}>
            <Box
                bg={isDark ? '#1A1A1A' : '#FFF'}
                borderWidth={1}
                borderColor={isDark ? '#333333' : '#E9E9E9'}
                borderRadius={10}
                width={CARD_WIDTH}
                overflow="hidden"
            >
                <VStack space="sm">
                    {/* Product Image */}
                    <Box
                        width="100%"
                        height={100}
                        bg="transparent"
                        alignItems="center"
                        justifyContent="center"
                        p='$4'
                    >
                        <Image
                            source={data.image}
                            alt={data.name}
                            style={{
                                width:'100%',
                                height: '100%'
                            }}
                            resizeMode="contain"
                        />
                    </Box>

                    {/* Product Info */}
                    <VStack space="xs" px="$3" pb="$3">
                        {/* Product Name */}
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={11}
                            fontWeight="$bold"
                            numberOfLines={1}
                        >
                            {data.name}
                        </Text>

                        {/* Product Description */}
                        {data.description && data.description.trim() !== '' && (
                            <Text
                                color={isDark ? '#FFFFFF' : '#B9B9B9'}
                                fontSize={9}
                                fontWeight="$normal"
                                numberOfLines={2}
                                lineHeight={12}
                            >
                                {data.description}
                            </Text>
                        )}
                    </VStack>
                </VStack>
            </Box>
        </Pressable>
    );
};

export default ProductCard;

