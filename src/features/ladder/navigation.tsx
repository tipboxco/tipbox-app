import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LadderScreen } from './screens/LadderScreen';
import { LadderDetailScreen } from './screens/LadderDetailScreen';
import { TimeLadderDetailScreen } from './screens/TimeLadderDetailScreen';
import { LadderStackParamList } from './types';

const Stack = createNativeStackNavigator<LadderStackParamList>();

export const LadderNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="LadderScreen" component={LadderScreen} />
      <Stack.Screen name="LadderDetail" component={LadderDetailScreen} />
      <Stack.Screen name="TimeLadderDetail" component={TimeLadderDetailScreen} />
    </Stack.Navigator>
  );
};
