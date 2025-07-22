import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from './screens';
import { ExploreScreen } from '../explore/screens';
import { ProfileScreen } from '../profile/screens';
import { SettingsScreen } from '../settings/screens';
import { Home, Search, User, Settings } from 'lucide-react-native';

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color, size }) => (
            <Search color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
