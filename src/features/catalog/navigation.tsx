import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CatalogScreen } from './screens';

export type CatalogStackParamList = {
  CatalogScreen: undefined;
  ProductDetail: { productId: string };
  CategoryProducts: { categoryId: string };
};

const CatalogStack = createNativeStackNavigator<CatalogStackParamList>();

export const CatalogNavigator = () => {
  return (
    <CatalogStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <CatalogStack.Screen
        name="CatalogScreen"
        component={CatalogScreen}
      />
    </CatalogStack.Navigator>
  );
};
