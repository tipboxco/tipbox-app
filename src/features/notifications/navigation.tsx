import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NotificationsScreen from './screens/NotificationsScreen';

export type NotificationsStackParamList = {
  NotificationsScreen: undefined;
};

const NotificationsStack = createNativeStackNavigator<NotificationsStackParamList>();

export const NotificationsNavigator: React.FC = () => {
  return (
    <NotificationsStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <NotificationsStack.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
      />
    </NotificationsStack.Navigator>
  );
};

export default NotificationsNavigator;
