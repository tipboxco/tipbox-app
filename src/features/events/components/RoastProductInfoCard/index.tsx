import React from 'react';
import { Box, HStack, VStack, Text, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

type RoastProductInfoCardProps = {
  name: string;
  description?: string | null;
  imageSource?: any;
};

export const RoastProductInfoCard: React.FC<RoastProductInfoCardProps> = ({
  name,
  description,
  imageSource,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const fallbackImage = require('@/assets/inventory/product_01.png');
  const safeDescription = (description ?? '').trim();

  return (
    <Box
      bg={isDark ? '#1A1A1A' : '#FDFDFD'}
      borderWidth={1}
      borderColor="#E9E9E9"
      borderRadius={5}
      px="$4"
      py="$3"
      width="100%"
    >
      <HStack space="md" alignItems="center">
        <Box
          width={54}
          height={54}
          borderRadius={5}
          overflow="hidden"
          bg={isDark ? '#2A2A2A' : '#F5F5F5'}
        >
          <Image
            source={imageSource ?? fallbackImage}
            alt={name}
            w={54}
            h={54}
            resizeMode="cover"
          />
        </Box>

        <VStack flex={1} space="xs">
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize={12}
            fontWeight="$bold"
            numberOfLines={1}
          >
            {name}
          </Text>

          {safeDescription ? (
            <Text
              color={isDark ? '#B9B9B9' : '#666666'}
              fontSize={11}
              lineHeight={15}
              numberOfLines={2}
            >
              {safeDescription}
            </Text>
          ) : null}
        </VStack>
      </HStack>
    </Box>
  );
};

export default RoastProductInfoCard;

