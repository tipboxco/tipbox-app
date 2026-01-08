import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStatus } from '@/src/hooks/useAuthStatus';
import { AuthNavigator } from '@/src/features/auth/navigation';
import { AppDrawerNavigator } from '../DrawerNavigator';
import { SettingsNavigator } from '@/src/features/settings/navigation';
import { MoreSchoiseNavigator } from '@/src/features/moreSchoise/navigation';
import { PostNavigator } from '@/src/features/post/navigation';
import { ProfileNavigator } from '@/src/features/profile/navigation';
import { WalletNavigator } from '@/src/features/wallet';
import { BookmarksNavigator } from '@/src/features/bookmarks/navigation';
import { MarketplaceNavigator } from '@/src/features/marketplace/navigation';
import MessageDetailScreen from '@/src/features/inbox/screens/MessageDetail';
import SupportMessageDetailScreen from '@/src/features/inbox/screens/SupportMessageDetail';
import type { RootStackParamList } from '../types/root.types';

// NOTE: React Native lazy loading is handled by Metro bundler's code splitting
// Metro automatically splits code based on dynamic imports and navigation patterns
// For true lazy loading, consider using dynamic imports in navigation actions

const RootStack = createNativeStackNavigator<RootStackParamList>();

/**
 * RootNavigator
 * 
 * Uygulamanın en üst seviye navigator'ı.
 * 
 * CRITICAL ARCHITECTURE FIX: Drawer → Tab hierarchy
 * 
 * Twitter/X Pattern:
 * - Drawer, Tab'lerin DIŞINDA ve ÜSTÜNDE olmalı
 * - Gesture ownership drawer'da kalır
 * - swipeEdgeWidth ile edge swipe kontrolü
 * 
 * Yapı:
 * - Auth: Authentication flow (if !isAuthenticated)
 * - App: AppDrawerNavigator → MainTabsNavigator (if isAuthenticated)
 * - Modal Screens: Settings, MoreSchoise (presentation: 'modal')
 * - Overlay Screens: Post, Profile, Wallet, Bookmarks, Marketplace, MessageDetail (presentation: 'card')
 */
export const RootNavigator = () => {
  // Memoized selector ile re-render minimize et
  // Socket, Notification, Token refresh gibi durumlarda gereksiz re-render'ları önler
  const isAuthenticated = useAuthStatus();

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          {/* Main Application - AppDrawerNavigator (Drawer → Tab hierarchy) */}
          <RootStack.Screen name="App" component={AppDrawerNavigator} />
          
          {/* Modal Screens - UI flow */}
          <RootStack.Group screenOptions={{ presentation: 'modal' }}>
            <RootStack.Screen
              name="Settings"
              component={SettingsNavigator}
              options={{
                animation: 'slide_from_right',
                gestureEnabled: true,
              }}
            />
            <RootStack.Screen
              name="MoreSchoise"
              component={MoreSchoiseNavigator}
              options={{
                animation: 'slide_from_right',
                gestureEnabled: true,
              }}
            />
          </RootStack.Group>
          
          {/* Overlay Screens - Context-free content drill-down */}
          {/* Bu ekranlar hangi tab açık olursa olsun Root'tan açılır */}
          {/* PERFORMANCE FIX: Lazy loaded navigators reduce initial bundle size */}
          <RootStack.Group screenOptions={{ presentation: 'card' }}>
            <RootStack.Screen
              name="Post"
              component={PostNavigator}
              options={{
                animation: 'slide_from_right',
                gestureEnabled: true, // Android back behavior için
                headerShown: false, // Header'ı koru
              }}
            />
            <RootStack.Screen
              name="Profile"
              component={ProfileNavigator}
              options={{
                animation: 'slide_from_right',
                gestureEnabled: true, // Android back behavior için
                headerShown: false, // Header'ı koru
              }}
            />
            <RootStack.Screen
              name="Wallet"
              component={WalletNavigator}
              options={{
                animation: 'slide_from_bottom',
                gestureEnabled: true, // Android back behavior için
                headerShown: false, // Header'ı koru
              }}
            />
            <RootStack.Screen
              name="Bookmarks"
              component={BookmarksNavigator}
              options={{
                animation: 'slide_from_right',
                gestureEnabled: true, // Android back behavior için
                headerShown: false, // Header'ı koru
              }}
            />
            <RootStack.Screen
              name="Marketplace"
              component={MarketplaceNavigator}
              options={{
                animation: 'slide_from_right',
                gestureEnabled: true, // Android back behavior için
                headerShown: false, // Header'ı koru
              }}
            />
            <RootStack.Screen
              name="MessageDetail"
              component={MessageDetailScreen}
              options={{
                animation: 'slide_from_right',
                gestureEnabled: true, // Android back behavior için
                headerShown: false, // Header'ı koru
              }}
            />
            <RootStack.Screen
              name="SupportMessageDetail"
              component={SupportMessageDetailScreen}
              options={{
                animation: 'slide_from_right',
                gestureEnabled: true, // Android back behavior için
                headerShown: false, // Header'ı koru
              }}
            />
          </RootStack.Group>
        </>
      )}
    </RootStack.Navigator>
  );
};

