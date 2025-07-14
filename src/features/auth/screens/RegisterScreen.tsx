import React from 'react';
import { Pressable } from 'react-native';
import { Text, Container, Center, VStack } from '@/src/components/ui';

export const RegisterScreen: React.FC = () => {
  return (
    <Container bg='#f8fafc' p={6}>
      <Center p={8}>
        <VStack spacing={6}>
          <Text variant='heading' size='4xl' weight='bold' color='#333'>
            Kayıt Ol
          </Text>

          <Text variant='body' size='lg' color='#666'>
            Yeni hesap oluşturun
          </Text>

          <VStack spacing={4}>
            {/* Name Input Placeholder */}
            <Pressable
              style={{
                backgroundColor: '#fff',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#e2e8f0',
              }}
            >
              <Text color='#9ca3af'>Ad Soyad</Text>
            </Pressable>

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

            {/* Register Button Placeholder */}
            <Pressable
              style={{
                backgroundColor: '#10b981',
                padding: 14,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text weight='semibold' color='#fff'>
                Kayıt Ol
              </Text>
            </Pressable>
          </VStack>

          <Text variant='caption' color='#94a3b8'>
            Zaten hesabınız var mı? Giriş yapın
          </Text>
        </VStack>
      </Center>
    </Container>
  );
};
