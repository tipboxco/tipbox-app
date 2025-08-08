import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

import { FeedNavigator } from '@/src/features/feed/navigation';
import { ExploreNavigator } from '@/src/features/explore/navigation';
import { CatalogNavigator } from '@/src/features/catalog/navigation';
import { InventoryNavigator } from '@/src/features/inventory/navigation';
import { ProfileNavigator } from '@/src/features/profile/navigation';

export type RootTabParamList = {
  Feed: undefined;
  Explore: undefined;
  Catalog: undefined;
  Inventory: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const RootNavigator = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

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
            case 'Inventory':
              iconName = 'package';
              break;
            case 'Profile':
              iconName = 'user';
              break;
          }

          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: isDark ? '#C2E607' : '#BBFF4E',
        tabBarInactiveTintColor: isDark ? '#536471' : '#6D6D6D',
        tabBarStyle: {
          backgroundColor: isDark ? '#121212' : '#FFFFFF',
          borderTopColor: isDark ? '#272727' : '#E5E5E5',
        },
      })}
    >
      <Tab.Screen
        name="Feed"
        component={FeedNavigator}
        options={{ tabBarLabel: 'Feed' }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreNavigator}
        options={{ tabBarLabel: 'Explore' }}
      />
      <Tab.Screen
        name="Catalog"
        component={CatalogNavigator}
        options={{ tabBarLabel: 'Catalog' }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryNavigator}
        options={{ tabBarLabel: 'Inventory' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default RootNavigator;