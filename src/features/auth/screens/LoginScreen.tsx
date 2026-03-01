import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Keyboard, TouchableWithoutFeedback } from 'react-native';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, HStack, Input, InputField, FormControl, FormControlLabel, FormControlLabelText, Icon, Pressable, useToast } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { CheckCircle, Mail, Eye, EyeOff, Check, Fingerprint } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation';
import { useAppStore } from '@/src/store/appStore';
import { useLogin, useGoogleLogin } from '../api/hooks';
import { googleService } from '@/src/services/GoogleService';
import { showCustomToast } from '@/src/components/CustomToast';
import { LoginCredentialsService } from '@/src/services/LoginCredentialsService';
import { BiometricService } from '@/src/services/BiometricService';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
type LoginScreenRouteProp = RouteProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const route = useRoute<LoginScreenRouteProp>();
  const toast = useToast();
  const loginMutation = useLogin();
  const googleLoginMutation = useGoogleLogin();
  const insets = useSafeAreaInsets();
  const signInTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup: unmount veya re-run öncesi setTimeout iptal et
  useEffect(() => {
    return () => {
      if (signInTimeoutRef.current) {
        clearTimeout(signInTimeoutRef.current);
        signInTimeoutRef.current = null;
      }
    };
  }, []);

  // Edge-to-Edge Design: Top ve bottom insets için beyaz background
  const backgroundColor = '#FFFFFF';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [hasBiometricPassword, setHasBiometricPassword] = useState(false);

  // Onboarding'den geldiğinde success toast göster
  useEffect(() => {
    if (route.params?.showSuccessToast) {
      showCustomToast(toast, {
        title: 'Your account has been created',
        action: 'success',
        duration: 3000,
      });
      // Param'ı temizle (bir daha gösterilmesin)
      navigation.setParams({ showSuccessToast: false });
    }
  }, [route.params?.showSuccessToast]);

  // Kaydedilmiş email'i yükle ve biometrik desteğini kontrol et
  useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        const saved = await LoginCredentialsService.getEmail();
        if (saved) {
          setSavedEmail(saved);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('[LoginScreen] ❌ Error loading saved email:', error);
      }
    };

    const checkBiometric = async () => {
      try {
        const available = await BiometricService.isAvailable();
        setIsBiometricAvailable(available);
        
        // Biometrik şifre kaydedilmiş mi kontrol et
        if (available) {
          const hasPassword = await BiometricService.isBiometricEnabled();
          setHasBiometricPassword(hasPassword);
          
          if (__DEV__) {
            console.log('[LoginScreen] 🔐 Biometric check:', {
              available,
              hasPassword,
            });
          }
        }
      } catch (error) {
        console.error('[LoginScreen] ❌ Error checking biometric:', error);
      }
    };

    loadSavedEmail();
    checkBiometric();
  }, []);

  const validateEmail = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    setEmail(lowerText);
    setIsEmailValid(EMAIL_REGEX.test(lowerText));
  }, []);

  const validatePassword = useCallback((text: string) => {
    setPassword(text);
    setIsPasswordValid(text.length >= 8);
  }, []);

  /** Optional credentials: when provided (e.g. from biometric), use these to avoid stale closure in setTimeout. */
  const handleSignIn = useCallback(async (credentials?: { email: string; password: string }) => {
    const emailToUse = credentials?.email ?? email;
    const passwordToUse = credentials?.password ?? password;
    const valid = credentials
      ? (EMAIL_REGEX.test(emailToUse) && passwordToUse.length >= 8)
      : (isEmailValid && isPasswordValid);
    if (!valid) return;

    try {
      const result = await loginMutation.mutateAsync({
        email: emailToUse,
        password: passwordToUse,
      });

      if (__DEV__) {
        console.log('[LoginScreen] ✅ Login successful:', {
          userId: result.id,
          fullName: result.fullName,
          email: result.email,
          hasToken: !!result.token,
          hasRefreshToken: !!result.refreshToken,
        });
      }

      if (rememberMe) {
        await LoginCredentialsService.saveEmail(emailToUse);
        if (isBiometricAvailable) {
          try {
            await BiometricService.savePassword(passwordToUse);
            setHasBiometricPassword(true);
          } catch (error) {
            console.error('[LoginScreen] ❌ Error saving password with biometric:', error);
          }
        }
      } else {
        await LoginCredentialsService.clearEmail();
        await BiometricService.clearPassword();
        setHasBiometricPassword(false);
      }

      showCustomToast(toast, {
        title: `Welcome ${result.fullName || result.email?.split('@')[0] || 'User'}!`,
        action: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      if (__DEV__) {
        console.error('[LoginScreen] ❌ Login error:', {
          message: error?.message,
          status: error?.response?.status,
          responseMessage: error?.response?.data?.message,
        });
      }
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'An error occurred during login';
      showCustomToast(toast, {
        title: 'Login Failed',
        description: errorMessage,
        action: 'error',
        duration: 3000,
      });
    }
  }, [email, isEmailValid, isPasswordValid, password, rememberMe, isBiometricAvailable, loginMutation, toast]);

  const handleEmailInputFocus = useCallback(() => {
    if (savedEmail && !email) {
      setShowEmailSuggestions(true);
    }
  }, [savedEmail, email]);

  const handleEmailSuggestionPress = useCallback(() => {
    if (savedEmail) {
      setEmail(savedEmail);
      validateEmail(savedEmail);
      setShowEmailSuggestions(false);
    }
  }, [savedEmail, validateEmail]);

  const handleBiometricLogin = useCallback(async (skipEmailSet = false) => {
    try {
      const savedPassword = await BiometricService.authenticateAndGetPassword();
      if (savedPassword) {
        const emailToUse = savedEmail ?? email;
        if (!skipEmailSet && savedEmail) {
          setEmail(savedEmail);
          validateEmail(savedEmail);
        }
        setPassword(savedPassword);
        validatePassword(savedPassword);
        if (signInTimeoutRef.current) clearTimeout(signInTimeoutRef.current);
        // Pass credentials explicitly so timeout uses them instead of stale state
        signInTimeoutRef.current = setTimeout(() => {
          signInTimeoutRef.current = null;
          handleSignIn({ email: emailToUse, password: savedPassword });
        }, 300);
      } else {
        showCustomToast(toast, {
          title: 'Biometric Login',
          description: 'No saved password found. Sign in with your password first and enable "Remember me".',
          action: 'error',
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error('[LoginScreen] ❌ Biometric login error:', error);
      const message = error?.message ?? 'Biometric authentication failed. Try signing in with your password.';
      showCustomToast(toast, {
        title: 'Biometric Failed',
        description: message,
        action: 'error',
        duration: 3000,
      });
    }
  }, [savedEmail, email, toast, validateEmail, validatePassword, handleSignIn]);

  const handleForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword' as never);
  }, [navigation]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      const googleResult = await googleService.login();
      await googleLoginMutation.mutateAsync(googleResult.idToken);
      showCustomToast(toast, {
        title: `Welcome ${googleResult.user.name || googleResult.user.email?.split('@')[0] || 'User'}!`,
        action: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('[LoginScreen] ❌ Google login error:', error);
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        'An error occurred during Google login';
      showCustomToast(toast, {
        title: 'Google Login Failed',
        description: errorMessage,
        action: 'error',
        duration: 3000,
      });
    }
  }, [toast, googleLoginMutation]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
          Sign In
        </Text>
        
        <Text
          fontSize="$sm"
          color={isDark ? '$textDark300' : '$textLight600'}
          mb="$4"
        >
          Enter the email where you can be contacted.{'\n'}
          No one will see this on your profile.
        </Text>

        <VStack space="md">
          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Email</FormControlLabelText>
            </FormControlLabel>
            <Input
              variant="outline"
              size="md"
              bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
              borderColor={isDark ? '$borderDark100' : '$borderLight100'}
              alignItems="center"
            >
              <InputField 
                placeholder="Your email address"
                value={email}
                onChangeText={validateEmail}
                onFocus={handleEmailInputFocus}
              />
              <Icon 
                as={CheckCircle} 
                color={isEmailValid ? "$success500" : "$gray400"} 
                size="md" 
                mr="$2"
                alignSelf="center"
              />
            </Input>
            {showEmailSuggestions && savedEmail && (
              <Pressable onPress={handleEmailSuggestionPress} mt="$1">
                <Box
                  bg={isDark ? '$backgroundDark200' : '$backgroundLight200'}
                  borderRadius="$md"
                  px="$3"
                  py="$2"
                >
                  <HStack alignItems="center" space="sm">
                    <Icon as={Mail} size="sm" color={isDark ? '$textDark300' : '$textLight600'} />
                    <Text fontSize="$sm" color={isDark ? '$textDark300' : '$textLight600'}>
                      {savedEmail}
                    </Text>
                  </HStack>
                </Box>
              </Pressable>
            )}
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Password</FormControlLabelText>
            </FormControlLabel>
            <Input
              variant="outline"
              size="md"
              bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
              borderColor={isDark ? '$borderDark100' : '$borderLight100'}
              alignItems="center"
            >
              <InputField 
                placeholder="Your password" 
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={validatePassword}
              />
              <HStack space="md" alignItems="center" mr="$2" flexShrink={0}>
                {isBiometricAvailable && savedEmail && hasBiometricPassword && (
                  <Pressable hitSlop={8} style={{ minWidth: 32 }} onPress={() => handleBiometricLogin()}>
                    <Icon
                      as={Fingerprint}
                      color={isDark ? '$primary400' : '$primary600'}
                      size="md"
                      alignSelf="center"
                    />
                  </Pressable>
                )}
                <Pressable hitSlop={8} style={{ minWidth: 32 }} onPress={() => setShowPassword(!showPassword)}>
                  <Icon
                    as={showPassword ? EyeOff : Eye}
                    color={isDark ? '$textDark300' : '$textLight600'}
                    size="md"
                    alignSelf="center"
                  />
                </Pressable>
              </HStack>
            </Input>
            <Box flexDirection="row" justifyContent="space-between" alignItems="center" mt="$1">
              <Pressable onPress={() => setRememberMe(!rememberMe)}>
                <HStack alignItems="center" space="xs">
                  <Box
                    width={18}
                    height={18}
                    borderWidth={1.5}
                    borderColor={rememberMe ? (isDark ? '$primary400' : '$primary600') : (isDark ? '$borderDark300' : '$borderLight300')}
                    borderRadius={4}
                    bg={rememberMe ? (isDark ? '$primary400' : '$primary600') : 'transparent'}
                    justifyContent="center"
                    alignItems="center"
                  >
                    {rememberMe && (
                      <Icon as={Check} size="xs" color="$white" />
                    )}
                  </Box>
                  <Text
                    fontSize="$xs"
                    color={isDark ? '$textDark300' : '$textLight600'}
                  >
                    Remember me
                  </Text>
                </HStack>
              </Pressable>
              <Text
                fontSize="$xs"
                color={isDark ? '$primary400' : '$primary600'}
                onPress={handleForgotPassword}
                style={{ textDecorationLine: 'underline' }}
              >
                Forgot Password?
              </Text>
            </Box>
          </FormControl>
        </VStack>

        <Button
          bg="$buttonPrimary"
          py="$1"
          rounded="$lg"
          mt="$4"
          onPress={() => handleSignIn()}
          opacity={isEmailValid && isPasswordValid && !loginMutation.isPending ? 1 : 0.5}
          disabled={!isEmailValid || !isPasswordValid || loginMutation.isPending}
        >
          <ButtonText color="$textLight900">
            {loginMutation.isPending ? 'Signing in...' : 'Confirm'}
          </ButtonText>
        </Button>

        <HStack w="$full" alignItems="center" justifyContent="center" space="md" mt="$4">
          <Box flex={1} h={1} bg={isDark ? '$textDark300' : '$textLight600'} />
          <Text color={isDark ? '$textDark300' : '$textLight600'} fontWeight="$bold" fontSize="$xs">or</Text>
          <Box flex={1} h={1} bg={isDark ? '$textDark300' : '$textLight600'} />
        </HStack>

        <Button
          variant="outline"
          h={44}
          rounded="$lg"
          borderColor="$gray400"
          borderWidth={1}
          onPress={handleGoogleLogin}
          isDisabled={googleLoginMutation.isPending}
          opacity={googleLoginMutation.isPending ? 0.5 : 1}
        >
          <HStack space="md" alignItems="center">
            <Icon as={Mail} size="md" color={isDark ? '$textDark300' : '$textLight600'} />
            <ButtonText color={isDark ? '$textDark300' : '$textLight600'} fontWeight="$bold">
              {googleLoginMutation.isPending ? 'Signing in...' : 'Continue with Google'}
            </ButtonText>
          </HStack>
        </Button>

        <Text
          fontSize="$xs"
          color={isDark ? '$textDark300' : '$textLight600'}
          textAlign="center"
          mt="auto"
          mb={insets.bottom + 16}
          onPress={() => navigation.navigate('Register')}
        >
          Don't have an account? Sign Up
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
    </TouchableWithoutFeedback>
  );
};
