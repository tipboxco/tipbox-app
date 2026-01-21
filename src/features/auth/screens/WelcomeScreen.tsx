import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, HStack, Icon, Image, useToast } from '@gluestack-ui/themed';
import { showCustomToast } from '@/src/components/CustomToast';
import { LogIn, Mail, Facebook } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation';
import { googleService } from '@/src/services/GoogleService';
import { useGoogleLogin } from '../api/hooks';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const googleLoginMutation = useGoogleLogin();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Edge-to-Edge Design: Top ve bottom insets için beyaz background
  const backgroundColor = '#FFFFFF';

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);

      // Google OAuth ile giriş yap
      const googleResult = await googleService.login();

      // Backend'e ID token gönder
      await googleLoginMutation.mutateAsync(googleResult.idToken);

      // Başarılı toast göster
      showCustomToast(toast, {
        title: 'Google Login Successful',
        description: `Welcome, ${googleResult.user.name || googleResult.user.email}!`,
        action: 'success',
      });

      // RootNavigator otomatik olarak isAuthenticated=true olduğunda
      // Auth'dan MainDrawer'a geçiş yapacak, manuel navigation gerekmez
    } catch (error: any) {
      console.error('[WelcomeScreen] ❌ Google login error:', error);

      // Hata toast göster
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        'An error occurred during Google login';

      showCustomToast(toast, {
        title: 'Google Login Error',
        description: errorMessage,
        action: 'error',
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
        >
      {/* Hero Image - Tipbox Logo */}
      <Box h={350} bg={isDark ? '$backgroundDark50' : '$backgroundLight0'} alignItems="center" justifyContent="center">
        <Image
          source={require('@/assets/tipbox-square-black.png')}
          alt="Tipbox Logo"
          width={200}
          height={200}
          resizeMode="contain"
        />
      </Box>

      {/* Content */}
      <VStack flex={1} px="$10" space="md" mt="$8">
        <VStack space="md" alignItems="center">
          <Button
            bg="$buttonPrimary"
            h={44}
            rounded="$lg"
            w={315}
            onPress={() => navigation.navigate('Register')}
          >
            <ButtonText color="$textLight900" fontWeight="$bold">Sign up with Email</ButtonText>
          </Button>

          <HStack w="$full" alignItems="center" justifyContent="center" space="md">
            <Box flex={1} h={1} bg="$textLight900" />
            <Text color={isDark ? '$textDark300' : '$textLight600'} fontWeight="$bold">or</Text>
            <Box flex={1} h={1} bg="$textLight900" />
          </HStack>

          <Button
            variant="outline"
            h={44}
            rounded="$lg"
            w={315}
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

          <Button
            variant="outline"
            h={44}
            rounded="$lg"
            w={315}
            borderColor="$gray400"
            isDisabled
            borderWidth={1}
          >
            <HStack space="md" alignItems="center">
              <Icon as={LogIn} size="md" color={isDark ? '$textDark300' : '$textLight600'} />
              <ButtonText color={isDark ? '$textDark300' : '$textLight600'} fontWeight="$bold">Continue with Apple</ButtonText>
            </HStack>
          </Button>

          <Button
            variant="outline"
            h={44}
            rounded="$lg"
            w={315}
            borderColor="$gray400"
            isDisabled
            borderWidth={1}
          >
            <HStack space="md" alignItems="center">
              <Icon as={Facebook} size="md" color={isDark ? '$textDark300' : '$textLight600'} />
              <ButtonText color={isDark ? '$textDark300' : '$textLight600'} fontWeight="$bold">Continue with Facebook</ButtonText>
            </HStack>
          </Button>
        </VStack>

        <HStack 
          mt="auto" 
          mb={insets.bottom + 16} 
          space="sm" 
          alignItems="center"
          justifyContent="center"
        >
          <Text
            fontSize="$xs"
            color={isDark ? '$textDark300' : '$textLight600'}
          >
            Already have an account?
          </Text>
          <Text
            fontSize="$xs"
            color={isDark ? '$textDark50' : '$textLight900'}
            fontWeight="$bold"
            onPress={() => navigation.navigate('Login')}
          >
            Sign In
          </Text>
        </HStack>
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
