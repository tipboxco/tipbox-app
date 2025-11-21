import React from 'react';
import { Stack } from './stack';
import { ProfileNavigator } from '@/src/features/profile/navigation';
import { PostNavigator } from '@/src/features/post/navigation';
import { NotificationsNavigator } from '@/src/features/notifications/navigation';
import { BookmarksNavigator } from '@/src/features/bookmarks/navigation';
import { MarketplaceNavigator } from '@/src/features/marketplace/navigation';
import { WalletNavigator } from '@/src/features/wallet';

export const registerSharedScreens = (excludeScreenName?: string) => {
  return (
    <>
      <Stack.Screen name="Profile" component={ProfileNavigator} />
      <Stack.Screen name="Post" component={PostNavigator} />
      {excludeScreenName !== 'Notification' && (
        <Stack.Screen name="Notification" component={NotificationsNavigator} />
      )}
      <Stack.Screen name="Bookmarks" component={BookmarksNavigator} />
      <Stack.Screen name="Marketplace" component={MarketplaceNavigator} />
      <Stack.Screen name="Wallet" component={WalletNavigator} />
    </>
  );
};

