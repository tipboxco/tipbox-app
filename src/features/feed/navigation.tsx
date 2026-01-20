import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedScreen } from './screens';
import { WalletScreen } from '@/src/features/wallet/screens/WalletScreen';
import { WalletConnection } from '@/src/features/wallet/screens/WalletConnection';
import { SwapScreen } from '@/src/features/wallet/screens/SwapScreen';
import { NftAssetsScreen } from '@/src/features/wallet/screens/NftAssetsScreen';
import { NftAssetDetailScreen } from '@/src/features/wallet/screens/NftAssetDetailScreen';
import { NftTransferScreen } from '@/src/features/wallet/screens/NftTransferScreen';
import type { NftItem } from '@/src/features/wallet/navigation';
//import { ReviewDetail } from '@/src/components/ReviewDetail';

export type FeedStackParamList = {
  FeedScreen: undefined;
  ReviewDetail: undefined;
  CreatePost: undefined;
  WalletConnection: undefined;
  WalletScreen: undefined;
  SwapScreen: undefined;
  NftAssetsScreen: undefined;
  NftAssetDetailScreen: { nft: NftItem };
  NftTransferScreen: undefined;
};

const FeedStack = createNativeStackNavigator<FeedStackParamList>();

export const FeedNavigator = () => {
  return (
    <FeedStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <FeedStack.Screen
        name="FeedScreen"
        component={FeedScreen}
      />
      {/* Wallet screens - FeedStack içinde olduğu için global bottom sheet çalışır */}
      {/* Her zaman her iki ekranı da ekle - WalletConnection'dan WalletScreen'e geçiş navigation.replace ile yapılıyor */}
      <FeedStack.Screen
        name="WalletConnection"
        component={WalletConnection}
      />
      <FeedStack.Screen
        name="WalletScreen"
        component={WalletScreen}
      />
      <FeedStack.Screen
        name="SwapScreen"
        component={SwapScreen}
      />
      <FeedStack.Screen
        name="NftAssetsScreen"
        component={NftAssetsScreen}
      />
      <FeedStack.Screen
        name="NftAssetDetailScreen"
        component={NftAssetDetailScreen}
      />
      <FeedStack.Screen
        name="NftTransferScreen"
        component={NftTransferScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
      {/* <FeedStack.Screen
        name="ReviewDetail"
        component={ReviewDetail}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom'
        }}
      /> */}
    </FeedStack.Navigator>
  );
};