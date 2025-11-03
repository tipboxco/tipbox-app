import React from 'react';
import { Box, HStack, Text, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

interface ProductInfoCardProps {
  image: any;
  title: string;
}

export const ProductInfoCard = ({ image, title }: ProductInfoCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box
      bg={isDark ? '$backgroundDark900' : '#FFFFFF'}
      borderWidth={1}
      borderColor="#E9E9E9"
      borderRadius={5}
      px={"$3"}
      py={"$2"}
      mx={"$4"}
      mt={"$2"}
    >
      <HStack alignItems="center" space="md">
        {/* Product Image */}
        <Box
          width={42}
          height={42}
          borderRadius={5}
          borderWidth={0.5}
          borderColor="#E9E9E9"
          overflow="hidden"
        >
          <Image
            source={image}
            alt="Product"
            width={42}
            height={42}
            resizeMode="cover"
          />
        </Box>

        {/* Product Title */}
        <Text
          color={isDark ? '$textDark50' : '#A3A3A3'}
          fontSize={11}
          fontWeight="$bold"
          flex={1}
          numberOfLines={2}
          lineHeight={13}
        >
          {title}
        </Text>
      </HStack>
    </Box>
  );
};

