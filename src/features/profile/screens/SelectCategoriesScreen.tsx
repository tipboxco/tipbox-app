import React from 'react';
import { VStack, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

const SelectCategoriesScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Text>Select Categories Screen</Text>
    </VStack>
  );
};

export default SelectCategoriesScreen;
