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
 * CRITICAL ARCHITECTURE: Flat Navigation Pattern (Twitter/X, Instagram)
 * 
 * Twitter/X Pattern:
 * - Drawer, Tab'lerin DIŞINDA ve ÜSTÜNDE olmalı
 * - Gesture ownership drawer'da kalır
 * - swipeEdgeWidth ile edge swipe kontrolü
 * - Detay ekranları (Profile, Post, vb.) RootStack seviyesinde (Z-Index yönetimi)
 * 
 * Yapı:
 * - Auth: Authentication flow (if !isAuthenticated)
 * - App: AppDrawerNavigator → MainTabsNavigator (if isAuthenticated)
 * - DetailsGroup: Post, Profile, Wallet, Bookmarks, Marketplace, MessageDetail (presentation: 'card')
 * - ModalsGroup: Settings, MoreSchoise (presentation: 'modal')
 * 
 * PERFORMANCE BENEFITS:
 * - Detay ekranları RootStack'te olduğu için Tab Bar ve Drawer otomatik arkada kalır
 * - Memory efficiency: Drawer sadece MainTabs'ı sarmalar, detay ekranlarında freeze olur
 * - Z-Index yönetimi: Detay ekranları açıldığında Tab Bar gizlenir (otomatik)
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
          
          {/* DetailsGroup - Context-free content drill-down screens */}
          {/* Bu ekranlar hangi tab açık olursa olsun Root'tan açılır */}
          {/* CRITICAL: Native Stack kullanıldığı için swipe back gesture native hissiyat verir */}
          {/* PERFORMANCE: Lazy loaded navigators reduce initial bundle size */}
          <RootStack.Group 
            screenOptions={{ 
              presentation: 'card',
              animation: 'slide_from_right',
              gestureEnabled: true, // Native swipe back gesture
              headerShown: false,
            }}
          >
            <RootStack.Screen
              name="Post"
              component={PostNavigator}
            />
            <RootStack.Screen
              name="Profile"
              component={ProfileNavigator}
            />
            <RootStack.Screen
              name="Bookmarks"
              component={BookmarksNavigator}
            />
            <RootStack.Screen
              name="Marketplace"
              component={MarketplaceNavigator}
            />
            <RootStack.Screen
              name="MessageDetail"
              component={MessageDetailScreen}
            />
            <RootStack.Screen
              name="SupportMessageDetail"
              component={SupportMessageDetailScreen}
            />
          </RootStack.Group>
          
          {/* Wallet - Special animation (slide from bottom) */}
          <RootStack.Screen
            name="Wallet"
            component={WalletNavigator}
            options={{
              presentation: 'card',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
              headerShown: false,
            }}
          />
          
          {/* ModalsGroup - UI flow screens */}
          {/* CRITICAL: Modal presentation ile Settings ve MoreSchoise aşağıdan yukarıya açılır */}
          <RootStack.Group 
            screenOptions={{ 
              presentation: 'modal',
              animation: 'slide_from_right',
              gestureEnabled: true,
              headerShown: false,
            }}
          >
            <RootStack.Screen
              name="Settings"
              component={SettingsNavigator}
            />
            <RootStack.Screen
              name="MoreSchoise"
              component={MoreSchoiseNavigator}
            />
          </RootStack.Group>
        </>
      )}
    </RootStack.Navigator>
  );
};

