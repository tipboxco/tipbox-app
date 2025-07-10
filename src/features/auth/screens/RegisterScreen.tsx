import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { 
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

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Hata', 'Tüm alanları doldurunuz.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    try {
      setLoading(true);
      // Gerçek API çağrısı olacak
      const result = await authApi.register({ name, email, password });
      await login(result.user, result.token);
      Alert.alert('Başarılı', 'Kayıt işlemi tamamlandı!');
    } catch (error) {
      Alert.alert('Hata', 'Kayıt işlemi başarısız. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.navigate('Login');
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
                Yeni hesap oluşturun
              </Text>
            </Box>

            {/* Form Section */}
            <Box bg={colors.white} p={6} style={{ borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
              <VStack spacing={4}>
                <Input
                  label="Ad Soyad"
                  placeholder="Adınızı ve soyadınızı girin"
                  value={name}
                  onChangeText={setName}
                  autoComplete="name"
                />

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
                  placeholder="Şifrenizi girin (min. 6 karakter)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password-new"
                />

                <Input
                  label="Şifre Tekrar"
                  placeholder="Şifrenizi tekrar girin"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoComplete="password-new"
                />

                <PressableButton
                  variant="solid"
                  colorScheme="primary"
                  size="lg"
                  isLoading={loading}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  Kayıt Ol
                </PressableButton>

                <Box style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 }}>
                  <Text variant="body" color={colors.gray[600]}>
                    Zaten hesabınız var mı?{' '}
                  </Text>
                  <PressableButton
                    variant="link"
                    colorScheme="primary"
                    onPress={goToLogin}
                  >
                    Giriş Yap
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