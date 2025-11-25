import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Box, VStack, Text, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { InventoryItem } from '../../types';

interface InventoryCardProps {
  item: InventoryItem;
  width: number;
  onPress?: () => void;
}

export const InventoryCard = ({ item, width, onPress }: InventoryCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Box
        bg={isDark ? '$backgroundDark800' : '$white'}
        borderWidth={1}
        borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
        borderRadius={5}
        w={width}
        h={175}
        mb={10}
        overflow="hidden"
      >
        <Box
          flex={1}
          p={15}
          alignItems="center"
          justifyContent="center"
        >
          <Image
            source={typeof item.image === 'string' ? { uri: item.image } : item.image}
            alt={`${item.brand.name} ${item.brand.model}`}
            width={100}
            height={100}
            resizeMode="contain"
          />
        </Box>
        <VStack p={8} space="xs">
          <Text
            color={isDark ? '$textDark400' : '#A3A3A3'}
            fontSize={11}
            fontWeight="$bold"
            numberOfLines={3}
          >
            {item.brand.name}\n{item.brand.model}\n{item.brand.specs}
          </Text>
        </VStack>
      </Box>
    </TouchableOpacity>
  );
};

export default InventoryCard;
