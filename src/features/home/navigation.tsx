import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './screens/HomeScreen';
import type { HomeStackParamList } from '../../navigation/navigation.types';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

export const HomeNavigator = () => {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="HomeScreen" 
        component={HomeScreen}
        options={{ title: 'Ana Sayfa' }}
      />
    </HomeStack.Navigator>
  );
}; 