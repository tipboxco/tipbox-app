import React from 'react';
import { Center, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

export const WishlistTab = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Center flex={1}>
      <Text
        fontSize="$lg"
        fontWeight="$semibold"
        color={isDark ? '$textDark50' : '$textLight900'}
      >
        Wishlist sayfasına hoş geldiniz!
      </Text>
    </Center>
  );
};
