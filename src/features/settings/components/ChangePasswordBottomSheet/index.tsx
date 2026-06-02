import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputField,
  Button,
  ButtonText,
  Pressable,
  useToast,
  Toast,
  ToastTitle,
  ToastDescription,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../navigation';
import { useChangePassword } from '../../api/hooks';
import { useTranslation } from 'react-i18next';

interface ChangePasswordBottomSheetProps {
  onClose: () => void;
}

type ChangePasswordBottomSheetNavigationProp = NativeStackNavigationProp<SettingsStackParamList>;

export const ChangePasswordBottomSheet = ({ onClose }: ChangePasswordBottomSheetProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('settings');
  const navigation = useNavigation<ChangePasswordBottomSheetNavigationProp>();
  const toast = useToast();
  const changePasswordMutation = useChangePassword();


  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <VStack flex={1} px="$4" py="$4">
      {/* Header */}
      <HStack justifyContent="center" alignItems="center" mb="$4">
        <Text
          fontSize={16}
          fontWeight="$bold"
          color={isDark ? '#FFFFFF' : '#000000'}
          textAlign="center"
        >
          {t('changePassword.title')}
        </Text>
        <Box w={24} h={24} />
      </HStack>

      <HStack mb="$4">
        <Text
          fontSize={11}
          fontWeight="$semibold"
          color={isDark ? '#FFFFFF' : '#000000'}
        >
          {t('changePassword.description')}
        </Text>
      </HStack>

      {/* Current Password Section */}
      <VStack space="md" mb="$4">
        <VStack space="xs">
          <Text
            fontSize={11}
            fontWeight="$bold"
            color={isDark ? '#FFFFFF' : '#000000'}
          >
            {t('changePassword.currentPassword')}
          </Text>
          <Box
            borderWidth={1}
            borderColor={isDark ? '#555555' : '#B9B9B9'}
            borderRadius={10}
            px="$4"
            py="$1"
            mt={'$1'}
          >
            <Input borderWidth={0} bg="transparent">
              <InputField
                placeholder="****************"
                placeholderTextColor={isDark ? '#666666' : '#B9B9B9'}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={11}
              />
            </Input>
          </Box>
        </VStack>

        <HStack justifyContent="space-between" alignItems="center">
          <Text
            fontSize={9}
            fontWeight="$semibold"
            color="#B9B9B9"
          >
            {t('changePassword.lastUpdated')}
          </Text>
          <Pressable
            onPress={() => {
              onClose();
              navigation.navigate('ForgotPassword');
            }}
          >
            <Text
              fontSize={9}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
              underline
            >
              {t('changePassword.forgotPassword')}
            </Text>
          </Pressable>
        </HStack>
      </VStack>

      {/* Divider */}
      <Box
        height={1}
        bg={isDark ? '#444444' : '#D9D9D9'}
        mb="$4"
      />

      {/* New Password Section */}
      <VStack space="lg" mb="$4">
        <VStack space="xs">
          <Text
            fontSize={11}
            fontWeight="$bold"
            color={isDark ? '#FFFFFF' : '#000000'}
          >
            {t('changePassword.newPassword')}
          </Text>
          <Box
            borderWidth={1}
            borderColor={isDark ? '#555555' : '#B9B9B9'}
            borderRadius={10}
            px="$4"
            py="$1"
            mt={'$1'}
          >
            <Input borderWidth={0} bg="transparent">
              <InputField
                placeholder="****************"
                placeholderTextColor={isDark ? '#666666' : '#B9B9B9'}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={11}
              />
            </Input>
          </Box>
        </VStack>

        <VStack space="xs">
          <Text
            fontSize={11}
            fontWeight="$bold"
            color={isDark ? '#FFFFFF' : '#000000'}
          >
            {t('changePassword.confirmNewPassword')}
          </Text>
          <Box
            borderWidth={1}
            borderColor={isDark ? '#555555' : '#B9B9B9'}
            borderRadius={10}
            px="$4"
            py="$1"
            mt={'$1'}
          >
            <Input borderWidth={0} bg="transparent">
              <InputField
                placeholder="****************"
                placeholderTextColor={isDark ? '#666666' : '#B9B9B9'}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={11}
              />
            </Input>
          </Box>
        </VStack>
      </VStack>

      {/* Change Password Button */}
      <Button
        bg="#E2FF46"
        borderRadius={8}
        onPress={async () => {
          // Validasyon
          if (!currentPassword || !newPassword || !confirmPassword) {
            toast.show({
              placement: 'top',
              render: ({ id }) => {
                return (
                  <Box maxWidth="90%" alignSelf="center" px="$4">
                    <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                      <ToastTitle>{t('changePassword.errors.missingInfoTitle')}</ToastTitle>
                      <ToastDescription>{t('changePassword.errors.missingInfoDescription')}</ToastDescription>
                    </Toast>
                  </Box>
                );
              },
            });
            return;
          }

          if (newPassword !== confirmPassword) {
            toast.show({
              placement: 'top',
              render: ({ id }) => {
                return (
                  <Box maxWidth="90%" alignSelf="center" px="$4">
                    <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                      <ToastTitle>{t('changePassword.errors.passwordsDontMatch')}</ToastTitle>
                      <ToastDescription>{t('changePassword.errors.passwordsDontMatchDescription')}</ToastDescription>
                    </Toast>
                  </Box>
                );
              },
            });
            return;
          }

          if (newPassword.length < 8) {
            toast.show({
              placement: 'top',
              render: ({ id }) => {
                return (
                  <Box maxWidth="90%" alignSelf="center" px="$4">
                    <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                      <ToastTitle>{t('changePassword.errors.invalidPassword')}</ToastTitle>
                      <ToastDescription>{t('changePassword.errors.passwordMinLength8')}</ToastDescription>
                    </Toast>
                  </Box>
                );
              },
            });
            return;
          }

          try {
            const result = await changePasswordMutation.mutateAsync({
              currentPassword,
              newPassword,
            });

            // Başarılı toast göster
            toast.show({
              placement: 'top',
              render: ({ id }) => {
                return (
                  <Box maxWidth="90%" alignSelf="center" px="$4">
                    <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                      <ToastTitle>{t('changePassword.success.title')}</ToastTitle>
                      <ToastDescription>
                        {result.message || t('changePassword.success.description')}
                      </ToastDescription>
                    </Toast>
                  </Box>
                );
              },
            });

            // Form'u sıfırla ve bottom sheet'i kapat
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          onClose();
          } catch (error: any) {
            // Hata toast göster
            const errorMessage =
              error?.response?.data?.message ||
              error?.message ||
              t('changePassword.error.updateError');

            toast.show({
              placement: 'top',
              render: ({ id }) => {
                return (
                  <Box maxWidth="90%" alignSelf="center" px="$4">
                    <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                      <ToastTitle>{t('changePassword.error.title')}</ToastTitle>
                      <ToastDescription>{errorMessage}</ToastDescription>
                    </Toast>
                  </Box>
                );
              },
            });
          }
        }}
        disabled={changePasswordMutation.isPending}
        opacity={changePasswordMutation.isPending ? 0.5 : 1}
      >
        <ButtonText
          color="#000000"
          fontSize={14}
          fontWeight="$bold"
          textAlign="center"
        >
          {changePasswordMutation.isPending ? t('changePassword.changing') : t('changePassword.changePasswordButton')}
        </ButtonText>
      </Button>
    </VStack>
  );
};

export default ChangePasswordBottomSheet;
