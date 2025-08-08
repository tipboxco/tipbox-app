import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './navigation.types';
import { Box } from '@gluestack-ui/themed';
import { Home, Compass, Grid, Package, User } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';

// Feature Navigators
import { FeedNavigator } from '@/src/features/feed/navigation';
import { ExploreNavigator } from '@/src/features/explore/navigation';
import { CatalogNavigator } from '@/src/features/catalog/navigation';
import { InventoryNavigator } from '@/src/features/inventory/navigation';
import { ProfileNavigator } from '@/src/features/profile/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

const getTabIcon = (routeName: string, color: string, size: number) => {
  switch (routeName) {
    case 'Feed':
      return <Home size={size} color={color} />;
    case 'Explore':
      return <Compass size={size} color={color} />;
    case 'Catalog':
      return <Grid size={size} color={color} />;
    case 'Inventory':
      return <Package size={size} color={color} />;
    case 'Profile':
      return <User size={size} color={color} />;
    default:
      return <Home size={size} color={color} />;
  }
};

export const MainNavigator = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#121212' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#333333' : '#E5E5E5',
          height: 65,
          paddingVertical: 8,
        },
        tabBarIcon: ({ color, size }) => (
          <Box alignItems="center" justifyContent="center">
            {getTabIcon(route.name, color, 24)}
          </Box>
        ),
        tabBarActiveTintColor: isDark ? '#FFFFFF' : '#000000',
        tabBarInactiveTintColor: isDark ? '#666666' : '#999999',
      })}
    >
      <Tab.Screen 
        name="Feed" 
        component={FeedNavigator}
        options={{
          tabBarLabel: 'Ana Sayfa'
        }}
      />
      <Tab.Screen 
        name="Explore" 
        component={ExploreNavigator}
        options={{
          tabBarLabel: 'Keşfet'
        }}
      />
      <Tab.Screen 
        name="Catalog" 
        component={CatalogNavigator}
        options={{
          tabBarLabel: 'Katalog'
        }}
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryNavigator}
        options={{
          tabBarLabel: 'Envanter'
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profil'
        }}
      />
    </Tab.Navigator>
  );
};
