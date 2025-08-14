import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen, TrustListScreen } from './screens';
import { useColorMode } from '@/src/hooks/useColorMode';

// Profile Stack için type tanımlaması
export type ProfileStackParamList = {
  ProfileMain: undefined;
  TrustList: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileNavigator = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
        },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
      />
      <Stack.Screen
        name="TrustList"
        component={TrustListScreen}
      />
    </Stack.Navigator>
  );
};
