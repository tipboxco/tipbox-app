import React from 'react';
import { Box, HStack, Text, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

interface BrandProductInfoCardProps {
  productName: string;
  productImage: any;
}

const BrandProductInfoCard: React.FC<BrandProductInfoCardProps> = ({
  productName,
  productImage,
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
      <HStack alignItems="center" space="sm">
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
        >
          {productName}
        </Text>
      </HStack>
    </Box>
  );
};

export default BrandProductInfoCard;
