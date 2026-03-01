import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../navigation';
import VerifyCodeScreenComponent from '@/src/components/VerifyCodeScreen';
import { useVerifyEmail, useVerifyResetCode } from '../api/hooks';
import { useToast } from '@gluestack-ui/themed';
import { showCustomToast } from '@/src/components/CustomToast';

type VerifyCodeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'VerifyCode'>;
type VerifyCodeScreenRouteProp = RouteProp<AuthStackParamList, 'VerifyCode'>;

export const AuthVerifyCodeScreen = () => {
  const navigation = useNavigation<VerifyCodeScreenNavigationProp>();
  const route = useRoute<VerifyCodeScreenRouteProp>();
  const { email, context = 'signUp' } = route.params;
  const verifyEmailMutation = useVerifyEmail();
  const verifyResetCodeMutation = useVerifyResetCode();
  const toast = useToast();

  const handleVerify = async (verificationCode: string) => {
    if (verificationCode.length !== 6) {
      showCustomToast(toast, {
        title: 'Invalid Code',
        description: 'Please enter the 6-digit verification code',
        action: 'error',
        duration: 3000,
      });
      return;
    }

    if (context === 'forgotPassword') {
      try {
        await verifyResetCodeMutation.mutateAsync({
          mail: email,
          code: verificationCode,
        });
        navigation.navigate('ResetPassword', { email });
      } catch (error: any) {
        console.error('[AuthVerifyCodeScreen] Reset code verification error:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Invalid or expired verification code';
        showCustomToast(toast, {
          title: 'Verification Failed',
          description: errorMessage,
          action: 'error',
          duration: 3000,
        });
      }
      return;
    }

    try {
      await verifyEmailMutation.mutateAsync({
        email,
        code: verificationCode,
      });
      navigation.navigate('SelectCategories');
    } catch (error: any) {
      console.error('[AuthVerifyCodeScreen] Verification error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Invalid or expired verification code';
      showCustomToast(toast, {
        title: 'Verification Failed',
        description: errorMessage,
        action: 'error',
        duration: 3000,
      });
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(b.length));
  const isForgotPassword = context === 'forgotPassword';
  const headerTitle = isForgotPassword ? 'Forgot Password' : 'Sign Up';
  const title = 'Enter the confirmation code';
  const description = isForgotPassword
    ? 'To reset your password, enter the 6-digit code we sent to'
    : 'To confirm your account, enter the 6-digit code we sent to';
  const isLoading = isForgotPassword ? verifyResetCodeMutation.isPending : verifyEmailMutation.isPending;

  return (
    <VerifyCodeScreenComponent
      headerTitle={headerTitle}
      title={title}
      description={description}
      maskedEmail={maskedEmail}
      onVerify={handleVerify}
      onBackPress={() => navigation.goBack()}
      isLoading={isLoading}
    />
  );
};
