import React, { useState } from 'react';
import { Box, Text, Button, ButtonText, VStack, Input, InputField, FormControl, FormControlLabel, FormControlLabelText, Icon } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { CheckCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation';
import { useAuthStore } from '@/src/store';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { loginAsGuest } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmail(text);
    setIsEmailValid(emailRegex.test(text));
  };

  const validatePassword = (text: string) => {
    setPassword(text);
    setIsPasswordValid(text.length >= 8);
  };

  const handleSignIn = async () => {
    if (isEmailValid && isPasswordValid) {
      console.log('Login attempt:', { email, password });
      // TODO: API entegrasyonu yapılacak
      // Şimdilik mock bir login işlemi yapıyoruz
      const mockUser = {
        id: '1',
        email,
        username: email.split('@')[0],
      };
      const mockAccessToken = 'mock-access-token';
      
      useAuthStore.getState().login(mockUser, mockAccessToken);
    }
  };

  const handleGuestLogin = async () => {
    try {
      console.log('Misafir girişi başlatılıyor...');
      await loginAsGuest();
      console.log('Misafir girişi tamamlandı!');
      
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
      console.error('Misafir girişi hatası:', error);
    }
  };

  return (
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
            >
              <InputField 
                placeholder="E-posta adresiniz"
                value={email}
                onChangeText={validateEmail}
              />
              <Icon 
                as={CheckCircle} 
                color={isEmailValid ? "$success500" : "$gray400"} 
                size="md" 
                mr="$2" 
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
            >
              <InputField 
                placeholder="Şifreniz" 
                secureTextEntry
                value={password}
                onChangeText={validatePassword}
              />
              <Icon 
                as={CheckCircle} 
                color={isPasswordValid ? "$success500" : "$gray400"} 
                size="md" 
                mr="$2" 
              />
            </Input>
          </FormControl>
        </VStack>

        <Text
          fontSize="$xs"
          color={isDark ? '$textDark300' : '$textLight600'}
          textAlign="center"
          mt="$4"
        >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </Text>

        <Button
          bg="$yellow400"
          py="$1"
          rounded="$lg"
          mt="$4"
          onPress={handleSignIn}
          opacity={isEmailValid && isPasswordValid ? 1 : 0.5}
          disabled={!isEmailValid || !isPasswordValid}
        >
          <ButtonText color="$textLight900">Confirm</ButtonText>
        </Button>

        <Button
          onPress={handleGuestLogin}
          bg={isDark ? '$primary600' : '$primary500'}
          py="$1"
          px="$6"
          rounded="$lg"
          mt="$2"
        >
          <ButtonText>Misafir Olarak Devam Et</ButtonText>
        </Button>

        <Text
          fontSize="$xs"
          color={isDark ? '$textDark300' : '$textLight600'}
          textAlign="center"
          mt="auto"
          mb="$4"
          onPress={() => navigation.navigate('Register')}
        >
          Hesabınız yok mu? Sign Up
        </Text>
      </VStack>
    </Box>
  );
};
