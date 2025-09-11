import React from 'react';
import { VStack, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

const SetupProfileScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Text>Setup Profile Screen</Text>
    </VStack>
  );
};

export default SetupProfileScreen;
