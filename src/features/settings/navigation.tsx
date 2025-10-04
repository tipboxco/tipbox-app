import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from './screens';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import NotificationSettingsScreen from './screens/NotificationSettingsScreen';
import PrivacySettingsScreen from './screens/PrivacySettingsScreen';
import SupportSettingsScreen from './screens/SupportSettingsScreen';
import { useColorMode } from '@/src/hooks/useColorMode';

export type SettingsStackParamList = {
  SettingsScreen: undefined;
  ForgotPassword: undefined;
  NotificationSettings: undefined;
  PrivacySettings: undefined;
  SupportSettings: undefined;
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
    </SettingsStack.Navigator>
  );
};