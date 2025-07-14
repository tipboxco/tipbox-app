import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './screens';

export type HomeStackParamList = {
  HomeScreen: undefined;
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

export const HomeNavigator = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
      initialRouteName='HomeScreen'
    >
      <HomeStack.Screen
        name='HomeScreen'
        component={HomeScreen}
        options={{
          title: 'Ana Sayfa',
        }}
      />
    </HomeStack.Navigator>
  );
};
