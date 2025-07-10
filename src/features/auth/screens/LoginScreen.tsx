import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { 
  Container, 
  SafeArea, 
  ScrollContainer, 
  VStack, 
  Box, 
  Text, 
  Input, 
  Button as PressableButton,
  colors 
} from '../../../components/ui';
import { useAuthStore } from '../../../store';
import * as authApi from '../api/authApi';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Email ve şifre alanları zorunludur.');
      return;
    }

    try {
      setLoading(true);
      // Gerçek API çağrısı olacak
      const result = await authApi.login({ email, password });
      await login(result.user, result.token);
      // Navigation RootNavigator'da otomatik olacak
    } catch (error) {
      Alert.alert('Hata', 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      // Misafir kullanıcı oluştur
      const guestUser = {
        id: 'guest-' + Date.now(),
        email: 'misafir@tipbox.com',
        name: 'Misafir Kullanıcı',
      };
      
      await login(guestUser, 'guest-token');
    } catch (error) {
      Alert.alert('Hata', 'Misafir girişi yapılamadı.');
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeArea bg={colors.background}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollContainer>
          <VStack spacing={8}>
            {/* Logo Section */}
            <Box pt={16} pb={8}>
              <Text variant="heading" size="4xl" color={colors.primary[500]} style={{ textAlign: 'center' }}>
                TipBox
              </Text>
                             <Text variant="body" color={colors.gray[600]} style={{ textAlign: 'center', marginTop: 8 }}>
                 Hesabınıza giriş yapın
               </Text>
            </Box>

            {/* Form Section */}
            <Box bg={colors.white} p={6} style={{ borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
              <VStack spacing={4}>
                <Input
                  label="Email"
                  placeholder="Email adresinizi girin"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />

                <Input
                  label="Şifre"
                  placeholder="Şifrenizi girin"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                />

                <PressableButton
                  variant="solid"
                  colorScheme="primary"
                  size="lg"
                  isLoading={loading}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  Giriş Yap
                </PressableButton>

                <PressableButton
                  variant="solid"
                  colorScheme="secondary"
                  size="lg"
                  isLoading={loading}
                  onPress={handleGuestLogin}
                  disabled={loading}
                >
                  Misafir Olarak Devam Et
                </PressableButton>

                                 <Box style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 }}>
                  <Text variant="body" color={colors.gray[600]}>
                    Hesabınız yok mu?{' '}
                  </Text>
                  <PressableButton
                    variant="link"
                    colorScheme="primary"
                    onPress={goToRegister}
                  >
                    Kayıt Ol
                  </PressableButton>
                </Box>
              </VStack>
            </Box>
          </VStack>
        </ScrollContainer>
      </KeyboardAvoidingView>
    </SafeArea>
  );
};

// Styles are now handled by GlueStack components 