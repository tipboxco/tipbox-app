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
  const { email } = route.params;

  const handleVerify = async (verificationCode: string) => {
    if (verificationCode === '123456') { // Default doğrulama kodu
      try {
        console.log('Verification successful');
        // Mock kullanıcı verisi
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

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <VerifyCodeScreen
        headerTitle="Forgot Password"
        title="Enter the confirmation code"
        description="To confirm your account, enter the 6-digit code we sent to"
        maskedEmail={maskedEmail}
        onVerify={handleVerify}
        onBackPress={() => navigation.goBack()}
      />
    </SafeAreaView>
  );
};
