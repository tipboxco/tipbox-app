import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeNavigator } from '@/src/features/home/navigation';
import { ExploreNavigator } from '@/src/features/explore/navigation';
import { ProfileNavigator } from '@/src/features/profile/navigation';
import { SettingsNavigator } from '@/src/features/settings/navigation';
import { Home, Search, User, Settings } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { config } from '@/src/components/ui/gluestack-ui-provider/config';

const Tab = createBottomTabNavigator();

export const RootNavigator = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Renk değerlerini config'den alalım
  const activeColor = isDark ? config.tokens.colors.textDark50 : config.tokens.colors.textLight900;
  const inactiveColor = isDark ? config.tokens.colors.textDark500 : config.tokens.colors.textLight400;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '$backgroundDark50' : '$backgroundLight0',
          borderTopColor: isDark ? '$backgroundDark200' : '$backgroundLight200',
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="HomeNavigation"
        component={HomeNavigator}
        options={{
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ExploreNavigation"
        component={ExploreNavigator}
        options={{
          tabBarLabel: 'Keşfet',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileNavigation"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SettingsNavigation"
        component={SettingsNavigator}
        options={{
          tabBarLabel: 'Ayarlar',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
