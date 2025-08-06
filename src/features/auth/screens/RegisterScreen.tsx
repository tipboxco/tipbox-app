import React from 'react';
import { Box, Text, Button, ButtonText, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

export const RegisterScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

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
          Hesap Oluştur
        </Text>
        
        <Text
          fontSize="$xl"
          color={isDark ? '$textDark300' : '$textLight600'}
          textAlign="center"
        >
          Yeni bir hesap oluşturun
        </Text>

        <Button
          bg={isDark ? '$primary600' : '$primary500'}
          py="$3"
          px="$6"
          rounded="$lg"
        >
          <ButtonText>Kayıt Ol</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
};
