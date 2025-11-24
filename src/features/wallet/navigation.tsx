import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WalletScreen } from './screens/WalletScreen';
import { WalletConnection } from './screens/WalletConnection';
import { SwapScreen } from './screens/SwapScreen';
import { NftAssetsScreen } from './screens/NftAssetsScreen';
import { NftAssetDetailScreen } from './screens/NftAssetDetailScreen';
import { WalletService } from '@/src/services/WalletService';
import { useState, useEffect } from 'react';

export interface NftItem {
  id: string;
  name: string;
  rarity: 'Usual' | 'Rare';
  rarityColor: string;
  rarityBorderColor: string;
  rarityTextColor?: string;
  image: any;
}

export type WalletStackParamList = {
  WalletConnection: undefined;
  WalletScreen: undefined;
  SwapScreen: undefined;
  NftAssetsScreen: undefined;
  NftAssetDetailScreen: { nft: NftItem };
};

const Stack = createNativeStackNavigator<WalletStackParamList>();

export const WalletNavigator: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);

  // Wallet connection durumunu yükle
  useEffect(() => {
    const loadWalletStatus = async () => {
      const status = await WalletService.getWalletConnectionStatus();
      setIsConnected(status);
    };
    loadWalletStatus();
  }, []);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isConnected ? (
        <>
          <Stack.Screen name="WalletScreen" component={WalletScreen} />
          <Stack.Screen name="SwapScreen" component={SwapScreen} />
          <Stack.Screen name="NftAssetsScreen" component={NftAssetsScreen} />
          <Stack.Screen name="NftAssetDetailScreen" component={NftAssetDetailScreen} />
        </>
      ) : (
        <Stack.Screen name="WalletConnection" component={WalletConnection} />
      )}
    </Stack.Navigator>
  );
};


