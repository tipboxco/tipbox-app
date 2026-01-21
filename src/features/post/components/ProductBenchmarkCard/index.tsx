import React from 'react';
import { Box, VStack, HStack, Text, Pressable, Image } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface ProductBenchmarkCardProps {
  product: {
    id: string;
    name: string;
    brand?: string;
    image?: any;
    isOwned?: boolean;
  };
  isSelected?: boolean;
  onPress?: () => void;
}

export const ProductBenchmarkCard: React.FC<ProductBenchmarkCardProps> = ({
  product,
  isSelected = false,
  onPress,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Pressable
      onPress={onPress}
      flex={1}
      mx={4}
    >
      <Box
        borderWidth={1}
        borderColor={isSelected ? '#B2D209' : '#E9E9E9'}
        $dark-borderColor={isSelected ? '#B2D209' : '$borderDark600'}
        borderRadius={10}
        minHeight={200}
        position="relative"
        overflow="hidden"
      >
        <VStack justifyContent="flex-start" flex={1}>
          {/* Image Container - Top, Centered 130x130 */}
          <Box 
            position="relative" 
            justifyContent="center"
            alignItems="center"
            alignSelf="center"
            pt="$4"
          >
            <Image
              w={130}
              h={130}
              borderRadius={10}
              source={product.image || require('@/assets/product/product_01.png')}
              alt={product.name}
              resizeMode="cover"
            />
          </Box>
          
          {/* Product Info - Bottom, Left Aligned */}
          <VStack alignItems="flex-start" space="xs" px='$3' pb='$2' mt="auto" position="relative">
            {product.brand && (
              <Text
                color={isDark ? '$textDark400' : '#787878'}
                fontSize={10}
                fontWeight="$semibold"
                numberOfLines={1}
              >
                {product.brand}
              </Text>
            )}
            <Text
              color={isDark ? '$textDark50' : '#000'}
              fontSize={10}
              fontWeight="$semibold"
              numberOfLines={2}
              textAlign="left"
            >
              {product.name}
            </Text>
            
            {/* Radio Button - Bottom Right Corner */}
            <Box
              position="absolute"
              bottom={10}
              right={10}
              width={20}
              height={20}
              borderWidth={1.5}
              borderColor={isSelected ? '#B2D209' : (isDark ? '#8C8C8C' : '#8C8C8C')}
              borderRadius={10}
              bg="transparent"
              justifyContent="center"
              alignItems="center"
            >
              {isSelected && (
                <Box
                  width={12}
                  height={12}
                  borderRadius={6}
                  bg="#B2D209"
                />
              )}
            </Box>
          </VStack>
        </VStack>
      </Box>
    </Pressable>
  );
};
