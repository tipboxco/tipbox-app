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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import VerifyCodeScreen from '@/src/components/VerifyCodeScreen';
import SetPasswordScreen from '@/src/components/SetPasswordScreen';
import { useTranslation } from '@/src/hooks/useTranslation';

type ForgotPasswordStep = 'email' | 'verify' | 'password';

export const ForgotPasswordScreen = () => {
  const { t } = useTranslation('settings');
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
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <VerifyCodeScreen
          headerTitle={t('settings.forgotPassword.title')}
          title={t('settings.forgotPassword.verifyStep.title')}
          description={t('settings.forgotPassword.verifyStep.description')}
          maskedEmail={maskedEmail}
          onVerify={handleVerifyCode}
          onBackPress={handleBackPress}
        />
      </SafeAreaView>
    );
  }

  // Render set password step
  if (currentStep === 'password') {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <SetPasswordScreen
          headerTitle={t('settings.forgotPassword.title')}
          onSetPassword={handleSetPassword}
          onBackPress={handleBackPress}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box
        flex={1}
        bg={isDark ? '$backgroundDark950' : '#FAFAFA'}
      >
        <Header
          title={t('settings.forgotPassword.title')}
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
              {t('settings.forgotPassword.description')}
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
                {t('settings.forgotPassword.email')}
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
                    placeholder={t('settings.forgotPassword.emailPlaceholder')}
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
              {t('settings.forgotPassword.sendEmailButton')}
            </ButtonText>
          </Button>
        </VStack>
      </Box>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
