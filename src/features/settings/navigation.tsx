import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SettingsScreen,
  PaymentAndSubscriptionScreen,
  ForgotPasswordScreen,
  ChangePasswordScreen,
  TwoFactorAuthScreen,
  GoogleAuthenticatorSetupScreen,
  GoogleAuthenticatorVerifyScreen,
  SMSVerificationScreen,
  SMSVerifyCodeScreen,
  NotificationSettingsScreen,
  PrivacySettingsScreen,
  SupportSettingsScreen,
  CannyWebViewScreen,
} from './screens';
import { useColorMode } from '@/src/hooks/useColorMode';

export type SettingsStackParamList = {
  SettingsScreen: undefined;
  ForgotPassword: undefined;
  ChangePassword: undefined;
  TwoFactorAuth: undefined;
  GoogleAuthenticatorSetup: undefined;
  GoogleAuthenticatorVerify: undefined;
  SMSVerification: undefined;
  SMSVerifyCode: { phoneNumber: string };
  NotificationSettings: undefined;
  PrivacySettings: undefined;
  SupportSettings: undefined;
  PaymentAndSubscription: undefined;
  CannyWebView: undefined;
};

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsNavigator = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        headerStyle: {
          backgroundColor: isDark ? '#020617' : '#FFFFFF',
        },
        headerTintColor: isDark ? '#FFFFFF' : '#000000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
      }}
      initialRouteName='SettingsScreen'
    >
      <SettingsStack.Screen
        name='SettingsScreen'
        component={SettingsScreen}
        options={{
          title: 'Ayarlar',
        }}
      />
      <SettingsStack.Screen
        name='ForgotPassword'
        component={ForgotPasswordScreen}
        options={{
          title: 'Forgot Password',
        }}
      />
      <SettingsStack.Screen
        name='ChangePassword'
        component={ChangePasswordScreen}
        options={{
          title: 'Change Password',
        }}
      />
      <SettingsStack.Screen
        name='TwoFactorAuth'
        component={TwoFactorAuthScreen}
        options={{
          title: 'Two-Factor Authentication',
        }}
      />
      <SettingsStack.Screen
        name='GoogleAuthenticatorSetup'
        component={GoogleAuthenticatorSetupScreen}
        options={{
          title: 'Google Authenticator Setup',
        }}
      />
      <SettingsStack.Screen
        name='GoogleAuthenticatorVerify'
        component={GoogleAuthenticatorVerifyScreen}
        options={{
          title: 'Google Authenticator Verify',
        }}
      />
      <SettingsStack.Screen
        name='SMSVerification'
        component={SMSVerificationScreen}
        options={{
          title: 'SMS Verification',
        }}
      />
      <SettingsStack.Screen
        name='SMSVerifyCode'
        component={SMSVerifyCodeScreen}
        options={{
          title: 'SMS Verify Code',
        }}
      />
      <SettingsStack.Screen
        name='NotificationSettings'
        component={NotificationSettingsScreen}
        options={{
          title: 'Notification Settings',
        }}
      />
      <SettingsStack.Screen
        name='PrivacySettings'
        component={PrivacySettingsScreen}
        options={{
          title: 'Privacy Settings',
        }}
      />
      <SettingsStack.Screen
        name='SupportSettings'
        component={SupportSettingsScreen}
        options={{
          title: '1-on-1 Support Settings',
        }}
      />
      <SettingsStack.Screen
        name='PaymentAndSubscription'
        component={PaymentAndSubscriptionScreen}
        options={{
          title: 'Payment & Subscription',
        }}
      />
      <SettingsStack.Screen
        name='CannyWebView'
        component={CannyWebViewScreen}
        options={{
          title: 'Vote New Features',
        }}
      />
    </SettingsStack.Navigator>
  );
};