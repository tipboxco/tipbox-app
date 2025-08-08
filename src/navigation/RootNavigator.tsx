import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable } from '@gluestack-ui/themed';
import { ChevronLeft } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useAuthStore } from '@/src/store';
import { MainNavigator } from './MainNavigator';

// Feature Navigators
import { AuthNavigator } from '@/src/features/auth/navigation';
import { FeedNavigator } from '@/src/features/feed/navigation';
import { ExploreNavigator } from '@/src/features/explore/navigation';
import { CatalogNavigator } from '@/src/features/catalog/navigation';
import { InventoryNavigator } from '@/src/features/inventory/navigation';
import { ProfileNavigator } from '@/src/features/profile/navigation';
import { SettingsNavigator } from '@/src/features/settings/navigation';

import { RootStackParamList } from './navigation.types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { colorMode } = useColorMode();
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        // Auth Stack - Kullanıcı giriş yapmamışsa
        <Stack.Group screenOptions={{ gestureEnabled: false }}>
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator} 
          />
        </Stack.Group>
      ) : (
        // Main App Flow - Kullanıcı giriş yapmışsa
        <Stack.Group>
          <Stack.Screen 
            name="Main" 
            component={MainNavigator} 
          />
        </Stack.Group>
      )}

      {/* Modal Screens */}
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen 
          name="Settings" 
          component={SettingsNavigator}
          options={({ navigation }) => ({
            headerShown: true,
            headerTitle: 'Ayarlar',
            headerLeft: () => (
              <Pressable
                onPress={() => navigation.goBack()}
                px="$3"
                py="$2"
              >
                <ChevronLeft size={24} color={colorMode === 'dark' ? '#FFFFFF' : '#000000'} />
              </Pressable>
            ),
            headerStyle: {
              backgroundColor: colorMode === 'dark' ? '#121212' : '#FFFFFF',
            },
            headerTitleStyle: {
              color: colorMode === 'dark' ? '#FFFFFF' : '#000000',
              fontSize: 16,
              fontWeight: '600',
            },
            headerShadowVisible: false,
            animation: 'slide_from_right'
          })}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
};
