import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { SettingsNavigator } from '@/src/features/settings/navigation';
import { RootStackParamList } from './navigation.types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="Settings" component={SettingsNavigator} />
    </Stack.Navigator>
  );
};
