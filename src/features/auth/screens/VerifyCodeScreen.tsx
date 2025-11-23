import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../navigation';
import { useAuthStore } from '@/src/store/authStore';
import VerifyCodeScreen from '@/src/components/VerifyCodeScreen';

type VerifyCodeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'VerifyCode'>;
type VerifyCodeScreenRouteProp = RouteProp<AuthStackParamList, 'VerifyCode'>;

export const AuthVerifyCodeScreen = () => {
  const { setTempUser } = useAuthStore();
  const navigation = useNavigation<VerifyCodeScreenNavigationProp>();
  const route = useRoute<VerifyCodeScreenRouteProp>();
  const { email, context = 'signUp' } = route.params;

  const handleVerify = async (verificationCode: string) => {
    // TODO: Endpoint'e doğrulama isteği atılacak
    // const response = await verifyCodeApi.verify({ email, code: verificationCode });
    
    // Şimdilik mock doğrulama (123456 veya herhangi bir 6 haneli kod)
    if (verificationCode.length === 6) {
      try {
        console.log('Verification successful:', { email, context, code: verificationCode });

        if (context === 'forgotPassword') {
          // ForgotPassword akışı: ResetPassword ekranına yönlendir
          navigation.navigate('ResetPassword', { email });
        } else {
          // Sign Up akışı: SetupProfile ekranına yönlendir
          const mockUser = {
            id: '1',
            email,
            username: email.split('@')[0],
          };
          const mockAccessToken = 'mock-access-token';
          
          // Kullanıcıyı giriş yapmış olarak işaretle
          setTempUser(mockUser, mockAccessToken);
          
          // SetupProfile ekranına yönlendir
          navigation.navigate('SetupProfile');
        }
      } catch (error) {
        console.error('Verification error:', error);
        // TODO: Hata mesajını kullanıcıya göster
      }
    } else {
      console.error('Invalid verification code');
      // TODO: Hata mesajını kullanıcıya göster
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

  return (
      <VerifyCodeScreen
        headerTitle={headerTitle}
        title={title}
        description={description}
        maskedEmail={maskedEmail}
        onVerify={handleVerify}
        onBackPress={() => navigation.goBack()}
      />
  );
};
