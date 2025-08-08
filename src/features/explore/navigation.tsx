import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExploreScreen } from './screens';

export type ExploreStackParamList = {
  ExploreScreen: undefined;
  SearchResults: { query: string };
  CategoryDetail: { categoryId: string };
};

const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();

export const ExploreNavigator = () => {
  return (
    <ExploreStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <ExploreStack.Screen
        name="ExploreScreen"
        component={ExploreScreen}
      />
    </ExploreStack.Navigator>
  );
};