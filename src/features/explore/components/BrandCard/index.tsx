import React from 'react';
import { Dimensions } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { BrandCardModel } from '@/src/features/catalog/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 16px padding on each side + 16px gap between cards

interface BrandCardProps {
  data: BrandCardModel;
  onPress?: () => void;
}

export const BrandCard: React.FC<BrandCardProps> = ({ data, onPress }) => {
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
        p="$3"
      >
        <HStack space="sm" alignItems="center">
          {/* Brand Logo */}
          <Image
            source={data.logo}
            alt={data.name}
            width={42}
            height={42}
            borderRadius={30}
            resizeMode="cover"
          />

          {/* Brand Info */}
          <VStack flex={1} space="xs">
            {/* Brand Name */}
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize="$sm"
              fontWeight="$bold"
              numberOfLines={1}
            >
              {data.name}
            </Text>

            {/* Brand Description */}
            <Text
              color={isDark ? '#FFFFFF' : '#B9B9B9'}
              fontSize="$xs"
              fontWeight="$normal"
              numberOfLines={2}
              lineHeight={16}
            >
              {data.description}
            </Text>
          </VStack>
        </HStack>
      </Box>
    </Pressable>
  );
};

export default BrandCard;

