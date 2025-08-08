import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedScreen } from './screens';
import { ReviewDetail } from '@/src/components/ReviewDetail';

export type FeedStackParamList = {
  FeedScreen: undefined;
  ReviewDetail: undefined;
  CreatePost: undefined;
};

const FeedStack = createNativeStackNavigator<FeedStackParamList>();

export const FeedNavigator = () => {
  return (
    <FeedStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <FeedStack.Screen
        name="FeedScreen"
        component={FeedScreen}
      />
      <FeedStack.Screen
        name="ReviewDetail"
        component={ReviewDetail}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom'
        }}
      />
    </FeedStack.Navigator>
  );
};