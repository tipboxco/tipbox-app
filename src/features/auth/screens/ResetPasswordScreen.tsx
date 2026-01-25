import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, Input, InputField, FormControl, FormControlLabel, FormControlLabelText, Icon, useToast, Toast, ToastTitle, ToastDescription } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { CheckCircle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../navigation';
import { useResetPassword } from '../api/hooks';

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute<ResetPasswordScreenRouteProp>();
  const { email } = route.params;
  const toast = useToast();
  const insets = useSafeAreaInsets();
  
  // Edge-to-Edge Design: Top ve bottom insets için beyaz background
  const backgroundColor = '#FFFFFF';

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
        toast.show({
          placement: 'top',
          render: ({ id }) => {
            return (
              <Box maxWidth="90%" alignSelf="center" px="$4">
                <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                  <ToastTitle fontSize="$sm">Invalid Password</ToastTitle>
                  <ToastDescription fontSize="$sm">
                    Password must be at least 8 characters and passwords must match.
                  </ToastDescription>
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
                <ToastTitle fontSize="$sm">Passwords Don't Match</ToastTitle>
                <ToastDescription fontSize="$sm">Please enter the same password.</ToastDescription>
              </Toast>
            </Box>
          );
        },
      });
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        email,
        password: newPassword,
      });

      toast.show({
        placement: 'top',
        render: ({ id }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle fontSize="$sm">Password Reset</ToastTitle>
                <ToastDescription fontSize="$sm">Your password has been successfully updated. You can now sign in.</ToastDescription>
              </Toast>
            </Box>
          );
        },
      });

      // Login ekranına yönlendir
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    } catch (error: any) {
      console.error('Reset Password Error:', error);
      
      toast.show({
        placement: 'top',
        render: ({ id }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                <ToastTitle fontSize="$sm">Error</ToastTitle>
                <ToastDescription fontSize="$sm">
                  {error?.response?.data?.message || error?.message || 'An error occurred. Please try again.'}
                </ToastDescription>
              </Toast>
            </Box>
          );
        },
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
            Reset Password
          </Text>
          
          <Text
            fontSize="$sm"
            color={isDark ? '$textDark300' : '$textLight600'}
            mb="$4"
          >
            Set your new password.{'\n'}
            Your password must be at least 8 characters.
          </Text>

          <VStack space="md">
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>New Password</FormControlLabelText>
              </FormControlLabel>
              <Input
                variant="outline"
                size="md"
                bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
                borderColor={isDark ? '$borderDark100' : '$borderLight100'}
              >
                <InputField 
                  placeholder="New password"
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
                <FormControlLabelText>Confirm Password</FormControlLabelText>
              </FormControlLabel>
              <Input
                variant="outline"
                size="md"
                bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
                borderColor={isDark ? '$borderDark100' : '$borderLight100'}
              >
                <InputField 
                  placeholder="Confirm your password"
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
              {resetPasswordMutation.isPending ? 'Saving...' : 'Reset Password'}
            </ButtonText>
          </Button>

          <Text
            fontSize="$xs"
            color={isDark ? '$textDark300' : '$textLight600'}
            textAlign="center"
            mt="auto"
            mb={insets.bottom + 16}
            onPress={() => navigation.goBack()}
          >
            Go Back
          </Text>
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

