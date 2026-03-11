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
import { useTranslation } from '@/src/hooks/useTranslation';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen = () => {
  const { t } = useTranslation('auth');
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
    // Backend requirements: minimum 8 characters + at least one uppercase letter
    const hasMinLength = text.length >= 8;
    const hasUpperCase = /[A-Z]/.test(text);
    setIsPasswordValid(hasMinLength && hasUpperCase);
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
          title: t('toasts.registrationSuccess'),
          description: result.message || t('toasts.registrationSuccessMessage'),
          action: 'success',
          duration: 3000,
        });

        // Başarılı kayıt sonrası verify code ekranına yönlendir
        navigation.navigate('VerifyCode', { email, context: 'signUp' });
      } catch (error: any) {
        // Console'da tam error'u göster
        if (__DEV__) {
          console.error('=== REGISTER API ERROR ===');
          console.error('Error Type:', typeof error);
          console.error('Error Constructor:', error?.constructor?.name);
          console.error('Error Object:', error);
          console.error('Error Message:', error?.message);
          console.error('Error Code:', error?.code);
          console.error('Error Response:', error?.response);
          console.error('Error Response Status:', error?.response?.status);
          console.error('Error Response Status Text:', error?.response?.statusText);
          console.error('Error Response Headers:', error?.response?.headers);
          console.error('Error Response Data:', error?.response?.data);
          console.error('Error Response Data Type:', typeof error?.response?.data);

          // Try to parse error.response.data if it's a string
          if (typeof error?.response?.data === 'string') {
            try {
              const parsedData = JSON.parse(error.response.data);
              console.error('Parsed Error Response Data:', parsedData);
            } catch (parseError) {
              console.error('Failed to parse error response data as JSON');
            }
          }

          // Log all error object keys
          console.error('Error Object Keys:', Object.keys(error || {}));
          if (error?.response) {
            console.error('Error Response Keys:', Object.keys(error.response || {}));
          }

          console.error('Full Error JSON:', JSON.stringify(error, null, 2));
          console.error('========================');
        }

        // 409 Conflict - Email already exists
        if (error?.response?.status === 409) {
          showCustomToast(toast, {
            title: t('toasts.emailAlreadyRegistered'),
            description: t('toasts.emailAlreadyRegisteredMessage'),
            action: 'error',
            duration: 4000,
          });
          return;
        }

        // Extract error message from various possible locations
        let errorMessage = t('toasts.registrationError');

        if (error?.response?.data) {
          const responseData = error.response.data;

          // Handle structured error response (backend format)
          // { success: false, error: { code, message, details: [{ field, message }] } }
          if (responseData.error?.details && Array.isArray(responseData.error.details) && responseData.error.details.length > 0) {
            // Use the first validation error message
            errorMessage = responseData.error.details[0].message;
          } else if (responseData.error?.message) {
            // Use error.message
            errorMessage = responseData.error.message;
          } else if (responseData.message) {
            // Use top-level message
            errorMessage = responseData.message;
          } else if (responseData.error && typeof responseData.error === 'string') {
            // Use error string
            errorMessage = responseData.error;
          }
        } else if (error?.message) {
          // Fallback to error.message
          errorMessage = error.message;
        }

        showCustomToast(toast, {
          title: t('toasts.registrationFailed'),
          description: errorMessage,
          action: 'error',
          duration: 4000,
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
          {t('registerScreen.title')}
        </Text>

        <Text
          fontSize="$sm"
          color={isDark ? '$textDark300' : '$textLight600'}
          mb="$4"
        >
          {t('registerScreen.subtitle')}
        </Text>

        <VStack space="md">
          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>{t('registerScreen.emailLabel')}</FormControlLabelText>
            </FormControlLabel>
            <Input
              variant="outline"
              size="md"
              bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
              borderColor={isDark ? '$borderDark100' : '$borderLight100'}
              alignItems="center"
            >
              <InputField
                placeholder={t('registerScreen.emailPlaceholder')}
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
              <FormControlLabelText>{t('registerScreen.passwordLabel')}</FormControlLabelText>
            </FormControlLabel>
            <Input
              variant="outline"
              size="md"
              bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
              borderColor={isDark ? '$borderDark100' : '$borderLight100'}
              alignItems="center"
            >
              <InputField
                placeholder={t('registerScreen.passwordPlaceholder')}
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
            <Text
              fontSize="$xs"
              color={isDark ? '$textDark400' : '$textLight500'}
              mt="$1"
            >
              {t('registerScreen.passwordHint')}
            </Text>
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
            {registerMutation.isPending ? t('registerScreen.registering') : t('registerScreen.registerButton')}
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
          {t('registerScreen.signInPrompt')}
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
