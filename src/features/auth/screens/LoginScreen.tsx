import React, { useState, useEffect } from 'react';
import { View, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, HStack, Input, InputField, FormControl, FormControlLabel, FormControlLabelText, Icon, Pressable, useToast } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { CheckCircle, Mail, Eye, EyeOff, Check, Fingerprint } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation';
import { useAppStore } from '@/src/store/appStore';
import { useLogin } from '../api/hooks';
import { showCustomToast } from '@/src/components/CustomToast';
import { LoginCredentialsService } from '@/src/services/LoginCredentialsService';
import { BiometricService } from '@/src/services/BiometricService';
import { GoogleLoginButton } from '../components/google-login-button';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
type LoginScreenRouteProp = RouteProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const route = useRoute<LoginScreenRouteProp>();
  const toast = useToast();
  const loginMutation = useLogin();
  const insets = useSafeAreaInsets();
  
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

  const validateEmail = (text: string) => {
    const lowerText = text.toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmail(lowerText);
    setIsEmailValid(emailRegex.test(lowerText));
  };

  const validatePassword = (text: string) => {
    setPassword(text);
    setIsPasswordValid(text.length >= 8);
  };

  const handleSignIn = async () => {
    if (isEmailValid && isPasswordValid) {
      try {
        // React Query mutation kullanarak login işlemi
        const result = await loginMutation.mutateAsync({
          email,
          password,
        });
        if(result.success) {
          // Console'da response'u göster (sadece development modunda)
          if (__DEV__) {
            console.log('[LoginScreen] ✅ Login successful:', {
              userId: result.id,
              fullName: result.fullName,
              email: result.email,
              hasToken: !!result.token,
              hasRefreshToken: !!result.refreshToken,
            });
          }

          // Remember me seçiliyse email'i kaydet
          if (rememberMe) {
            await LoginCredentialsService.saveEmail(email);
            // Şifreyi biometrik ile kaydet (eğer biometrik mevcut ise)
            if (isBiometricAvailable) {
              try {
                await BiometricService.savePassword(password);
                setHasBiometricPassword(true);
              } catch (error) {
                console.error('[LoginScreen] ❌ Error saving password with biometric:', error);
              }
            }
          } else {
            // Remember me seçili değilse email'i temizle
            await LoginCredentialsService.clearEmail();
            await BiometricService.clearPassword();
            setHasBiometricPassword(false);
          }

          // Başarılı toast göster
          showCustomToast(toast, {
            title: `Welcome ${result.fullName || result.email?.split('@')[0] || 'User'}!`,
            action: 'success',
            duration: 3000,
          });

          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' as never }],
          });
        }
        else {
          showCustomToast(toast, {
            title: 'Login Failed',
            description: result.message,
            action: 'error',
            duration: 4000,
          });
        }

        // RootNavigator otomatik olarak isAuthenticated=true olduğunda
        // Auth'dan MainDrawer'a geçiş yapacak, manuel navigation gerekmez
      } catch (error: any) {
        // Console'da error'u göster (sadece development modunda)
        if (__DEV__) {
          console.error('[LoginScreen] ❌ Login error:', {
            message: error?.message,
            status: error?.response?.status,
            responseMessage: error?.response?.data?.message,
          });
        }

        // Hata toast göster - Backend'den gelen mesajı kullan veya genel mesaj
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'An error occurred during login';

        showCustomToast(toast, {
          title: 'Login Failed',
          description: errorMessage,
          action: 'error',
          duration: 4000,
        });
      }
    }
  };

  const handleEmailInputFocus = () => {
    if (savedEmail && !email) {
      setShowEmailSuggestions(true);
    }
  };

  const handleEmailSuggestionPress = async () => {
    if (savedEmail) {
      setEmail(savedEmail);
      validateEmail(savedEmail);
      setShowEmailSuggestions(false);
      
      // Email seçildiğinde, eğer biometrik şifre varsa otomatik Face ID tetikle
      if (__DEV__) {
        console.log('[LoginScreen] 📧 Email suggestion pressed:', {
          isBiometricAvailable,
          hasBiometricPassword,
          savedEmail,
        });
      }
      
      if (isBiometricAvailable && hasBiometricPassword) {
        // Kısa bir gecikme sonrası Face ID'i tetikle (kullanıcı deneyimi için)
        // skipEmailSet=true çünkü email zaten set edildi
        if (__DEV__) {
          console.log('[LoginScreen] 🔐 Triggering Face ID...');
        }
        setTimeout(async () => {
          await handleBiometricLogin(true);
        }, 300);
      } else {
        if (__DEV__) {
          console.log('[LoginScreen] ⚠️ Face ID not available or password not saved:', {
            isBiometricAvailable,
            hasBiometricPassword,
          });
        }
      }
    }
  };

  const handleBiometricLogin = async (skipEmailSet = false) => {
    try {
      const savedPassword = await BiometricService.authenticateAndGetPassword();
      if (savedPassword) {
        // Email zaten set edilmişse tekrar set etme
        if (!skipEmailSet && savedEmail) {
          setEmail(savedEmail);
          validateEmail(savedEmail);
        }
        setPassword(savedPassword);
        validatePassword(savedPassword);
        // Otomatik login yap
        setTimeout(() => {
          handleSignIn();
        }, 300);
      } else {
        // Şifre bulunamadıysa kullanıcıya bilgi ver
        console.log('[LoginScreen] ⚠️ No saved password found');
      }
    } catch (error) {
      console.error('[LoginScreen] ❌ Biometric login error:', error);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
  };



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
              <HStack space="sm" alignItems="center" mr="$2">
                {isBiometricAvailable && savedEmail && hasBiometricPassword && (
                  <Pressable onPress={() => handleBiometricLogin()}>
                    <Icon 
                      as={Fingerprint} 
                      color={isDark ? '$primary400' : '$primary600'} 
                      size="md" 
                      alignSelf="center"
                    />
                  </Pressable>
                )}
                <Pressable onPress={() => setShowPassword(!showPassword)}>
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
          onPress={handleSignIn}
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

        <GoogleLoginButton />

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
