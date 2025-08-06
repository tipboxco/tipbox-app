import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

export const ProfileScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
      p="$4"
    >
      <Text
        fontSize="$2xl"
        fontWeight="$bold"
        color={isDark ? '$textDark50' : '$textLight900'}
      >
        Profil
      </Text>
    </Box>
  );
};
