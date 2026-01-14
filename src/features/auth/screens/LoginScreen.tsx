import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, HStack, Input, InputField, FormControl, FormControlLabel, FormControlLabelText, Icon, Pressable, useToast } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { CheckCircle, Mail, Eye, EyeOff } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation';
import { useAppStore } from '@/src/store/appStore';
import { useLogin, useGoogleLogin } from '../api/hooks';
import { googleService } from '@/src/services/GoogleService';
import { showCustomToast } from '@/src/components/CustomToast';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { loginAsGuest } = useAppStore();
  const toast = useToast();
  const loginMutation = useLogin();
  const googleLoginMutation = useGoogleLogin();
  const insets = useSafeAreaInsets();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Edge-to-Edge Design: Top ve bottom insets için beyaz background
  const backgroundColor = '#FFFFFF';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (text: string) => {
    const lowerText = text.toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmail(lowerText);
    setIsEmailValid(emailRegex.test(lowerText));
  };

  const validatePassword = (text: string) => {
    setPassword(text);
    setIsPasswordValid(text.length >= 8);
  };

  const handleSignIn = async () => {
    if (isEmailValid && isPasswordValid) {
      try {
        // React Query mutation kullanarak login işlemi
        const result = await loginMutation.mutateAsync({
          email,
          password,
        });

        // Console'da response'u göster (sadece development modunda)
        if (__DEV__) {
          console.log('[LoginScreen] ✅ Login successful:', {
            userId: result.id,
            fullName: result.fullName,
            email: result.email,
            hasToken: !!result.token,
            hasRefreshToken: !!result.refreshToken,
          });
        }

        // Başarılı toast göster
        showCustomToast(toast, {
          title: `Hoş geldin ${result.fullName || result.email?.split('@')[0] || 'Kullanıcı'}!`,
          action: 'success',
          duration: 3000,
        });

        // RootNavigator otomatik olarak isAuthenticated=true olduğunda
        // Auth'dan MainDrawer'a geçiş yapacak, manuel navigation gerekmez
      } catch (error: any) {
        // Console'da error'u göster (sadece development modunda)
        if (__DEV__) {
          console.error('[LoginScreen] ❌ Login error:', {
            message: error?.message,
            status: error?.response?.status,
            responseMessage: error?.response?.data?.message,
          });
        }

        // Hata toast göster - Backend'den gelen mesajı kullan veya genel mesaj
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'Giriş yapılırken bir hata oluştu';

        showCustomToast(toast, {
          title: 'Login Failed',
          description: errorMessage,
          action: 'error',
          duration: 4000,
        });
      }
    }
  };

  const handleGuestLogin = async () => {
    try {
      console.log('Starting guest login...');
      await loginAsGuest();
      console.log('Guest login completed!');
      
      // Ana sayfaya yönlendir
      navigation.reset({
        index: 0,
        routes: [{ 
          name: 'Main' as never,
          params: {
            screen: 'Feed',
            params: {}
          }
        }],
      });
    } catch (error) {
      console.error('Guest login error:', error);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);

      // Google OAuth ile giriş yap
      const googleResult = await googleService.login();

      // Backend'e ID token gönder
      await googleLoginMutation.mutateAsync(googleResult.idToken);

      // Başarılı toast göster
      showCustomToast(toast, {
        title: `Hoş geldin ${googleResult.user.name || googleResult.user.email?.split('@')[0] || 'Kullanıcı'}!`,
        action: 'success',
        duration: 3000,
      });

      // RootNavigator otomatik olarak isAuthenticated=true olduğunda
      // Auth'dan MainDrawer'a geçiş yapacak, manuel navigation gerekmez
    } catch (error: any) {
      console.error('[LoginScreen] ❌ Google login error:', error);

      // Hata toast göster
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        'Google ile giriş yapılırken bir hata oluştu';

      showCustomToast(toast, {
        title: 'Google Login Failed',
        description: errorMessage,
        action: 'error',
        duration: 4000,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor }}>
      {/* Üst Güvenli Alan - Status Bar arkasını beyaz boyar */}
      <View 
        style={{ 
          height: insets.top, 
          backgroundColor,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1,
        }} 
      />

      {/* Ana İçerik */}
      <View style={{ flex: 1 }}>
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
          Sign In
        </Text>
        
        <Text
          fontSize="$sm"
          color={isDark ? '$textDark300' : '$textLight600'}
          mb="$4"
        >
          Enter the email where you can be contacted.{'\n'}
          No one will see this on your profile.
        </Text>

        <VStack space="md">
          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Email</FormControlLabelText>
            </FormControlLabel>
            <Input
              variant="outline"
              size="md"
              bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
              borderColor={isDark ? '$borderDark100' : '$borderLight100'}
              alignItems="center"
            >
              <InputField 
                placeholder="Your email address"
                value={email}
                onChangeText={validateEmail}
              />
              <Icon 
                as={CheckCircle} 
                color={isEmailValid ? "$success500" : "$gray400"} 
                size="md" 
                mr="$2"
                alignSelf="center"
              />
            </Input>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Password</FormControlLabelText>
            </FormControlLabel>
            <Input
              variant="outline"
              size="md"
              bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
              borderColor={isDark ? '$borderDark100' : '$borderLight100'}
              alignItems="center"
            >
              <InputField 
                placeholder="Your password" 
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={validatePassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Icon 
                  as={showPassword ? EyeOff : Eye} 
                  color={isDark ? '$textDark300' : '$textLight600'} 
                  size="md" 
                  mr="$2"
                  alignSelf="center"
                />
              </Pressable>
            </Input>
            <Box flexDirection="row" justifyContent="flex-end" mt="$1">
              <Text
                fontSize="$xs"
                color={isDark ? '$primary400' : '$primary600'}
                onPress={handleForgotPassword}
                style={{ textDecorationLine: 'underline' }}
              >
                Forgot Password?
              </Text>
            </Box>
          </FormControl>
        </VStack>

        <Button
          bg="$buttonPrimary"
          py="$1"
          rounded="$lg"
          mt="$4"
          onPress={handleSignIn}
          opacity={isEmailValid && isPasswordValid && !loginMutation.isPending ? 1 : 0.5}
          disabled={!isEmailValid || !isPasswordValid || loginMutation.isPending}
        >
          <ButtonText color="$textLight900">
            {loginMutation.isPending ? 'Signing in...' : 'Confirm'}
          </ButtonText>
        </Button>

        <Button
          onPress={handleGuestLogin}
          bg={isDark ? '$primary600' : '$primary500'}
          py="$1"
          px="$6"
          rounded="$lg"
          mt="$2"
        >
          <ButtonText>Continue as Guest</ButtonText>
        </Button>

        <HStack w="$full" alignItems="center" justifyContent="center" space="md" mt="$4">
          <Box flex={1} h={1} bg={isDark ? '$textDark300' : '$textLight600'} />
          <Text color={isDark ? '$textDark300' : '$textLight600'} fontWeight="$bold" fontSize="$xs">or</Text>
          <Box flex={1} h={1} bg={isDark ? '$textDark300' : '$textLight600'} />
        </HStack>

        <Button
          variant="outline"
          h={44}
          rounded="$lg"
          borderColor="$gray400"
          borderWidth={1}
          onPress={handleGoogleLogin}
          isDisabled={isGoogleLoading || googleLoginMutation.isPending}
          opacity={isGoogleLoading || googleLoginMutation.isPending ? 0.5 : 1}
        >
          <HStack space="md" alignItems="center">
            <Icon as={Mail} size="md" color={isDark ? '$textDark300' : '$textLight600'} />
            <ButtonText color={isDark ? '$textDark300' : '$textLight600'} fontWeight="$bold">
              {isGoogleLoading || googleLoginMutation.isPending ? 'Signing in...' : 'Continue with Google'}
            </ButtonText>
          </HStack>
        </Button>

        <Text
          fontSize="$xs"
          color={isDark ? '$textDark300' : '$textLight600'}
          textAlign="center"
          mt="auto"
          mb={insets.bottom + 16}
          onPress={() => navigation.navigate('Register')}
        >
          Don't have an account? Sign Up
        </Text>
      </VStack>
      </Box>
      </View>

      {/* Alt Güvenli Alan - Home Indicator arkasını beyaz boyar */}
      <View 
        style={{ 
          height: insets.bottom, 
          backgroundColor,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1,
        }} 
      />
    </View>
  );
};
