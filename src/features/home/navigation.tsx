import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './screens';

export type HomeStackParamList = {
  HomeScreen: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="HomeScreen" 
        component={HomeScreen}
      />
    </Stack.Navigator>
  );
};
