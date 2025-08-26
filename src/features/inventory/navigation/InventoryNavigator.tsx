import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InventoryStack } from './InventoryStack';
import { ExperienceStack } from './ExperienceStack';

export type InventoryNavigatorParamList = {
  InventoryStack: undefined;
  Experience: {
    screen: string;
    params: any;
  };
};

const Stack = createNativeStackNavigator<InventoryNavigatorParamList>();

export const InventoryNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="InventoryStack" component={InventoryStack} />
      <Stack.Screen name="Experience" component={ExperienceStack} />
    </Stack.Navigator>
  );
};
