import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen, LoginScreen, RegisterScreen, AuthVerifyCodeScreen, SetupProfileScreen, SelectCategoriesScreen, ForgotPasswordScreen, ResetPasswordScreen } from './screens';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyCode: {
    email: string;
    context?: 'signUp' | 'forgotPassword';
  };
  ResetPassword: {
    email: string;
  };
  SetupProfile: undefined;
  SelectCategories: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
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
      initialRouteName='Welcome'
    >
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