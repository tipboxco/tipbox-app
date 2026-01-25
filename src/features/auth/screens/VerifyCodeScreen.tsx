import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../navigation';
import { useAppStore } from '@/src/store/appStore';
import VerifyCodeScreen from '@/src/components/VerifyCodeScreen';
import { useVerifyEmail, useVerifyResetCode } from '../api/hooks';
import { Alert } from 'react-native';

type VerifyCodeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'VerifyCode'>;
type VerifyCodeScreenRouteProp = RouteProp<AuthStackParamList, 'VerifyCode'>;

export const AuthVerifyCodeScreen = () => {
  const navigation = useNavigation<VerifyCodeScreenNavigationProp>();
  const route = useRoute<VerifyCodeScreenRouteProp>();
  const { email, context = 'signUp' } = route.params;
  const verifyEmailMutation = useVerifyEmail();
  const verifyResetCodeMutation = useVerifyResetCode();

  const handleVerify = async (verificationCode: string) => {
    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit verification code');
      return;
    }

    if (context === 'forgotPassword') {
      // ForgotPassword akışı: Reset code doğrulama API'sini çağır
      try {
        await verifyResetCodeMutation.mutateAsync({
          mail: email,
          code: verificationCode,
        });

        // Başarılı doğrulama sonrası ResetPassword ekranına yönlendir
        navigation.navigate('ResetPassword', { email });
      } catch (error: any) {
        console.error('[AuthVerifyCodeScreen] Reset code verification error:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Invalid or expired verification code';
        Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
      }
      return;
    }

    // Sign Up akışı: Email doğrulama API'sini çağır
    try {
      await verifyEmailMutation.mutateAsync({
        email,
        code: verificationCode,
      });

      // Başarılı doğrulama sonrası SelectCategories ekranına yönlendir
      // Kategoriler seçildikten sonra SetupProfile'a gidilecek
      navigation.navigate('SelectCategories');
    } catch (error: any) {
      console.error('[AuthVerifyCodeScreen] Verification error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Invalid or expired verification code';
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(b.length));

  // Context'e göre başlık ve açıklama metinlerini belirle
  const isForgotPassword = context === 'forgotPassword';
  const headerTitle = isForgotPassword ? 'Forgot Password' : 'Sign Up';
  const title = isForgotPassword 
    ? 'Enter the confirmation code' 
    : 'Enter the confirmation code';
  const description = isForgotPassword
    ? 'To reset your password, enter the 6-digit code we sent to'
    : 'To confirm your account, enter the 6-digit code we sent to';

  const isLoading = context === 'forgotPassword' 
    ? verifyResetCodeMutation.isPending 
    : verifyEmailMutation.isPending;

  return (
      <VerifyCodeScreen
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
