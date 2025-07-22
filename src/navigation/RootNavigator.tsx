import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from '../features/auth/navigation';
import { TabNavigator } from '../features/home/navigation';
import { useAuthStore } from '../store';
import type { RootStackParamList } from './navigation.types';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <RootStack.Screen name='Main' component={TabNavigator} />
      ) : (
        <RootStack.Screen name='Auth' component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};
