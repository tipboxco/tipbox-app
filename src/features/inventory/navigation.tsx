import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InventoryScreen, AddProductScreen } from './screens';

export type InventoryStackParamList = {
  InventoryHome: undefined;
  AddProduct: undefined;
};

const Stack = createNativeStackNavigator<InventoryStackParamList>();

export const InventoryNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="InventoryHome" component={InventoryScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
    </Stack.Navigator>
  );
};