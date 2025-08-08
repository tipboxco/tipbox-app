import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InventoryScreen } from './screens';

export type InventoryStackParamList = {
  InventoryScreen: undefined;
  ItemDetail: { itemId: string };
  AddItem: undefined;
};

const InventoryStack = createNativeStackNavigator<InventoryStackParamList>();

export const InventoryNavigator = () => {
  return (
    <InventoryStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <InventoryStack.Screen
        name="InventoryScreen"
        component={InventoryScreen}
      />
    </InventoryStack.Navigator>
  );
};
