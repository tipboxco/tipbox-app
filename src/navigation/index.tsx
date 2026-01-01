import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { DrawerNavigator } from './DrawerNavigator';
import { navigationRef } from '@/src/providers/NotificationProvider';

const Navigation = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <DrawerNavigator />
    </NavigationContainer>
  );
};

export default Navigation;