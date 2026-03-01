import React, { useState, useCallback } from 'react';
import { View, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, HStack, Input, InputField, FormControl, FormControlLabel, FormControlLabelText, Icon, Pressable, useToast } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { CheckCircle, Eye, EyeOff } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation';
import { useRegister } from '../api/hooks';
import { CustomToast } from '@/src/components/CustomToast';
import { GoogleLoginButton } from '../components/google-login-button';
import { showCustomToast } from '@/src/components/CustomToast';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const toast = useToast();
  const registerMutation = useRegister();
  const insets = useSafeAreaInsets();

  // Edge-to-Edge Design: Top ve bottom insets için theme-aware background
  const backgroundColor = isDark ? '#1F2937' : '#FFFFFF';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    setEmail(lowerText);
    setIsEmailValid(EMAIL_REGEX.test(lowerText));
  }, []);

  const validatePassword = useCallback((text: string) => {
    setPassword(text);
    setIsPasswordValid(text.length >= 8);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (isEmailValid && isPasswordValid) {
      try {
        // React Query mutation kullanarak register işlemi
        // Email'den name oluştur - capitalize ve özel karakterleri temizle
        const namePart = email.split('@')[0];
        const cleanName = namePart.replace(/[._-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

        const result = await registerMutation.mutateAsync({
          email,
          password,
          name: cleanName,
        });

        // Console'da tam response'u göster
        if (__DEV__) {
          console.log('=== REGISTER API RESPONSE ===');
          console.log('Full Response:', JSON.stringify(result, null, 2));
          console.log('Response Type:', typeof result);
          console.log('Response Keys:', Object.keys(result));
          console.log('============================');
        }

        // Başarılı toast göster
        showCustomToast(toast, {
          title: 'Registration successful',
          description: result.message || 'Your account has been created successfully!',
          action: 'success',
          duration: 3000,
        });

        // Başarılı kayıt sonrası verify code ekranına yönlendir
        navigation.navigate('VerifyCode', { email, context: 'signUp' });
      } catch (error: any) {
        // Console'da tam error'u göster
        if (__DEV__) {
          console.error('=== REGISTER API ERROR ===');
          console.error('Error Object:', error);
          console.error('Error Message:', error?.message);
          console.error('Error Response:', error?.response);
          console.error('Error Response Data:', error?.response?.data);
          console.error('Error Response Status:', error?.response?.status);
          console.error('Full Error JSON:', JSON.stringify(error, null, 2));
          console.error('========================');
        }

        // 409 Conflict - Email already exists
        if (error?.response?.status === 409) {
          showCustomToast(toast, {
            title: 'Email Already Registered',
            description: 'This email address is already in use. Please sign in or use a different email.',
            action: 'error',
            duration: 4000,
          });
          return;
        }

        // Hata toast göster
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'An error occurred during registration';

        showCustomToast(toast, {
          title: 'Registration failed',
          description: errorMessage,
          action: 'error',
          duration: 3000,
        });
      }
    }
  }, [email, isEmailValid, isPasswordValid, password, registerMutation, toast, navigation]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
          </FormControl>
        </VStack>

        <Button
          bg="$buttonPrimary"
          py="$1"
          rounded="$lg"
          mt="$4"
          onPress={handleConfirm}
          opacity={isEmailValid && isPasswordValid && !registerMutation.isPending ? 1 : 0.5}
          disabled={!isEmailValid || !isPasswordValid || registerMutation.isPending}
        >
          <ButtonText color="$textLight900">
            {registerMutation.isPending ? 'Registering...' : 'Confirm'}
          </ButtonText>
        </Button>

        <Text
          fontSize="$xs"
          color={isDark ? '$textDark300' : '$textLight600'}
          textAlign="center"
          mt="auto"
          mb={insets.bottom + 16}
          onPress={() => navigation.navigate('Login')}
        >
          Already have an account? Sign In
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
    </TouchableWithoutFeedback>
  );
};
