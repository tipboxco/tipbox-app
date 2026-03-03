import React from 'react';
import { StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, HStack, Icon, Image, useToast } from '@gluestack-ui/themed';
import { LogIn, Facebook } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation';
import { GoogleLoginButton } from '../components/google-login-button';
import { useGoogleLogin } from '../api';
import { useTranslation } from '@/src/hooks/useTranslation';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen = () => {
  const { t } = useTranslation('auth');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  // Edge-to-Edge Design: Top ve bottom insets için theme-aware background
  const backgroundColor = isDark ? '#1F2937' : '#FFFFFF';

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
            <ButtonText color="$textLight900" fontWeight="$bold">{t('welcomeScreen.signUpWithEmail')}</ButtonText>
          </Button>

          <HStack w="$full" alignItems="center" justifyContent="center" space="md">
            <Box flex={1} h={1} bg="$textLight900" />
            <Text color={isDark ? '$textDark300' : '$textLight600'} fontWeight="$bold">{t('common:labels.or')}</Text>
            <Box flex={1} h={1} bg="$textLight900" />
          </HStack>

          <GoogleLoginButton buttonText={t('welcomeScreen.continueWithGoogle')} />

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
              <ButtonText color={isDark ? '$textDark300' : '$textLight600'} fontWeight="$bold">{t('welcomeScreen.continueWithApple')}</ButtonText>
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
              <ButtonText color={isDark ? '$textDark300' : '$textLight600'} fontWeight="$bold">{t('welcomeScreen.continueWithFacebook')}</ButtonText>
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
            {t('welcomeScreen.alreadyHaveAccount')}
          </Text>
          <Text
            fontSize="$xs"
            color={isDark ? '$textDark50' : '$textLight900'}
            fontWeight="$bold"
            onPress={() => navigation.navigate('Login', {})}
          >
            {t('welcomeScreen.signIn')}
          </Text>
        </HStack>
        </VStack>
      </VStack>
    </View>
  );
};
