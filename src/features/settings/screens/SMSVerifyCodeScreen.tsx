import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box,
  VStack,
  Text,
  Button,
  ButtonText,
  Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import VerifyCodeScreen from '@/src/components/VerifyCodeScreen';
import { useToast, Toast, ToastTitle, ToastDescription } from '@gluestack-ui/themed';

export const SMSVerifyCodeScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();
  const route = useRoute();
  const toast = useToast();

  const phoneNumber = (route.params as any)?.phoneNumber || '**** **** 31';
  const maskedPhone = phoneNumber.replace(/(\d{4})\s(\d{4})\s(\d{2})\s(\d{2})/, '**** **** $3 $4');

  const handleVerify = async (code: string) => {
    // TODO: API call to verify SMS code
    try {
      // const result = await verifySMSCode(code);
      console.log('Verifying SMS code:', code);
      
      toast.show({
        placement: 'top',
        render: ({ id }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Başarılı</ToastTitle>
                <ToastDescription>SMS doğrulama başarıyla tamamlandı.</ToastDescription>
              </Toast>
            </Box>
          );
        },
      });

      navigation.goBack();
      navigation.goBack(); // Go back to TwoFactorAuthScreen
    } catch (error: any) {
      toast.show({
        placement: 'top',
        render: ({ id }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                <ToastTitle>Hata</ToastTitle>
                <ToastDescription>
                  {error?.response?.data?.message || 'Kod doğrulanamadı. Lütfen tekrar deneyin.'}
                </ToastDescription>
              </Toast>
            </Box>
          );
        },
      });
    }
  };

  const handleResendCode = async () => {
    // TODO: API call to resend SMS code
    console.log('Resending SMS code');
    toast.show({
      placement: 'top',
      render: ({ id }) => {
        return (
          <Box maxWidth="90%" alignSelf="center" px="$4">
            <Toast nativeID={`toast-${id}`} action="info" variant="solid">
              <ToastTitle>Kod Gönderildi</ToastTitle>
              <ToastDescription>Yeni doğrulama kodu gönderildi.</ToastDescription>
            </Toast>
          </Box>
        );
      },
    });
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <VerifyCodeScreen
        headerTitle="SMS Verification"
        title="Onay Kodunu Gir"
        description="Enter the 6-digit code we sent to the phone number"
        maskedEmail={maskedPhone}
        onVerify={handleVerify}
        onBackPress={() => navigation.goBack()}
      />
      <Box px="$4" pb="$4" pt="$2" bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
        <Pressable onPress={handleResendCode}>
          <Text
            fontSize={11}
            fontWeight="$semibold"
            color={isDark ? '#FFFFFF' : '#000000'}
            textAlign="center"
            underline
          >
            Resend Code
          </Text>
        </Pressable>
      </Box>
    </SafeAreaView>
  );
};

export default SMSVerifyCodeScreen;

