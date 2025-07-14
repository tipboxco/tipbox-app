import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from './screens';

export type SettingsStackParamList = {
  SettingsScreen: undefined;
};

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsNavigator = () => {
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
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
