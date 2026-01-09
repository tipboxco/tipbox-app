import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, Input, InputField, FormControl, FormControlLabel, FormControlLabelText, Icon, useToast, Toast, ToastTitle, ToastDescription } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { CheckCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation';
import { useRegister } from '../api/hooks';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const toast = useToast();
  const registerMutation = useRegister();

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

  const handleConfirm = async () => {
    if (isEmailValid && isPasswordValid) {
      try {
        // React Query mutation kullanarak register işlemi
        const result = await registerMutation.mutateAsync({
          email,
          password,
          name: email.split('@')[0], // Geçici olarak email'den name oluştur
        });

        // Console'da tam response'u göster
        console.log('=== REGISTER API RESPONSE ===');
        console.log('Full Response:', JSON.stringify(result, null, 2));
        console.log('Response Type:', typeof result);
        console.log('Response Keys:', Object.keys(result));
        console.log('============================');

        // Başarılı toast göster
        toast.show({
          placement: 'top',
          render: ({ id }) => {
            return (
              <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Kayıt Başarılı</ToastTitle>
                <ToastDescription>
                  {result.message || 'Kayıt işlemi başarıyla tamamlandı!'}
                </ToastDescription>
              </Toast>
              </Box>
            );
          },
        });

        // Başarılı kayıt sonrası verify code ekranına yönlendir
        navigation.navigate('VerifyCode', { email, context: 'signUp' });
      } catch (error: any) {
        // Console'da tam error'u göster
        console.error('=== REGISTER API ERROR ===');
        console.error('Error Object:', error);
        console.error('Error Message:', error?.message);
        console.error('Error Response:', error?.response);
        console.error('Error Response Data:', error?.response?.data);
        console.error('Error Response Status:', error?.response?.status);
        console.error('Full Error JSON:', JSON.stringify(error, null, 2));
        console.error('========================');

        // Hata toast göster
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'Kayıt işlemi sırasında bir hata oluştu';

        toast.show({
          placement: 'top',
          render: ({ id }) => {
            return (
              <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                <ToastTitle>Kayıt Hatası</ToastTitle>
                <ToastDescription>{errorMessage}</ToastDescription>
              </Toast>
              </Box>
            );
          },
        });
      }
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
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
          Sign Up
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
                placeholder="Your email address"
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
                placeholder="Your password" 
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
          onPress={handleConfirm}
          opacity={isEmailValid && isPasswordValid && !registerMutation.isPending ? 1 : 0.5}
          disabled={!isEmailValid || !isPasswordValid || registerMutation.isPending}
        >
          <ButtonText color="$textLight900">
            {registerMutation.isPending ? 'Kaydediliyor...' : 'Confirm'}
          </ButtonText>
        </Button>

        <Text
          fontSize="$xs"
          color={isDark ? '$textDark300' : '$textLight600'}
          textAlign="center"
          mt="auto"
          mb="$4"
          onPress={() => navigation.navigate('Login')}
        >
          Zaten bir hesabınız var mı? Sign In
        </Text>
      </VStack>
      </Box>
    </SafeAreaView>
  );
};
