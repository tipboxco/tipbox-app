import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, Input, InputField, FormControl, FormControlLabel, FormControlLabelText, Icon, useToast, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { CheckCircle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../navigation';
import { useResetPassword } from '../api/hooks';
import { showCustomToast } from '@/src/components/CustomToast';
import { useTranslation } from '@/src/hooks/useTranslation';

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen = () => {
  const { t } = useTranslation('auth');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute<ResetPasswordScreenRouteProp>();
  const { email } = route.params;
  const toast = useToast();
  const insets = useSafeAreaInsets();

  // Edge-to-Edge Design: Top ve bottom insets için theme-aware background
  const backgroundColor = isDark ? '#1F2937' : '#FFFFFF';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);
  const resetPasswordMutation = useResetPassword();

  const validateNewPassword = (text: string) => {
    setNewPassword(text);
    setIsNewPasswordValid(text.length >= 8);
    // Confirm password'ü de kontrol et
    if (confirmPassword) {
      setIsConfirmPasswordValid(text === confirmPassword && text.length >= 8);
    }
  };

  const validateConfirmPassword = (text: string) => {
    setConfirmPassword(text);
    setIsConfirmPasswordValid(text === newPassword && text.length >= 8);
  };

  const handleResetPassword = async () => {
    if (!isNewPasswordValid || !isConfirmPasswordValid) {
      showCustomToast(toast, {
        title: t('toasts.invalidPassword'),
        description: t('toasts.invalidPasswordMessage'),
        action: 'error',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showCustomToast(toast, {
        title: t('toasts.passwordsDontMatch'),
        description: t('toasts.passwordsDontMatchMessage'),
        action: 'error',
      });
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        email,
        password: newPassword,
      });

      showCustomToast(toast, {
        title: t('toasts.passwordReset'),
        description: t('toasts.passwordResetMessage'),
        action: 'success',
      });

      // Login ekranına yönlendir
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    } catch (error: any) {
      console.error('Reset Password Error:', error);

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t('toasts.genericError');

      showCustomToast(toast, {
        title: t('toasts.error'),
        description: errorMessage,
        action: 'error',
      });
    }
  };

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
            {t('resetPasswordScreen.title')}
          </Text>

          <Text
            fontSize="$sm"
            color={isDark ? '$textDark300' : '$textLight600'}
            mb="$4"
          >
            {t('resetPasswordScreen.subtitle')}
          </Text>

          <VStack space="md">
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>{t('resetPasswordScreen.newPasswordLabel')}</FormControlLabelText>
              </FormControlLabel>
              <Input
                variant="outline"
                size="md"
                bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
                borderColor={isDark ? '$borderDark100' : '$borderLight100'}
              >
                <InputField
                  placeholder={t('resetPasswordScreen.newPasswordPlaceholder')}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={validateNewPassword}
                />
                <Icon
                  as={CheckCircle}
                  color={isNewPasswordValid ? "$success500" : "$gray400"}
                  size="md"
                  mr="$2"
                />
              </Input>
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>{t('resetPasswordScreen.confirmPasswordLabel')}</FormControlLabelText>
              </FormControlLabel>
              <Input
                variant="outline"
                size="md"
                bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
                borderColor={isDark ? '$borderDark100' : '$borderLight100'}
              >
                <InputField
                  placeholder={t('resetPasswordScreen.confirmPasswordPlaceholder')}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={validateConfirmPassword}
                />
                <Icon
                  as={CheckCircle}
                  color={isConfirmPasswordValid ? "$success500" : "$gray400"}
                  size="md"
                  mr="$2"
                />
              </Input>
            </FormControl>
          </VStack>

          <Button
            bg="$buttonPrimary"
            py="$1"
            rounded="$lg"
            mt="$4"
            onPress={handleResetPassword}
            opacity={isNewPasswordValid && isConfirmPasswordValid && !resetPasswordMutation.isPending ? 1 : 0.5}
            disabled={!isNewPasswordValid || !isConfirmPasswordValid || resetPasswordMutation.isPending}
          >
            <ButtonText color="$textLight900">
              {resetPasswordMutation.isPending ? t('resetPasswordScreen.saving') : t('resetPasswordScreen.resetButton')}
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
              {t('resetPasswordScreen.goBack')}
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

