import React, { useState } from 'react';
import { Box, Text, Button, ButtonText, VStack } from '@gluestack-ui/themed';
import { PinInput } from '@/src/components/ui/PinInput';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../navigation';
import { useAuthStore } from '@/src/store/authStore';

type VerifyCodeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'VerifyCode'>;
type VerifyCodeScreenRouteProp = RouteProp<AuthStackParamList, 'VerifyCode'>;

export const VerifyCodeScreen = () => {
  const { setTempUser } = useAuthStore();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<VerifyCodeScreenNavigationProp>();
  const route = useRoute<VerifyCodeScreenRouteProp>();
  const { email } = route.params;

  const [code, setCode] = useState(['', '', '', '', '', '']);

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) return; // Sadece tek karakter
    
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    if (verificationCode === '123456') { // Default doğrulama kodu
      try {
        console.log('Verification successful');
        // Mock kullanıcı verisi
        const mockUser = {
          id: '1',
          email,
          username: email.split('@')[0],
        };
        const mockAccessToken = 'mock-access-token';
        
        // Kullanıcıyı giriş yapmış olarak işaretle
        setTempUser(mockUser, mockAccessToken);
        
        // SetupProfile ekranına yönlendir
        navigation.navigate('SetupProfile');
      } catch (error) {
        console.error('Verification error:', error);
        // TODO: Hata mesajını kullanıcıya göster
      }
    } else if (verificationCode.length === 6) {
      console.error('Invalid verification code');
      // TODO: Hata mesajını kullanıcıya göster
    }
  };

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
      p="$4"
    >
      <VStack flex={1} space="xl" pt="$16">
        <Text
          fontSize="$2xl"
          fontWeight="$bold"
          color={isDark ? '$textDark50' : '$textLight900'}
        >
          Doğrulama kodunu girin
        </Text>
        
        <Text
          fontSize="$sm"
          color={isDark ? '$textDark300' : '$textLight600'}
          mb="$4"
        >
          Hesabınızı doğrulamak için size gönderdiğimiz 6 haneli kodu girin{'\n'}
          {email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(b.length))}
        </Text>

        <PinInput code={code} onChange={handleCodeChange} />

        <Button
          bg="$yellow400"
          py="$1"
          rounded="$lg"
          mt="$4"
          onPress={handleVerify}
          opacity={code.every(digit => digit !== '') ? 1 : 0.5}
          disabled={!code.every(digit => digit !== '')}
        >
          <ButtonText color="$textLight900">Devam Et</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
};
