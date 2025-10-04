import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import NotificationsScreen from './screens/NotificationsScreen';

export type NotificationsStackParamList = {
  NotificationsScreen: undefined;
};

const NotificationsStack = createStackNavigator<NotificationsStackParamList>();

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
