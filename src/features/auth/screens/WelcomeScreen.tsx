import React from 'react';
import { StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, HStack, Icon, Image, useToast, Pressable } from '@gluestack-ui/themed';
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

  // Edge-to-Edge Design: Top ve bottom insets için theme-aware background
  const backgroundColor = isDark ? '#1F2937' : '#FFFFFF';

  const handleGoogleLogin = async () => {
    try {
      const googleResult = await googleService.login();
      await googleLoginMutation.mutateAsync(googleResult.idToken);
      showCustomToast(toast, {
        title: 'Google Login Successful',
        description: `Welcome, ${googleResult.user.name || googleResult.user.email}!`,
        action: 'success',
      });
    } catch (error: any) {
      console.error('[WelcomeScreen] ❌ Google login error:', error);
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        'An error occurred during Google login';
      showCustomToast(toast, {
        title: 'Google Login Error',
        description: errorMessage,
        action: 'error',
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor }}>
      {/* Status Bar - Translucent for banner image */}
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Ana İçerik */}
      <VStack flex={1}>
        {/* Hero Image - Tipbox Logo */}
        <Box
          flex={1}
          bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
          alignItems="center"
          justifyContent="center"
        >
          <Image
            source={require('@/src/Onboarding/onboarding0.png')}
            alt="Tipbox Logo"
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </Box>

        {/* Content */}
        <VStack
          flex={1}
          px="$10"
          space="md"
          pt="$6"
          bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
        >
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
            isDisabled={googleLoginMutation.isPending}
            opacity={googleLoginMutation.isPending ? 0.5 : 1}
          >
            <HStack space="md" alignItems="center">
              <Icon as={Mail} size="md" color={isDark ? '$textDark300' : '$textLight600'} />
              <ButtonText color={isDark ? '$textDark300' : '$textLight600'} fontWeight="$bold">
                {googleLoginMutation.isPending ? 'Signing in...' : 'Continue with Google'}
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
          <Pressable onPress={() => navigation.navigate('Login', {})}>
            <Text
              fontSize="$xs"
              color={isDark ? '$textDark50' : '$textLight900'}
              fontWeight="$bold"
            >
              Sign In
            </Text>
          </Pressable>
        </HStack>
        </VStack>
      </VStack>
    </View>
  );
};
