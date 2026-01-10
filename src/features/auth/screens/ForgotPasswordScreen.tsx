import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, Input, InputField, FormControl, FormControlLabel, FormControlLabelText, Icon, useToast, Toast, ToastTitle, ToastDescription } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { CheckCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmail(text);
    setIsEmailValid(emailRegex.test(text));
  };

  const handleSendCode = async () => {
    if (!isEmailValid) {
      toast.show({
        placement: 'top',
        render: ({ id }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle fontSize="$sm">Invalid Email</ToastTitle>
              <ToastDescription fontSize="$sm">Please enter a valid email address.</ToastDescription>
            </Toast>
            </Box>
          );
        },
      });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Endpoint'e istek atılacak
      // const response = await forgotPasswordApi.sendCode({ email });
      console.log('Forgot Password - Sending email:', email);

      // Simüle edilmiş başarılı response
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.show({
        placement: 'top',
        render: ({ id }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle fontSize="$sm">Email Sent</ToastTitle>
              <ToastDescription fontSize="$sm">Verification code has been sent to your email address.</ToastDescription>
            </Toast>
            </Box>
          );
        },
      });

      // VerifyCode ekranına yönlendir (ForgotPassword context'i ile)
      navigation.navigate('VerifyCode', { 
        email,
        context: 'forgotPassword' 
      });
    } catch (error: any) {
      console.error('Forgot Password Error:', error);
      
      toast.show({
        placement: 'top',
        render: ({ id }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle fontSize="$sm">Error</ToastTitle>
              <ToastDescription fontSize="$sm">
                {error?.response?.data?.message || error?.message || 'An error occurred. Please try again.'}
              </ToastDescription>
            </Toast>
            </Box>
          );
        },
      });
    } finally {
      setIsLoading(false);
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
                />
              </Input>
            </FormControl>
          </VStack>

          <Button
            bg="$yellow400"
            py="$1"
            rounded="$lg"
            mt="$4"
            onPress={handleSendCode}
            opacity={isEmailValid && !isLoading ? 1 : 0.5}
            disabled={!isEmailValid || isLoading}
          >
            <ButtonText color="$textLight900">
              {isLoading ? 'Sending...' : 'Send Code'}
            </ButtonText>
          </Button>

          <Text
            fontSize="$xs"
            color={isDark ? '$textDark300' : '$textLight600'}
            textAlign="center"
            mt="auto"
            mb="$4"
            onPress={() => navigation.goBack()}
          >
            Go Back
          </Text>
        </VStack>
      </Box>
    </SafeAreaView>
  );
};

