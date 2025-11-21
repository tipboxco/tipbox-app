import React from 'react';
import { Stack } from './stack';
import { registerSharedScreens } from './shared-screens';

export const buildFeatureStack = (
  initialScreenName: string,
  initialComponent: React.ComponentType<any>
) => {
  return () => (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={initialScreenName}
    >
      <Stack.Screen name={initialScreenName} component={initialComponent} />
      {registerSharedScreens(initialScreenName)}
    </Stack.Navigator>
  );
};

