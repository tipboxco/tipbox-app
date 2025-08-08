import React from 'react';
import { Box } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';

export const ExploreScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
    >
      <Header title="Explore" />
    </Box>
  );
};