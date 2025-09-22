import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Pressable,
  Text,
  Input,
  InputField,
  Button,
  ButtonText
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import VerifyCodeScreen from '@/src/components/VerifyCodeScreen';
import SetPasswordScreen from '@/src/components/SetPasswordScreen';

type ForgotPasswordStep = 'email' | 'verify' | 'password';

export const ForgotPasswordScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>('email');
  
  // Form data - preserved across steps
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const handleSendEmail = () => {
    // Handle send email logic here
    console.log('Send email to:', email);
    // Move to verify step
    setCurrentStep('verify');
  };

  const handleVerifyCode = (code: string) => {
    console.log('Verify code:', code);
    setVerificationCode(code);
    // Move to password step
    setCurrentStep('password');
  };

  const handleSetPassword = (newPassword: string, confirmPassword: string) => {
    console.log('Set password:', { newPassword, confirmPassword });
    // Handle password reset logic here
    // Navigate back or show success
    navigation.goBack();
  };

  const handleBackPress = () => {
    switch (currentStep) {
      case 'verify':
        setCurrentStep('email');
        break;
      case 'password':
        setCurrentStep('verify');
        break;
      default:
        navigation.goBack();
    }
  };

  // Render verify code step
  if (currentStep === 'verify') {
    const maskedEmail = email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(b.length));
    
    return (
      <VerifyCodeScreen
        headerTitle="Forgot Password"
        title="Enter the confirmation code"
        description="To reset your password, enter the 6-digit code we sent to"
        maskedEmail={maskedEmail}
        onVerify={handleVerifyCode}
        onBackPress={handleBackPress}
      />
    );
  }

  // Render set password step
  if (currentStep === 'password') {
    return (
      <SetPasswordScreen
        headerTitle="Forgot Password"
        onSetPassword={handleSetPassword}
        onBackPress={handleBackPress}
      />
    );
  }

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark950' : '#FAFAFA'}
    >
      <Header
        title="Forgot Password"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <VStack flex={1} px="$4" py="$6">

        <HStack mb="$4">
          <Text
            fontSize={11}
            fontWeight="$semibold"
            color={isDark ? '#FFFFFF' : '#000000'}
          >
            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
          </Text>
        </HStack>

        {/* E-Mail Input Section */}
        <VStack space="md" mb="$8">
          <VStack space="xs">
            <Text
              fontSize={11}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              E-Mail
            </Text>
            <Box
              borderWidth={1}
              borderColor="#B9B9B9"
              borderRadius={10}
              px="$4"
              py="$1"
              mt={'$1'}
            >
              <Input borderWidth={0} bg="transparent">
                <InputField
                  placeholder="example@gmail.com"
                  placeholderTextColor="#B9B9B9"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={11}
                />
              </Input>
            </Box>
          </VStack>
        </VStack>

        {/* Send E-Mail Button */}
        <Button
          bg="#E2FF46"
          borderRadius={8}
          py="$3"
          onPress={handleSendEmail}
        >
          <ButtonText
            color="#000000"
            fontSize={14}
            fontWeight="$bold"
            textAlign="center"
          >
            Send E-Mail
          </ButtonText>
        </Button>
      </VStack>
    </Box>
  );
};

export default ForgotPasswordScreen;
