import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InboxScreen from '../screens/InboxScreen';
import MessageDetailScreen from '../screens/MessageDetail';

export type InboxStackParamList = {
  InboxScreen: undefined;
  MessageDetailScreen: {
    messageId: string;
    senderName: string;
    senderTitle: string;
    senderAvatar: any;
  };
};

const Stack = createNativeStackNavigator<InboxStackParamList>();

export const InboxNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="InboxScreen" component={InboxScreen} />
      <Stack.Screen name="MessageDetailScreen" component={MessageDetailScreen} />
    </Stack.Navigator>
  );
};
