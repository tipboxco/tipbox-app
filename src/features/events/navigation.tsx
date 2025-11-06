import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EventsScreen from './screens/EventsScreen';
import { EventDetailScreen, RewardsBadgesScreen, EventCreatePost } from './screens';
import { useColorMode } from '@/src/hooks/useColorMode';

export type EventsStackParamList = {
  EventsScreen: undefined;
  EventDetail: { eventId: string };
  RewardsBadges: undefined;
  EventCreatePost: undefined;
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
          name="EventDetail"
          component={EventDetailScreen}
        />
        <EventsStack.Screen
          name="RewardsBadges"
          component={RewardsBadgesScreen}
        />
        <EventsStack.Screen
          name="EventCreatePost"
          component={EventCreatePost}
        />
    </EventsStack.Navigator>
  );
};
