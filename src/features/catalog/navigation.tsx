import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CatalogScreen } from './screens/CatalogScreen';
import BrandDetailScreen from './screens/BrandDetailScreen';
import BrandProductBookScreen from './screens/BrandProductBookScreen';
import BrandProductDetailScreen from './screens/BrandProductDetailScreen';
import NewsDetailScreen from './screens/NewsDetailScreen';
import SurveyScreen from './screens/SurveyScreen';

export type CatalogStackParamList = {
  CatalogScreen: undefined;
  ProductDetail: { productId: string };
  CategoryProducts: { categoryId: string };
  BrandDetailScreen: { brandId: string };
  BrandProductBookScreen: undefined;
  BrandProductDetailScreen: { productId: string };
  NewsDetailScreen: { newsId: string };
  SurveyScreen: undefined;
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
      <CatalogStack.Screen
        name="BrandProductBookScreen"
        component={BrandProductBookScreen}
      />
        <CatalogStack.Screen
          name="BrandProductDetailScreen"
          component={BrandProductDetailScreen}
        />
        <CatalogStack.Screen
          name="NewsDetailScreen"
          component={NewsDetailScreen}
        />
        <CatalogStack.Screen
          name="SurveyScreen"
          component={SurveyScreen}
        />
      </CatalogStack.Navigator>
    );
  };
