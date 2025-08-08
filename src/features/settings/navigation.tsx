import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from './screens';
import { useColorMode } from '@/src/hooks/useColorMode';

export type SettingsStackParamList = {
  SettingsScreen: undefined;
};

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsNavigator = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerShown: true,
        gestureEnabled: true,
        headerStyle: {
          backgroundColor: isDark ? '#020617' : '#FFFFFF',
        },
        headerTintColor: isDark ? '#FFFFFF' : '#000000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
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
    </SettingsStack.Navigator>
  );
};