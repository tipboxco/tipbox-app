import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen, LoginScreen, RegisterScreen, VerifyCodeScreen, SetupProfileScreen, SelectCategoriesScreen } from './screens';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  VerifyCode: {
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
        name='VerifyCode'
        component={VerifyCodeScreen}
        options={{
          title: 'Doğrulama Kodu',
        }}
      />
      <AuthStack.Screen
        name='SetupProfile'
        component={SetupProfileScreen}
        options={{
          title: 'Profil Düzenle',
        }}
      />
      <AuthStack.Screen
        name='SelectCategories'
        component={SelectCategoriesScreen}
        options={{
          title: 'İlgi Alanları',
        }}
      />
    </AuthStack.Navigator>
  );
};
