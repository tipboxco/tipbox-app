import React from 'react';
import { Pressable } from 'react-native';
import { Box, Text, HStack, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

interface AddWishlistCardProps {
  onPress?: () => void;
}

export const AddWishlistCard: React.FC<AddWishlistCardProps> = ({ onPress }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Pressable onPress={onPress}>
      <Box
        bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
        borderWidth={1}
        borderColor={isDark ? '$borderDark900' : '$borderLight200'}
        borderStyle="dashed"
        borderRadius="$lg"
        mb="$4"
      >
        <HStack space="md" py="$3" px="$4" alignItems="center">
          <Box
            width={100}
            height={100}
            alignItems="center"
            justifyContent="center"
          >
            <Feather
              name="plus"
              size={48}
              color={isDark ? '#666666' : '#999999'}
            />
          </Box>

          <VStack flex={1} space="xs">
            <Text
              fontSize={14}
              fontWeight="$bold"
              color={isDark ? '$textDark50' : '$textLight900'}
            >
              Add Wishlist
            </Text>
            <Text
              fontSize={9}
              color={isDark ? '$textDark400' : '$textLight500'}
              numberOfLines={2}
            >
              Create a new wishlist to save your favorite products
            </Text>
          </VStack>
        </HStack>
      </Box>
    </Pressable>
  );
};

