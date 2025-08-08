import React from 'react';
import { Center, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

export const InventoryTab = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Center flex={1}>
      <Text
        fontSize="$lg"
        fontWeight="$semibold"
        color={isDark ? '$textDark50' : '$textLight900'}
      >
        Envanter sayfasına hoş geldiniz!
      </Text>
    </Center>
  );
};
