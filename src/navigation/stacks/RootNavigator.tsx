import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStatus } from '@/src/hooks/useAuthStatus';
import { AuthNavigator } from '@/src/features/auth/navigation';
import { DrawerNavigator } from '../DrawerNavigator';
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

const RootStack = createNativeStackNavigator<RootStackParamList>();

/**
 * RootNavigator
 * 
 * Uygulamanın en üst seviye navigator'ı.
 * 
 * Optimizasyonlar:
 * - useAuthStatus: Memoized selector ile re-render minimize edildi
 * - RootNavigator en az render edilen component olmalı
 * 
 * Yapı:
 * - Auth: Authentication flow (if !isAuthenticated)
 * - MainDrawer: Ana uygulama (TabNavigator + Drawer) (if isAuthenticated)
 * - Settings: Ayarlar
 * - MoreSchoise: MoreSchoise ekranı
 * - GlobalStackGroup: Deep-dive screens (Post, Profile, Wallet, vb.)
 * 
 * GlobalStackGroup:
 * - Hangi tab açık olursa olsun Root'tan açılır
 * - Tek instance (memory efficient)
 * - Tab state'inden bağımsız
 * 
 * Not: MessageDetail ve SupportMessageDetail şu an tek screen olarak root'ta.
 * İleride InboxNavigator pattern'ine çekilebilir:
 * InboxNavigator
 *   ├── InboxList
 *   ├── MessageDetail
 *   └── SupportMessageDetail
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
          {/* Main Application - TabNavigator + Drawer */}
          <RootStack.Screen name="MainDrawer" component={DrawerNavigator} />
         
          
          {/* GlobalStackGroup - Deep-Dive Screens */}
          {/* Bu ekranlar hangi tab açık olursa olsun Root'tan açılır */}
          <RootStack.Group>
            
            <RootStack.Screen
              name="Post"
              component={PostNavigator}
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
                gestureEnabled: true, // Android back behavior için
              }}
            />
            <RootStack.Screen
              name="Profile"
              component={ProfileNavigator}
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
                gestureEnabled: true, // Android back behavior için
              }}
            />
            <RootStack.Screen
              name="Wallet"
              component={WalletNavigator}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
                gestureEnabled: true, // Android back behavior için
              }}
            />
            <RootStack.Screen
              name="Bookmarks"
              component={BookmarksNavigator}
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
                gestureEnabled: true, // Android back behavior için
              }}
            />
            <RootStack.Screen
              name="Marketplace"
              component={MarketplaceNavigator}
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
                gestureEnabled: true, // Android back behavior için
              }}
            />
            <RootStack.Screen
              name="MessageDetail"
              component={MessageDetailScreen}
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
                gestureEnabled: true, // Android back behavior için
              }}
            />
            <RootStack.Screen
              name="SupportMessageDetail"
              component={SupportMessageDetailScreen}
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
                gestureEnabled: true, // Android back behavior için
              }}
            />
          </RootStack.Group>
        </>
      )}
    </RootStack.Navigator>
  );
};

