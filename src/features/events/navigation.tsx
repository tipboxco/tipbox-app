import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EventsScreen from './screens/EventsScreen';
import CollectionDetailScreen from './screens/CollectionDetailScreen';
import { RewardsBadgesScreen } from './screens';
import { useColorMode } from '@/src/hooks/useColorMode';

export type EventsStackParamList = {
  EventsScreen: undefined;
  RewardsBadges: { eventId: string };
  CollectionDetailScreen: { collectionId: string };
};

const EventsStack = createNativeStackNavigator<EventsStackParamList>();

export const EventsNavigator = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <EventsStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? '#000000' : '#FAFAFA',
        },
      }}
    >
        <EventsStack.Screen
          name="EventsScreen"
          component={EventsScreen}
        />
        <EventsStack.Screen
          name="CollectionDetailScreen"
          component={CollectionDetailScreen}
        />
        <EventsStack.Screen
          name="RewardsBadges"
          component={RewardsBadgesScreen}
        />
    </EventsStack.Navigator>
  );
};
