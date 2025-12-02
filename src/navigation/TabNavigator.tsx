import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

import { FeedNavigator } from '@/src/features/feed/navigation';
import { ExploreNavigator } from '@/src/features/explore/navigation';
import { CatalogNavigator } from '@/src/features/catalog/navigation';
import { EventsNavigator } from '@/src/features/events/navigation';
import { NotificationsNavigator } from '@/src/features/notifications/navigation';
import { InboxNavigator } from '@/src/features/inbox/navigation';
import { buildFeatureStack } from './build-stack';

export type TabParamList = {
  FeedStack: undefined;
  ExploreStack: undefined;
  CatalogStack: undefined;
  EventsStack: undefined;
  NotificationStack: undefined;
  InboxStack: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// Her feature stack'i tek satırda oluşturuyoruz
const FeedStackNavigator = buildFeatureStack('Feed', FeedNavigator);
const ExploreStackNavigator = buildFeatureStack('Explore', ExploreNavigator);
const CatalogStackNavigator = buildFeatureStack('Catalog', CatalogNavigator);
const EventsStackNavigator = buildFeatureStack('Events', EventsNavigator);
const NotificationStackNavigator = buildFeatureStack('Notification', NotificationsNavigator);
const InboxStackNavigator = buildFeatureStack('Inbox', InboxNavigator);

export const TabNavigator = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Feather.glyphMap = 'home';

          switch (route.name) {
            case 'FeedStack':
              iconName = 'home';
              break;
            case 'ExploreStack':
              iconName = 'search';
              break;
            case 'CatalogStack':
              iconName = 'grid';
              break;
            case 'EventsStack':
              iconName = 'calendar';
              break;
            case 'NotificationStack':
              iconName = 'bell';
              break;
            case 'InboxStack':
              iconName = 'inbox';
              break;
          }

          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#758600',
        tabBarInactiveTintColor: '#000000',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FAFAFA',
          borderTopColor: '#E9E9E9',
          height: Platform.OS === 'ios' ? 45 + insets.bottom : 45 + Math.max(insets.bottom, 34),
          paddingTop: 4,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 34),
          position: 'absolute',
          bottom: Platform.OS === 'android' ? insets.bottom : 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        },
      })}
    >
      <Tab.Screen
        name="FeedStack"
        component={FeedStackNavigator}
      />
      <Tab.Screen
        name="ExploreStack"
        component={ExploreStackNavigator}
      />
      <Tab.Screen
        name="CatalogStack"
        component={CatalogStackNavigator}
      />
      <Tab.Screen
        name="EventsStack"
        component={EventsStackNavigator}
      />
      <Tab.Screen
        name="NotificationStack"
        component={NotificationStackNavigator}
      />
      <Tab.Screen
        name="InboxStack"
        component={InboxStackNavigator}
      />
    </Tab.Navigator>
  );
};
