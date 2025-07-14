import React from 'react';
import { Pressable } from 'react-native';
import { Text, Container, Center, VStack } from '@/src/components/ui';
import { useAuthStore } from '@/src/store';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Container bg='#f8fafc' p={6}>
      <Center p={8}>
        <VStack spacing={6}>
          <Text variant='heading' size='3xl' weight='bold' color='#333'>
            Profil
          </Text>

          <VStack spacing={4}>
            <Text variant='body' size='lg' color='#666'>
              Merhaba, {user?.name || 'Kullanıcı'}!
            </Text>

            {user?.isGuest && (
              <Text variant='caption' color='#f59e0b'>
                Misafir hesap ile giriş yaptınız
              </Text>
            )}

            <Pressable
              onPress={handleLogout}
              style={{
                backgroundColor: '#ef4444',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 20,
              }}
            >
              <Text weight='semibold' color='#fff'>
                Çıkış Yap
              </Text>
            </Pressable>
          </VStack>
        </VStack>
      </Center>
    </Container>
  );
};
