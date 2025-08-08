import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedScreen } from './screens';

export type FeedStackParamList = {
  FeedScreen: undefined;
  PostDetail: { postId: string };
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
    </FeedStack.Navigator>
  );
};