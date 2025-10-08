import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

import { FeedNavigator } from '@/src/features/feed/navigation';
import { ExploreNavigator } from '@/src/features/explore/navigation';
import { CatalogNavigator } from '@/src/features/catalog/navigation';
import { EventsNavigator } from '@/src/features/events/navigation';
import { NotificationsNavigator } from '@/src/features/notifications/navigation';
import { InboxNavigator } from '@/src/features/inbox/navigation';

export type TabParamList = {
  Feed: undefined;
  Explore: undefined;
  Catalog: undefined;
  Events: undefined;
  Notification: undefined;
  Inbox: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Feather.glyphMap = 'home';

          switch (route.name) {
            case 'Feed':
              iconName = 'home';
              break;
            case 'Explore':
              iconName = 'search';
              break;
            case 'Catalog':
              iconName = 'grid';
              break;
            case 'Events':
              iconName = 'calendar';
              break;
            case 'Notification':
              iconName = 'bell';
              break;
            case 'Inbox':
              iconName = 'inbox';
              break;
          }

          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#829905',
        tabBarInactiveTintColor: '#000000',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5E5',
          height: 45,
          paddingTop: 4,
          paddingBottom: 34,
        },
      })}
    >
      <Tab.Screen
        name="Feed"
        component={FeedNavigator}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreNavigator}
      />
      <Tab.Screen
        name="Catalog"
        component={CatalogNavigator}
      />
      <Tab.Screen
        name="Events"
        component={EventsNavigator}
      />
      <Tab.Screen
        name="Notification"
        component={NotificationsNavigator}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxNavigator}
      />
    </Tab.Navigator>
  );
};
