import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { SettingsNavigator } from '@/src/features/settings/navigation';
import { AuthNavigator } from '@/src/features/auth/navigation';
import { BridgeNavigator } from '@/src/features/bridge/navigation';
import { LadderNavigator } from '@/src/features/ladder/navigation';
import { ProfileNavigator } from '@/src/features/profile/navigation';
import { RootStackParamList } from './navigation.types';
import { useAuthStore } from '@/src/store/authStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const MainNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="Profile" component={ProfileNavigator} />
          <Stack.Screen name="Settings" component={SettingsNavigator} />
          <Stack.Screen name="Bridge" component={BridgeNavigator} />
          <Stack.Screen name="Ladder" component={LadderNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
};
