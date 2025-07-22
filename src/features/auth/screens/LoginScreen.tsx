import React from 'react';
import { Box, Text, Button, ButtonText, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useAuthStore } from '@/src/store';

export const LoginScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { loginAsGuest } = useAuthStore();

  const handleGuestLogin = async () => {
    await loginAsGuest();
  };

  return (
    <Box
      style={{
        flex: 1,
        backgroundColor: isDark ? 'rgb(17, 24, 39)' : 'rgb(249, 250, 251)',
        padding: 16,
      }}
    >
      <VStack style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 24 }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: isDark ? '#F9FAFB' : '#111827',
            textAlign: 'center',
          }}
        >
          Tipbox'a Hoşgeldiniz
        </Text>
        
        <Text
          style={{
            fontSize: 18,
            color: isDark ? '#D1D5DB' : '#4B5563',
            textAlign: 'center',
          }}
        >
          Devam etmek için giriş yapın
        </Text>

        <Button
          onPress={handleGuestLogin}
          style={{
            backgroundColor: isDark ? '#4F46E5' : '#6366F1',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
          }}
        >
          <ButtonText>Misafir Olarak Devam Et</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
};
