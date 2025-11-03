import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { SettingsNavigator } from '@/src/features/settings/navigation';
import { MoreSchoiseNavigator } from '@/src/features/moreSchoise/navigation';
import { AuthNavigator } from '@/src/features/auth/navigation';
import { ProfileNavigator } from '@/src/features/profile/navigation';
import { PostNavigator } from '@/src/features/post/navigation';
import { NotificationsNavigator } from '@/src/features/notifications/navigation';
import { BookmarksNavigator } from '@/src/features/bookmarks/navigation';
import { MarketplaceNavigator } from '@/src/features/marketplace/navigation';
import { WalletNavigator } from '@/src/features/wallet';
import { RootStackParamList } from './navigation.types';
import { useAuthStore } from '@/src/store/authStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const MainNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="Profile" component={ProfileNavigator} />
          <Stack.Screen name="Settings" component={SettingsNavigator} />
          <Stack.Screen name="MoreSchoise" component={MoreSchoiseNavigator} />
          <Stack.Screen name="Post" component={PostNavigator} />
          <Stack.Screen name="Notifications" component={NotificationsNavigator} />
          <Stack.Screen name="Bookmarks" component={BookmarksNavigator} />
          <Stack.Screen name="Marketplace" component={MarketplaceNavigator} />
          <Stack.Screen name="Wallet" component={WalletNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
};
