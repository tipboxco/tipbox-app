import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, Input, InputField, FormControl, FormControlLabel, FormControlLabelText, Icon, useToast, Toast, ToastTitle, ToastDescription } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { CheckCircle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../navigation';

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute<ResetPasswordScreenRouteProp>();
  const { email } = route.params;
  const toast = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
                  <ToastTitle>Invalid Password</ToastTitle>
                  <ToastDescription>
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
                <ToastTitle>Passwords Don't Match</ToastTitle>
                <ToastDescription>Please enter the same password.</ToastDescription>
              </Toast>
            </Box>
          );
        },
      });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Endpoint'e istek atılacak
      // const response = await forgotPasswordApi.resetPassword({ email, newPassword });
      console.log('Reset Password - Setting new password:', { email, newPassword: '***' });

      // Simüle edilmiş başarılı response
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.show({
        placement: 'top',
        render: ({ id }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Password Reset</ToastTitle>
                <ToastDescription>Your password has been successfully updated. You can now sign in.</ToastDescription>
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
                <ToastTitle>Error</ToastTitle>
                <ToastDescription>
                  {error?.response?.data?.message || error?.message || 'An error occurred. Please try again.'}
                </ToastDescription>
              </Toast>
            </Box>
          );
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
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
            bg="$yellow400"
            py="$1"
            rounded="$lg"
            mt="$4"
            onPress={handleResetPassword}
            opacity={isNewPasswordValid && isConfirmPasswordValid && !isLoading ? 1 : 0.5}
            disabled={!isNewPasswordValid || !isConfirmPasswordValid || isLoading}
          >
            <ButtonText color="$textLight900">
              {isLoading ? 'Saving...' : 'Reset Password'}
            </ButtonText>
          </Button>

          <Text
            fontSize="$xs"
            color={isDark ? '$textDark300' : '$textLight600'}
            textAlign="center"
            mt="auto"
            mb="$4"
            onPress={() => navigation.goBack()}
          >
            Go Back
          </Text>
        </VStack>
      </Box>
    </SafeAreaView>
  );
};

