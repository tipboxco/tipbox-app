import React from 'react';
import { Alert } from 'react-native';
import { 
  SafeArea, 
  ScrollContainer, 
  VStack, 
  HStack,
  Box, 
  Text, 
  Card,
  Button as PressableButton,
  colors 
} from '../../../components/ui';
import { useAuthStore } from '../../../store';

export const ProfileScreen = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <SafeArea bg={colors.background}>
      <ScrollContainer>
        <VStack spacing={6}>
          {/* Profile Header */}
          <Card variant="elevated" size="lg">
            <VStack spacing={4} style={{ alignItems: 'center' }}>
              {/* Avatar */}
              <Box 
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: colors.primary[100],
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Text size="3xl" color={colors.primary[600]}>
                  {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
                </Text>
              </Box>
              
              {/* User Info */}
              <VStack spacing={1} style={{ alignItems: 'center' }}>
                <Text variant="subheading" size="xl" color={colors.gray[800]}>
                  {user?.name || 'Kullanıcı'}
                </Text>
                <Text variant="body" color={colors.gray[600]}>
                  {user?.email || 'email@example.com'}
                </Text>
              </VStack>
            </VStack>
          </Card>

          {/* Profile Info */}
          <Card variant="elevated">
            <VStack spacing={4}>
              <Text variant="subheading" color={colors.gray[800]}>
                Hesap Bilgileri
              </Text>
              
              <VStack spacing={3}>
                <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="label" color={colors.gray[600]}>Ad Soyad:</Text>
                  <Text variant="body" color={colors.gray[800]}>{user?.name || 'Belirtilmemiş'}</Text>
                </HStack>
                
                <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="label" color={colors.gray[600]}>Email:</Text>
                  <Text variant="body" color={colors.gray[800]}>{user?.email || 'Belirtilmemiş'}</Text>
                </HStack>
                
                <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="label" color={colors.gray[600]}>Hesap Türü:</Text>
                  <Text variant="body" color={colors.gray[800]}>
                    {user?.name ? 'Kayıtlı Kullanıcı' : 'Misafir'}
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </Card>

          {/* Profile Actions */}
          <Card variant="elevated">
            <VStack spacing={4}>
              <Text variant="subheading" color={colors.gray[800]}>
                Profil İşlemleri
              </Text>
              
              <VStack spacing={3}>
                <PressableButton
                  variant="outline"
                  colorScheme="gray"
                  size="lg"
                  onPress={() => Alert.alert('Bilgi', 'Bu özellik yakında gelecek!')}
                >
                  Profili Düzenle
                </PressableButton>
                
                <PressableButton
                  variant="outline"
                  colorScheme="gray"
                  size="lg"
                  onPress={() => Alert.alert('Bilgi', 'Bu özellik yakında gelecek!')}
                >
                  Şifre Değiştir
                </PressableButton>
                
                <PressableButton
                  variant="solid"
                  colorScheme="red"
                  size="lg"
                  onPress={handleLogout}
                >
                  Çıkış Yap
                </PressableButton>
              </VStack>
            </VStack>
          </Card>
        </VStack>
      </ScrollContainer>
    </SafeArea>
  );
};

// Styles are now handled by GlueStack components 