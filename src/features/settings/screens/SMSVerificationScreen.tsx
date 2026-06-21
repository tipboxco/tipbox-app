import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box,
  VStack,
  Text,
  Input,
  InputField,
  Button,
  ButtonText,
  HStack,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { useToast, Toast, ToastTitle, ToastDescription } from '@gluestack-ui/themed';
import { useTranslation } from '@/src/hooks/useTranslation';

export const SMSVerificationScreen = () => {
  const { t } = useTranslation('settings');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();
  const toast = useToast();

  const [phoneNumber, setPhoneNumber] = useState('538 629 33 31');
  const [countryCode, setCountryCode] = useState('+90');

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      toast.show({
        placement: 'top',
        render: ({ id }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                <ToastTitle>{t('smsVerification.errors.missingInfoTitle')}</ToastTitle>
                <ToastDescription>{t('smsVerification.errors.missingInfoDescription')}</ToastDescription>
              </Toast>
            </Box>
          );
        },
      });
      return;
    }

    // TODO: API call to send SMS code
    try {
      // const result = await sendSMSCode(countryCode, phoneNumber);
      console.log('Sending SMS code to:', countryCode, phoneNumber);
      
      // Navigate to verify code screen
      navigation.navigate('SMSVerifyCode', {
        phoneNumber: `${countryCode} ${phoneNumber}`,
      });
    } catch (error: any) {
      toast.show({
        placement: 'top',
        render: ({ id }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                <ToastTitle>{t('smsVerification.errors.errorTitle')}</ToastTitle>
                <ToastDescription>
                  {error?.response?.data?.message || t('smsVerification.errors.fallbackMessage')}
                </ToastDescription>
              </Toast>
            </Box>
          );
        },
      });
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box
        flex={1}
        bg={isDark ? '$backgroundDark950' : '#FFFFFF'}
      >
        <Header
          title={t('smsVerification.title')}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        <VStack flex={1} px="$4" py="$6" space="lg" justifyContent="center">
          <Text
            fontSize={22}
            fontWeight="$bold"
            color={isDark ? '#FFFFFF' : '#000000'}
            mb="$2"
          >
            {t('smsVerification.heading')}
          </Text>

          <Text
            fontSize={11}
            color={isDark ? '#FFFFFF' : '#000000'}
            mb="$6"
          >
            {t('smsVerification.description')}
          </Text>

          {/* Phone Number Input */}
          <HStack space="sm" mb="$6">
            {/* Country Code */}
            <Box
              borderWidth={1}
              borderColor={isDark ? '#555555' : '#B9B9B9'}
              borderRadius={10}
              px="$3"
              py="$1"
              minWidth={80}
              alignItems="center"
              justifyContent="center"
            >
              <Input borderWidth={0} bg="transparent">
                <InputField
                  value={countryCode}
                  onChangeText={setCountryCode}
                  keyboardType="phone-pad"
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={14}
                  textAlign="center"
                />
              </Input>
            </Box>

            {/* Phone Number */}
            <Box
              borderWidth={1}
              borderColor={isDark ? '#555555' : '#B9B9B9'}
              borderRadius={10}
              px="$4"
              py="$1"
              flex={1}
            >
              <Input borderWidth={0} bg="transparent">
                <InputField
                  placeholder={t('smsVerification.phonePlaceholder')}
                  placeholderTextColor={isDark ? '#666666' : '#B9B9B9'}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    // Format phone number: remove non-digits, add spaces
                    const digits = text.replace(/[^0-9]/g, '');
                    let formatted = digits;
                    if (digits.length > 3) {
                      formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`;
                    }
                    if (digits.length > 6) {
                      formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
                    }
                    if (digits.length > 8) {
                      formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
                    }
                    setPhoneNumber(formatted);
                  }}
                  keyboardType="phone-pad"
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={14}
                />
              </Input>
            </Box>
          </HStack>
        </VStack>

        {/* Send Code Button */}
        <Box px="$4" pb="$4" pt="$2">
          <Button
            bg="#E2FF46"
            borderRadius={8}
            onPress={handleSendCode}
            disabled={!phoneNumber || phoneNumber.trim().length === 0}
            opacity={phoneNumber && phoneNumber.trim().length > 0 ? 1 : 0.5}
          >
            <ButtonText
              color="#000000"
              fontSize={14}
              fontWeight="$bold"
              textAlign="center"
            >
              {t('smsVerification.sendCodeButton')}
            </ButtonText>
          </Button>
        </Box>
      </Box>
    </SafeAreaView>
  );
};

export default SMSVerificationScreen;

