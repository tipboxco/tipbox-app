import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CatalogScreen } from './screens/CatalogScreen';
import BrandDetailScreen from './screens/BrandDetailScreen';
import BrandProductBookScreen from './screens/BrandProductBookScreen';
import BrandProductDetailScreen from './screens/BrandProductDetailScreen';
import SurveyScreen from './screens/SurveyScreen';
import BrandEventsDetailScreen from './screens/BrandEventsDetailScreen';
import BrandHistoryScreen from './screens/BrandHistoryScreen';
import BrandSurveyListScreen from './screens/BrandSurveyListScreen';
import BrandPostListScreen from './screens/BrandPostListScreen';
import BrandEventsScreen from './screens/BrandEventsScreen';

export type CatalogStackParamList = {
  CatalogScreen: { view?: 'products' | 'brands'; selectMode?: 'event'; returnScreen?: string } | undefined;
  ProductDetail: { productId: string };
  CategoryProducts: { categoryId: string };
  BrandDetailScreen: { brandId: string };
  BrandProductBookScreen: { brandId: string };
  BrandProductDetailScreen: { brandId: string; productId: string; productName?: string; productImage?: any };
  SurveyScreen: { brandId: string };
  BrandEventsDetailScreen: { eventId: string };
  BrandHistoryScreen: { brandId: string };
  BrandSurveyListScreen: { brandId: string };
  BrandPostListScreen: { brandId: string };
  BrandEventsScreen: { brandId: string };
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
          name="SurveyScreen"
          component={SurveyScreen}
        />
        <CatalogStack.Screen
          name="BrandEventsDetailScreen"
          component={BrandEventsDetailScreen}
        />
        <CatalogStack.Screen
          name="BrandHistoryScreen"
          component={BrandHistoryScreen}
        />
        <CatalogStack.Screen
          name="BrandSurveyListScreen"
          component={BrandSurveyListScreen}
        />
        <CatalogStack.Screen
          name="BrandPostListScreen"
          component={BrandPostListScreen}
        />
        <CatalogStack.Screen
          name="BrandEventsScreen"
          component={BrandEventsScreen}
        />
      </CatalogStack.Navigator>
    );
  };
