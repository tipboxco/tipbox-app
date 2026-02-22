import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, Input, InputField, FormControl, FormControlLabel, FormControlLabelText, Icon, useToast, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { CheckCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation';
import { showCustomToast } from '@/src/components/CustomToast';
import { useForgotPassword } from '../api/hooks';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  // Edge-to-Edge Design: Top ve bottom insets için theme-aware background
  const backgroundColor = isDark ? '#1F2937' : '#FFFFFF';

  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const forgotPasswordMutation = useForgotPassword();

  const validateEmail = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    setEmail(lowerText);
    setIsEmailValid(EMAIL_REGEX.test(lowerText));
  }, []);

  const handleSendCode = useCallback(async () => {
    if (!isEmailValid) {
      showCustomToast(toast, {
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        action: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      await forgotPasswordMutation.mutateAsync(email);

      showCustomToast(toast, {
        title: 'Email sent',
        description: 'Verification code has been sent to your email address.',
        action: 'success',
        duration: 3000,
      });

      // VerifyCode ekranına yönlendir (ForgotPassword context'i ile)
      navigation.navigate('VerifyCode', {
        email,
        context: 'forgotPassword'
      });
    } catch (error: any) {
      console.error('Forgot Password Error:', error);

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'An error occurred. Please try again.';

      showCustomToast(toast, {
        title: 'Error',
        description: errorMessage,
        action: 'error',
        duration: 3000,
      });
    }
  }, [isEmailValid, email, toast, forgotPasswordMutation, navigation]);

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
            Forgot Password
          </Text>
          
          <Text
            fontSize="$sm"
            color={isDark ? '$textDark300' : '$textLight600'}
            mb="$4"
          >
            Enter your email address to reset your password.{'\n'}
            We will send you a verification code.
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
                  keyboardType="email-address"
                  autoCapitalize="none"
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
          </VStack>

          <Button
            bg="$buttonPrimary"
            py="$1"
            rounded="$lg"
            mt="$4"
            onPress={handleSendCode}
            opacity={isEmailValid && !forgotPasswordMutation.isPending ? 1 : 0.5}
            disabled={!isEmailValid || forgotPasswordMutation.isPending}
          >
            <ButtonText color="$textLight900">
              {forgotPasswordMutation.isPending ? 'Sending...' : 'Send Code'}
            </ButtonText>
          </Button>

          <Pressable
            mt="auto"
            mb={insets.bottom + 16}
            alignSelf="center"
            onPress={() => navigation.goBack()}
          >
            <Text
              fontSize="$xs"
              color={isDark ? '$textDark300' : '$textLight600'}
              textAlign="center"
            >
              Go Back
            </Text>
          </Pressable>
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

