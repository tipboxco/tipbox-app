import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InventoryScreen } from '../screens/InventoryScreen';
import { AddProductScreen } from '../screens/AddProductScreen';
import { ExperienceStack } from './ExperienceStack';

export type InventoryStackParamList = {
  InventoryHome: undefined;
  AddProduct: undefined;
  Experience: {
    screen: keyof ExperienceStackParamList;
    params: ExperienceStackParamList[keyof ExperienceStackParamList];
  };
};

const Stack = createNativeStackNavigator<InventoryStackParamList>();

export const InventoryStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="InventoryHome" component={InventoryScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="Experience" component={ExperienceStack} />
    </Stack.Navigator>
  );
};
