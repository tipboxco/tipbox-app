import React from 'react';
import { Box, Text, Pressable, VStack, HStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { BrandCardModel } from '../../types';
import { CachedImage } from '@/src/components/CachedImage';

interface BrandCardProps {
  brand: BrandCardModel;
  onPress: () => void;
}

export const BrandCard: React.FC<BrandCardProps> = ({ brand, onPress }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Pressable
      onPress={onPress}
      bg={isDark ? '#1A1A1A' : '#FDFDFD'}
      borderWidth={1}
      borderColor="#E9E9E9"
      borderRadius={10}
      p="$3"
      flex={1}
      minHeight={120}
    >
      <VStack space="sm" flex={1}>
        {/* Brand Logo */}
        <HStack justifyContent="center" alignItems="center" mb="$2">
          <CachedImage
            source={brand.logo}
            alt={brand.name}
            style={{
              width: 86,
              height: 86,
              borderRadius: 5,
            }}
            resizeMode="contain"
            priority="normal"
            cachePolicy="memory-disk"
          />
        </HStack>

        {/* Brand Name */}
        <Text
          color={isDark ? '#FFFFFF' : '#000000'}
          fontSize={9}
          fontWeight="$semibold"
          textAlign="center"
          numberOfLines={2}
        >
          {brand.name}
        </Text>

        {/* Followers */}
        <HStack justifyContent="center" alignItems="center" space="xs">
          <Text
            color="#9D9D9D"
            fontSize={9}
            fontWeight="$medium"
          >
            {brand.followers}
          </Text>
        </HStack>
      </VStack>
    </Pressable>
  );
};

// Backward compatibility export for BrandCardBrand
export type BrandCardBrand = BrandCardModel;
