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
  Toast,
  ToastTitle,
  ToastDescription,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { useChangePassword } from '../api/hooks';

export const ChangePasswordScreen = () => {
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

  const handleChangePassword = async () => {
    // Validasyon
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.show({
        placement: 'top',
        render: ({ id }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                <ToastTitle>Eksik Bilgi</ToastTitle>
                <ToastDescription>Lütfen tüm alanları doldurun.</ToastDescription>
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
                <ToastTitle>Şifreler Eşleşmiyor</ToastTitle>
                <ToastDescription>Yeni şifre ve onay şifresi aynı olmalıdır.</ToastDescription>
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
                <ToastTitle>Geçersiz Şifre</ToastTitle>
                <ToastDescription>Şifre en az 8 karakter olmalıdır.</ToastDescription>
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
                <ToastTitle>Şifre Değiştirildi</ToastTitle>
                <ToastDescription>
                  {result.message || 'Şifreniz başarıyla güncellendi.'}
                </ToastDescription>
              </Toast>
            </Box>
          );
        },
      });

      // Form'u sıfırla ve geri dön
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      navigation.goBack();
    } catch (error: any) {
      // Hata toast göster
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Şifre değiştirme işlemi sırasında bir hata oluştu';

      toast.show({
        placement: 'top',
        render: ({ id }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                <ToastTitle>Hata</ToastTitle>
                <ToastDescription>{errorMessage}</ToastDescription>
              </Toast>
            </Box>
          );
        },
      });
    }
  };

  const isFormValid = currentPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0;

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
          title="Change Password"
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
              Current Password
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
                  placeholder="****************"
                  placeholderTextColor="#B9B9B9"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  keyboardType="default"
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$sm"
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
              Son güncelleme: 26.03.2025
            </Text>
            <Pressable
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text
                fontSize={9}
                fontWeight="$bold"
                color={isDark ? '#FFFFFF' : '#000000'}
                underline
              >
                Forgot Password
              </Text>
            </Pressable>
          </HStack>

          {/* Divider */}
          <Box
            height={1}
            bg="#D9D9D9"
            my="$2"
          />

          {/* New Password Section */}
          <VStack space="xs">
            <Text
              fontSize="$sm"
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              New Password
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
                  placeholder="****************"
                  placeholderTextColor="#B9B9B9"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  keyboardType="default"
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$sm"
                />
              </Input>
            </Box>
          </VStack>

          {/* Confirm New Password Section */}
          <VStack space="xs">
            <Text
              fontSize="$sm"
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              Confirm New Password
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
                  placeholder="****************"
                  placeholderTextColor="#B9B9B9"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  keyboardType="default"
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$sm"
                />
              </Input>
            </Box>
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
              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
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
