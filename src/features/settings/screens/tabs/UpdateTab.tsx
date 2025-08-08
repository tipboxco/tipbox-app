import React from 'react';
import { Box, Text, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { OTAUpdateCard } from '../../components/OTAUpdateCard';

export const UpdateTab = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box
      flex={1}
      p="$4"
      bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
    >
      <VStack space="lg">
        <OTAUpdateCard />
        <Text>Deneme</Text>
      </VStack>
    </Box>
  );
};
