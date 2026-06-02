import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Icon,
} from '@gluestack-ui/themed';
import { Eye, EyeOff } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { useChangePassword } from '../api/hooks';
import { showCustomToast } from '@/src/components/CustomToast';
import * as yup from 'yup';
import { useTranslation } from '@/src/hooks/useTranslation';

export const ChangePasswordScreen = () => {
  const { t } = useTranslation('settings');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();
  const toast = useToast();
  const changePasswordMutation = useChangePassword();
  const insets = useSafeAreaInsets();
  const backgroundColor = '#FFFFFF';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Yup validation schema
  const validationSchema = yup.object().shape({
    currentPassword: yup
      .string()
      .required(t('changePassword.errors.currentPasswordRequired')),
    newPassword: yup
      .string()
      .required(t('changePassword.errors.newPasswordRequired'))
      .min(6, t('changePassword.errors.passwordMinLength')),
    confirmPassword: yup
      .string()
      .required(t('changePassword.errors.confirmPasswordRequired'))
      .oneOf([yup.ref('newPassword')], t('changePassword.errors.passwordsMustMatch')),
  });

  const validateField = async (field: 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) => {
    try {
      await validationSchema.validateAt(field, {
        currentPassword,
        newPassword,
        confirmPassword,
        [field]: value,
      });
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [field]: err.message }));
    }
  };

  const handleChangePassword = async () => {
    // Clear previous errors
    setErrors({});

    // Validate all fields
    try {
      await validationSchema.validate({
        currentPassword,
        newPassword,
        confirmPassword,
      }, { abortEarly: false });

      // All validations passed, proceed with API call
      try {
        const result = await changePasswordMutation.mutateAsync({
          currentPassword,
          newPassword,
        });

        // Show success toast
        showCustomToast(toast, {
          title: t('changePassword.success.title'),
          description: result.message || t('changePassword.success.description'),
          action: 'success',
          duration: 3000,
        });

        // Reset form and go back
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
        navigation.goBack();
      } catch (error: any) {
        // Show error toast
        // Backend error message format: error.response?.data?.error?.message or error.response?.data?.message
        const errorMessage =
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          t('changePassword.error.fallbackMessage');

        showCustomToast(toast, {
          title: t('changePassword.error.title'),
          description: errorMessage,
          action: 'error',
          duration: 3000,
        });
      }
    } catch (validationErrors: any) {
      // Yup validation errors
      const validationErrorsMap: { [key: string]: string } = {};
      if (validationErrors.inner) {
        validationErrors.inner.forEach((err: any) => {
          if (err.path) {
            validationErrorsMap[err.path] = err.message;
          }
        });
      }
      setErrors(validationErrorsMap);

      // Show first error in toast
      const firstError = validationErrors.inner?.[0];
      if (firstError) {
        showCustomToast(toast, {
          title: t('changePassword.validation.title'),
          description: firstError.message,
          action: 'error',
          duration: 3000,
        });
      }
    }
  };

  const isFormValid = 
    currentPassword.length > 0 && 
    newPassword.length > 0 && 
    confirmPassword.length > 0 &&
    !errors.currentPassword &&
    !errors.newPassword &&
    !errors.confirmPassword;

  return (
    <View style={{ flex: 1, backgroundColor }}>
      {/* Top safe area */}
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
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Box
          flex={1}
          bg={isDark ? '$backgroundDark950' : '#FAFAFA'}
        >
        <Header
          title={t('changePassword.title')}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        
        <VStack flex={1} space="lg" p="$4" pt="$16">
          {/* Current Password Section */}
          <VStack space="xs">
            <Text
              fontSize="$sm"
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              {t('changePassword.currentPassword')}
            </Text>
            <Box
              borderWidth={1}
              borderColor={errors.currentPassword ? '#EF4444' : '#B9B9B9'}
              borderRadius={10}
              px="$4"
              py="$1"
              mt={'$1'}
            >
              <Input borderWidth={0} bg="transparent" alignItems="center">
                <InputField
                  placeholder={t('changePassword.placeholder')}
                  placeholderTextColor={isDark ? '#666666' : '#B9B9B9'}
                  value={currentPassword}
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    if (text) {
                      validateField('currentPassword', text);
                    } else {
                      setErrors((prev) => ({ ...prev, currentPassword: undefined }));
                    }
                  }}
                  secureTextEntry={!showCurrentPassword}
                  keyboardType="default"
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$sm"
                />
                <HStack space="sm" alignItems="center" mr="$2">
                  <Pressable onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                    <Icon
                      as={showCurrentPassword ? EyeOff : Eye}
                      color={isDark ? '$textDark300' : '$textLight600'}
                      size="md"
                      alignSelf="center"
                    />
                  </Pressable>
                </HStack>
              </Input>
            </Box>
            {errors.currentPassword && (
              <Text fontSize="$xs" color="#EF4444" mt="$1">
                {errors.currentPassword}
              </Text>
            )}
          </VStack>

          <HStack justifyContent="space-between" alignItems="center">
            <Text
              fontSize="$xs"
              fontWeight="$semibold"
              color="#B9B9B9"
            >
              {t('changePassword.lastUpdated')}
            </Text>
            <Pressable
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text
                fontSize="$xs"
                fontWeight="$bold"
                color={isDark ? '#FFFFFF' : '#000000'}
                underline
              >
                {t('changePassword.forgotPassword')}
              </Text>
            </Pressable>
          </HStack>

          {/* Divider */}
          <Box
            height={1}
            bg={isDark ? '#444444' : '#D9D9D9'}
            my="$2"
          />

          {/* New Password Section */}
          <VStack space="xs">
            <Text
              fontSize="$sm"
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              {t('changePassword.newPassword')}
            </Text>
            <Box
              borderWidth={1}
              borderColor={errors.newPassword ? '#EF4444' : '#B9B9B9'}
              borderRadius={10}
              px="$4"
              py="$1"
              mt={'$1'}
            >
              <Input borderWidth={0} bg="transparent" alignItems="center">
                <InputField
                  placeholder={t('changePassword.placeholder')}
                  placeholderTextColor={isDark ? '#666666' : '#B9B9B9'}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (text) {
                      validateField('newPassword', text);
                      // Also validate confirmPassword if it has a value
                      if (confirmPassword) {
                        validateField('confirmPassword', confirmPassword);
                      }
                    } else {
                      setErrors((prev) => ({ ...prev, newPassword: undefined }));
                    }
                  }}
                  secureTextEntry={!showNewPassword}
                  keyboardType="default"
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$sm"
                />
                <HStack space="sm" alignItems="center" mr="$2">
                  <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Icon
                      as={showNewPassword ? EyeOff : Eye}
                      color={isDark ? '$textDark300' : '$textLight600'}
                      size="md"
                      alignSelf="center"
                    />
                  </Pressable>
                </HStack>
              </Input>
            </Box>
            {errors.newPassword && (
              <Text fontSize="$xs" color="#EF4444" mt="$1">
                {errors.newPassword}
              </Text>
            )}
          </VStack>

          {/* Confirm New Password Section */}
          <VStack space="xs">
            <Text
              fontSize="$sm"
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              {t('changePassword.confirmNewPassword')}
            </Text>
            <Box
              borderWidth={1}
              borderColor={errors.confirmPassword ? '#EF4444' : '#B9B9B9'}
              borderRadius={10}
              px="$4"
              py="$1"
              mt={'$1'}
            >
              <Input borderWidth={0} bg="transparent" alignItems="center">
                <InputField
                  placeholder={t('changePassword.placeholder')}
                  placeholderTextColor={isDark ? '#666666' : '#B9B9B9'}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (text) {
                      validateField('confirmPassword', text);
                    } else {
                      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  secureTextEntry={!showConfirmPassword}
                  keyboardType="default"
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$sm"
                />
                <HStack space="sm" alignItems="center" mr="$2">
                  <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Icon
                      as={showConfirmPassword ? EyeOff : Eye}
                      color={isDark ? '$textDark300' : '$textLight600'}
                      size="md"
                      alignSelf="center"
                    />
                  </Pressable>
                </HStack>
              </Input>
            </Box>
            {errors.confirmPassword && (
              <Text fontSize="$xs" color="#EF4444" mt="$1">
                {errors.confirmPassword}
              </Text>
            )}
          </VStack>

          {/* Change Password Button */}
          <Button
            bg="#E2FF46"
            borderRadius={8}
            onPress={handleChangePassword}
            opacity={isFormValid ? 1 : 0.5}
            disabled={!isFormValid || changePasswordMutation.isPending}
          >
            <ButtonText
              color="#000000"
              fontSize="$sm"
              fontWeight="$bold"
              textAlign="center"
            >
              {changePasswordMutation.isPending ? t('changePassword.changing') : t('changePassword.changePasswordButton')}
            </ButtonText>
          </Button>
        </VStack>
      </Box>
      </SafeAreaView>
      {/* Bottom safe area */}
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

export default ChangePasswordScreen;
