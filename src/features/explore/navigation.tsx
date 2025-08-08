import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExploreScreen } from './screens';

export type ExploreStackParamList = {
  ExploreMain: undefined;
};

const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();

export const ExploreNavigator = () => {
  return (
    <ExploreStack.Navigator
      initialRouteName="ExploreMain"
      screenOptions={{
        headerShown: false,
      }}
    >
      <ExploreStack.Screen
        name="ExploreMain"
        component={ExploreScreen}
      />
    </ExploreStack.Navigator>
  );
};
