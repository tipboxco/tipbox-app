import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PriceExperienceScreen } from '../screens/PriceExperienceScreen';
import { ShoppingExperienceScreen } from '../screens/ShoppingExperienceScreen';
import { ProductExperienceScreen } from '../screens/ProductExperienceScreen';

export type ExperienceStackParamList = {
  PriceExperience: {
    productId: string;
    productName: string;
  };
  ShoppingExperience: {
    productId: string;
    productName: string;
    priceExperience: string;
  };
  ProductExperience: {
    productId: string;
    productName: string;
    priceExperience: string;
    shoppingExperience: string;
  };
};

const Stack = createNativeStackNavigator<ExperienceStackParamList>();

export const ExperienceStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="PriceExperience" component={PriceExperienceScreen} />
      <Stack.Screen name="ShoppingExperience" component={ShoppingExperienceScreen} />
      <Stack.Screen name="ProductExperience" component={ProductExperienceScreen} />
    </Stack.Navigator>
  );
};
