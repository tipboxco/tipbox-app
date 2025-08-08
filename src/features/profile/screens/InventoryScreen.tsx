import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

export const InventoryScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box flex={1} p="$4">
      <Text
        color={isDark ? '$textDark50' : '$textLight900'}
        fontSize="$lg"
      >
        Envanter Sayfası
      </Text>
    </Box>
  );
};
