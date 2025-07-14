import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExploreScreen } from './screens';

export type ExploreStackParamList = {
  ExploreScreen: undefined;
};

const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();

export const ExploreNavigator = () => {
  return (
    <ExploreStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
      initialRouteName='ExploreScreen'
    >
      <ExploreStack.Screen
        name='ExploreScreen'
        component={ExploreScreen}
        options={{
          title: 'Keşfet',
        }}
      />
    </ExploreStack.Navigator>
  );
};
