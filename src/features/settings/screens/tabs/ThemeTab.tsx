import React from 'react';
import { Box, HStack, Switch, Text } from '@gluestack-ui/themed';
import { Moon } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';

export const ThemeTab = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
      p="$4"
    >
      <HStack
        alignItems="center"
        justifyContent="space-between"
        bg={isDark ? '$backgroundDark0' : '$backgroundLight0'}
        p="$4"
        rounded="$lg"
      >
        <HStack alignItems='center' gap={"$2"}>
          <Moon size={20} color={isDark ? '#F9FAFB' : '#111827'} />
          <Text
            fontSize="$md"
            color={isDark ? '$textDark50' : '$textLight900'}
          >
            Dark Mode
          </Text>
        </HStack>
        <Switch
          value={isDark}
          onValueChange={toggleColorMode}
          trackColor={{ true: '#6366F1', false: '#D1D5DB' }}
          thumbColor={isDark ? '#818CF8' : '#FFFFFF'}
        />
      </HStack>
    </Box>
  );
}; 