import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CatalogScreen } from './screens/CatalogScreen';

export type CatalogStackParamList = {
  CatalogScreen: { 
    view?: 'products' | 'brands'; 
    selectMode?: 'event'; 
    returnScreen?: string;
    // Brand catalog için initial category ID (index)
    brandCategoryId?: string;
    // Product catalog için initial category/subcategory/productGroup ID (index)
    productCategoryId?: string;
    productSubCategoryId?: string;
    productGroupId?: string;
  } | undefined;
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
