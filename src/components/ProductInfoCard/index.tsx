import React from 'react';
import { Box, HStack, VStack, Text, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

interface ProductInfoCardProps {
  // Product information
  image: any;
  name?: string;
  brand?: string;
  subName?: string;
  title?: string; // For backward compatibility
  // Card type
  type?: 'small' | 'big';
  // Optional styling props
  mx?: number | string;
  mt?: number | string;
}

export const ProductInfoCard = ({
  image,
  name,
  brand,
  subName,
  title,
  type = 'small',
}: ProductInfoCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Determine image size based on type
  const imageSize = type === 'big' ? 58 : 42;

  // Use title for backward compatibility, otherwise use name
  const displayTitle = title || name || '';
  const displayBrand = brand;
  const displaySubName = subName;

  return (
    <Box>
      <HStack alignItems="center" justifyContent="space-between" space="md">
        <HStack alignItems="center" space="md" flex={1}>
          {/* Product Image */}
          <Box
            width={imageSize}
            height={imageSize}
            borderRadius={5}
            borderWidth={0.5}
            borderColor="#E9E9E9"
            $dark-borderColor="$borderDark600"
            overflow="hidden"
            bg={isDark ? '$backgroundDark800' : '#F5F5F5'}
          >
            <Image
              source={image}
              alt={displayTitle || "Product"}
              width={imageSize}
              height={imageSize}
              resizeMode="cover"
            />
          </Box>

          {/* Product Info */}
          <VStack flex={1} space="xs">
            {displayBrand && (
              <Text
                color={isDark ? '$textDark400' : '#A3A3A3'}
                fontSize={11}
                fontWeight="$semibold"
                numberOfLines={1}
              >
                {displayBrand}
              </Text>
            )}
            <Text
              color={isDark ? '$textDark50' : '#A3A3A3'}
              fontSize={11}
              fontWeight="$bold"
              numberOfLines={type === 'big' ? 3 : 2}
            >
              {displayTitle}
            </Text>
            {displaySubName && (
              <Text
                color={isDark ? '$textDark400' : '#A3A3A3'}
                fontSize={11}
                fontWeight="$normal"
                numberOfLines={1}
              >
                {displaySubName}
              </Text>
            )}
          </VStack>
        </HStack>
        
        {/* Percentage Icon */}
        <Image
          source={require('@/assets/common/percentage_01.png')}
          alt={'percantage'}
          width={30}
          height={30}
        />
      </HStack>
    </Box>
  );
};

