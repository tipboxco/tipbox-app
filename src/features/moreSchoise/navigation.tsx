import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreSchoiseScreen } from './screens';
import { useColorMode } from '@/src/hooks/useColorMode';

export type MoreSchoiseStackParamList = {
  MoreSchoiseScreen: undefined;
};

const MoreSchoiseStack = createNativeStackNavigator<MoreSchoiseStackParamList>();

export const MoreSchoiseNavigator = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <MoreSchoiseStack.Navigator
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
        headerBackTitleVisible: false,
      }}
      initialRouteName='MoreSchoiseScreen'
    >
      <MoreSchoiseStack.Screen
        name='MoreSchoiseScreen'
        component={MoreSchoiseScreen}
        options={{
          title: 'MoreSchoise',
        }}
      />
    </MoreSchoiseStack.Navigator>
  );
};
