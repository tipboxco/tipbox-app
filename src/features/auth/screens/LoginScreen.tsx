import React from 'react';
import { Box, Text, Button, ButtonText, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useAuthStore } from '@/src/store';

export const LoginScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { loginAsGuest } = useAuthStore();

  const handleGuestLogin = async () => {
    console.log('Misafir girişi başlatılıyor...');
    await loginAsGuest();
    console.log('Misafir girişi tamamlandı!');
  };

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
      p="$4"
    >
      <VStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        space="xl"
      >
        <Text
          fontSize="$4xl"
          fontWeight="$bold"
          color={isDark ? '$textDark50' : '$textLight900'}
          textAlign="center"
        >
          Tipbox'a Hoşgeldiniz
        </Text>
        
        <Text
          fontSize="$xl"
          color={isDark ? '$textDark300' : '$textLight600'}
          textAlign="center"
        >
          Devam etmek için giriş yapın
        </Text>

        <Button
          onPress={handleGuestLogin}
          bg={isDark ? '$primary600' : '$primary500'}
          py="$3"
          px="$6"
          rounded="$lg"
        >
          <ButtonText>Misafir Olarak Devam Et</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
};
