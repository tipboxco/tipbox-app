import React from 'react';
import { Box, Text, Image, Pressable, VStack, HStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Brand } from '@/src/mock/catalog/brandCatalog/types';

interface BrandCardProps {
  brand: Brand;
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
          <Image
            source={brand.logo}
            alt={brand.name}
            width={40}
            height={40}
            borderRadius={20}
            resizeMode="cover"
          />
        </HStack>

        {/* Brand Name */}
        <Text
          color={isDark ? '#FFFFFF' : '#000000'}
          fontSize={12}
          fontWeight="$bold"
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

        {/* Join Status */}
        <Box
          bg={brand.isJoined ? "#C2E607" : "#F2F2F2"}
          borderRadius={5}
          px="$2"
          py="$1"
          alignSelf="center"
        >
          <Text
            color={brand.isJoined ? "#000000" : "#9D9D9D"}
            fontSize={8}
            fontWeight="$bold"
            textAlign="center"
          >
            {brand.isJoined ? "Joined" : "Join"}
          </Text>
        </Box>
      </VStack>
    </Pressable>
  );
};
