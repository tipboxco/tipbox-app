import React from 'react';
import { Box, HStack, Text, Image, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { toImageSource } from '@/src/utils';

interface BrandProductInfoCardProps {
  productName: string;
  productImage: any;
  brandName?: string;
  brandImage?: string | null;
}

const BrandProductInfoCard: React.FC<BrandProductInfoCardProps> = ({
  productName,
  productImage,
  brandName,
  brandImage,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box
      bg={isDark ? '#1A1A1A' : '#FDFDFD'}
      borderWidth={1}
      borderColor="#E9E9E9"
      borderRadius={10}
      px='$4'
      py='$2'
    >
      <HStack alignItems="center" space="sm" justifyContent="space-between">
        {/* Left: Product Image and Name */}
        <HStack alignItems="center" space="sm" flex={1}>
          {/* Product Image */}
          <Box
            width={44}
            height={44}
            borderRadius={5}
            bg="#F6F6F6"
            alignItems="center"
            justifyContent="center"
          >
            <Image
              source={productImage}
              alt={productName}
              style={{
                width: 44,
                height: 44,
              }}
              resizeMode="contain"
            />
          </Box>

          {/* Product Name */}
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize={12}
            fontWeight="$bold"
            flex={1}
            numberOfLines={1}
          >
            {productName}
          </Text>
        </HStack>

        {/* Right: Brand Info */}
        {brandName && (
          <HStack alignItems="center" space="xs">
            {brandImage && (
              <Box
                width={24}
                height={24}
                borderRadius={12}
                bg="#F6F6F6"
                alignItems="center"
                justifyContent="center"
                overflow="hidden"
              >
                <Image
                  source={toImageSource(brandImage) || require('@/assets/events/card-icon.png')}
                  alt={brandName}
                  style={{
                    width: 24,
                    height: 24,
                  }}
                  resizeMode="cover"
                />
              </Box>
            )}
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={10}
              fontWeight="$semibold"
              numberOfLines={1}
            >
              {brandName}
            </Text>
          </HStack>
        )}
      </HStack>
    </Box>
  );
};

export default BrandProductInfoCard;
