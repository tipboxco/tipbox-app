import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

export const ExploreScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box
      style={{
        flex: 1,
        backgroundColor: isDark ? 'rgb(17, 24, 39)' : 'rgb(249, 250, 251)',
        padding: 16,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: isDark ? '#F9FAFB' : '#111827',
        }}
      >
        Keşfet
      </Text>
    </Box>
  );
};
