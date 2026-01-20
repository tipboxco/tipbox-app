import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, HStack, Icon, Image } from '@gluestack-ui/themed';
import { LogIn, Facebook } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation';
import { GoogleLoginButton } from '../components/google-login-button';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  
  // Edge-to-Edge Design: Top ve bottom insets için beyaz background
  const backgroundColor = '#FFFFFF';

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

          <GoogleLoginButton buttonText="Continue with Google" />

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
