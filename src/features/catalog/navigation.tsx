import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CatalogScreen } from './screens/CatalogScreen';
import BrandDetailScreen from './screens/BrandDetailScreen';

export type CatalogStackParamList = {
  CatalogScreen: undefined;
  ProductDetail: { productId: string };
  CategoryProducts: { categoryId: string };
  BrandDetailScreen: { brandId: string };
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
      <CatalogStack.Screen
        name="BrandDetailScreen"
        component={BrandDetailScreen}
      />
    </CatalogStack.Navigator>
  );
};
