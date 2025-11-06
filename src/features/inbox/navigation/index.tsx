import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InboxScreen from '../screens/InboxScreen';
import MessageDetailScreen from '../screens/MessageDetail';
import SupportMessageDetailScreen from '../screens/SupportMessageDetail';

export type InboxStackParamList = {
  InboxScreen: undefined;
  MessageDetailScreen: {
    messageId: string;
    senderName: string;
    senderTitle: string;
    senderAvatar: any;
  };
  SupportMessageDetail: {
    expertName: string;
    expertTitle: string;
    expertAvatar: any;
    userName?: string;
    userTitle?: string;
    userAvatar?: any;
    requestId?: string;
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
      <Stack.Screen name="SupportMessageDetail" component={SupportMessageDetailScreen} />
    </Stack.Navigator>
  );
};
