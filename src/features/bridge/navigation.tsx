import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BridgeScreen } from './screens/BridgeScreen';
import { BridgeDetailScreen } from './screens/BridgeDetailScreen';
import { BridgeStackParamList } from './types';

const Stack = createNativeStackNavigator<BridgeStackParamList>();

export const BridgeNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="BridgeScreen" component={BridgeScreen} />
      <Stack.Screen name="BridgeDetail" component={BridgeDetailScreen} />
    </Stack.Navigator>
  );
};