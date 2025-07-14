import React from 'react';
import { Pressable } from 'react-native';
import { Text, Container, Center, VStack } from '@/src/components/ui';
import { useAuthStore } from '@/src/store';

export const LoginScreen: React.FC = () => {
  const { loginAsGuest, isLoading } = useAuthStore();

  const handleGuestLogin = async () => {
    await loginAsGuest();
  };

  return (
    <Container bg='#f8fafc' p={6}>
      <Center p={8}>
        <VStack spacing={6}>
          <Text variant='heading' size='4xl' weight='bold' color='#333'>
            Tipbox
          </Text>

          <Text variant='body' size='lg' color='#666'>
            Hesabınıza giriş yapın
          </Text>

          <VStack spacing={4}>
            {/* Email Input Placeholder */}
            <Pressable
              style={{
                backgroundColor: '#fff',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#e2e8f0',
              }}
            >
              <Text color='#9ca3af'>E-posta adresi</Text>
            </Pressable>

            {/* Password Input Placeholder */}
            <Pressable
              style={{
                backgroundColor: '#fff',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#e2e8f0',
              }}
            >
              <Text color='#9ca3af'>Şifre</Text>
            </Pressable>

            {/* Login Button Placeholder */}
            <Pressable
              style={{
                backgroundColor: '#6366f1',
                padding: 14,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text weight='semibold' color='#fff'>
                Giriş Yap
              </Text>
            </Pressable>

            {/* Guest Login Button */}
            <Pressable
              onPress={handleGuestLogin}
              disabled={isLoading}
              style={{
                backgroundColor: '#f1f5f9',
                padding: 14,
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#cbd5e1',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              <Text weight='medium' color='#475569'>
                {isLoading ? 'Giriş yapılıyor...' : 'Misafir Olarak Giriş Yap'}
              </Text>
            </Pressable>
          </VStack>

          <Text variant='caption' color='#94a3b8'>
            Hesabınız yok mu? Kayıt olun
          </Text>
        </VStack>
      </Center>
    </Container>
  );
};
