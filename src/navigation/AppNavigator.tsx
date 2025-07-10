import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeNavigator } from './navigators';
import { ExploreScreen } from '../features/explore/screens/ExploreScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import type { AppTabParamList } from './navigation.types';

const AppTab = createBottomTabNavigator<AppTabParamList>();

export const AppNavigator = () => {
  return (
    <AppTab.Navigator 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <AppTab.Screen 
        name="Home" 
        component={HomeNavigator}
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size - 2 }}>🏠</Text>
          ),
        }}
      />
      <AppTab.Screen 
        name="Explore" 
        component={ExploreScreen}
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size - 2 }}>🔍</Text>
          ),
        }}
      />
      <AppTab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size - 2 }}>👤</Text>
          ),
        }}
      />
      <AppTab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size - 2 }}>⚙️</Text>
          ),
        }}
      />
    </AppTab.Navigator>
  );
}; 