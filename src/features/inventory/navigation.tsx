import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  InventoryScreen,
  AddProductScreen,
  PriceExperienceScreen,
  ShoppingExperienceScreen,
  ProductExperienceScreen,
} from './screens';

import { InventoryStackParamList } from './types';

const Stack = createNativeStackNavigator<InventoryStackParamList>();

export const InventoryNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName="InventoryHome"
    >
      <Stack.Screen name="InventoryHome" component={InventoryScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="PriceExperience" component={PriceExperienceScreen} />
      <Stack.Screen name="ShoppingExperience" component={ShoppingExperienceScreen} />
      <Stack.Screen name="ProductExperience" component={ProductExperienceScreen} />
    </Stack.Navigator>
  );
};