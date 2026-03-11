import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingScreen, WelcomeScreen, LoginScreen, RegisterScreen, AuthVerifyCodeScreen, SetupProfileScreen, SelectCategoriesScreen, ForgotPasswordScreen, ResetPasswordScreen, SelectAvatarScreen } from './screens';

export type AuthStackParamList = {
  Onboarding: undefined;
  Welcome: undefined;
  Login: {
    showSuccessToast?: boolean;
  };
  Register: undefined;
  ForgotPassword: undefined;
  VerifyCode: {
    email: string;
    context?: 'signUp' | 'forgotPassword';
  };
  ResetPassword: {
    email: string;
  };
  SetupProfile: {
    avatarData?: { type: 'avatar'; id: string } | { type: 'upload'; uri: string };
    selectedCategories?: Array<{
      categoryId: string;
      subCategoryIds: string[];
    }>;
  };
  SelectAvatar: {
    selectedCategories?: Array<{
      categoryId: string;
      subCategoryIds: string[];
    }>;
  };
  SelectCategories: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

// Storage key for onboarding completion status
const ONBOARDING_COMPLETED_KEY = '@tipbox_onboarding_completed';

export const AuthNavigator = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has completed onboarding
    const checkOnboardingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        setHasCompletedOnboarding(value === 'true');
      } catch (error) {
        console.error('[AuthNavigator] Error checking onboarding status:', error);
        // Default to showing onboarding if there's an error
        setHasCompletedOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  // Show nothing while checking onboarding status
  if (hasCompletedOnboarding === null) {
    return null;
  }

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
        // FIX: Title fontunu küçült - Alert'lerde taşmasını önler
        headerTitleStyle: {
          fontSize: 12, // Default 17'den küçültüldü
          fontWeight: '600',
        },
      }}
      initialRouteName={hasCompletedOnboarding ? 'Welcome' : 'Onboarding'}
    >
      <AuthStack.Screen
        name='Onboarding'
        component={OnboardingScreen}
        options={{
          title: 'Tanıtım',
          gestureEnabled: false,
        }}
      />
      <AuthStack.Screen
        name='Welcome'
        component={WelcomeScreen}
        options={{
          title: 'Hoş Geldiniz',
        }}
      />
      <AuthStack.Screen
        name='Login'
        component={LoginScreen}
        options={{
          title: 'Giriş Yap',
        }}
      />
      <AuthStack.Screen
        name='Register'
        component={RegisterScreen}
        options={{
          title: 'Kayıt Ol',
        }}
      />
      <AuthStack.Screen
        name='ForgotPassword'
        component={ForgotPasswordScreen}
        options={{
          title: 'Şifre Sıfırlama', // FIX: "Şifremi Unuttum" → "Şifre Sıfırlama" (daha kısa)
        }}
      />
      <AuthStack.Screen
        name='VerifyCode'
        component={AuthVerifyCodeScreen}
        options={{
          title: 'Doğrulama', // FIX: "Doğrulama Kodu" → "Doğrulama" (daha kısa)
        }}
      />
      <AuthStack.Screen
        name='ResetPassword'
        component={ResetPasswordScreen}
        options={{
          title: 'Şifre Sıfırla',
        }}
      />
      <AuthStack.Screen
        name='SetupProfile'
        component={SetupProfileScreen}
        options={{
          title: 'Profil', // FIX: "Profil Düzenle" → "Profil" (daha kısa)
          gestureEnabled: false,
        }}
      />
      <AuthStack.Screen
        name='SelectAvatar'
        component={SelectAvatarScreen}
        options={{
          title: 'Avatar Seç',
          gestureEnabled: true,
        }}
      />
      <AuthStack.Screen
        name='SelectCategories'
        component={SelectCategoriesScreen}
        options={{
          title: 'İlgi Alanları',
          gestureEnabled: false,
        }}
      />
    </AuthStack.Navigator>
  );
};