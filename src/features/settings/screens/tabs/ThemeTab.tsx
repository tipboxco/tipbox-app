import React from 'react';
import { Box, HStack, Switch, Text } from '@gluestack-ui/themed';
import { Moon } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';

export const ThemeTab = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box
      style={{
        flex: 1,
        backgroundColor: isDark ? 'rgb(17, 24, 39)' : 'rgb(249, 250, 251)',
        padding: 16,
      }}
    >
      <HStack
        style={{
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: isDark ? 'rgb(31, 41, 55)' : 'rgb(243, 244, 246)',
          padding: 16,
          borderRadius: 8,
        }}
      >
        <HStack style={{ alignItems: 'center', gap: 8 }}>
          <Moon size={20} color={isDark ? '#F9FAFB' : '#111827'} />
          <Text
            style={{
              fontSize: 16,
              color: isDark ? '#F9FAFB' : '#111827',
            }}
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