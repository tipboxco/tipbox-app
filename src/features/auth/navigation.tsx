import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen, RegisterScreen, VerifyCodeScreen } from './screens';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyCode: {
    email: string;
  };
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
      initialRouteName='Login'
    >
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
    </AuthStack.Navigator>
  );
};
