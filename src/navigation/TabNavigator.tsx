import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

import { FeedNavigator } from '@/src/features/feed/navigation';
import { ExploreNavigator } from '@/src/features/explore/navigation';
import { CatalogNavigator } from '@/src/features/catalog/navigation';
import { InventoryNavigator } from '@/src/features/inventory';
import { ProfileNavigator } from '@/src/features/profile/navigation';

export type TabParamList = {
  Feed: undefined;
  Explore: undefined;
  Catalog: undefined;
  Events: undefined;
  Notification: undefined;
  Messages: undefined;
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
            case 'Messages':
              iconName = 'message-circle';
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
        component={FeedNavigator}
      />
      <Tab.Screen
        name="Notification"
        component={FeedNavigator}
      />
      <Tab.Screen
        name="Messages"
        component={FeedNavigator}
      />
    </Tab.Navigator>
  );
};
