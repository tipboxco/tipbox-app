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
  const [isReady, setIsReady] = useState(false);

  // Wallet connection durumunu yükle
  useEffect(() => {
    const loadWalletStatus = async () => {
      const status = await WalletService.getWalletConnectionStatus();
      setIsConnected(status);
      setIsReady(true);
    };
    loadWalletStatus();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: 'slide_from_right',
      }}
    >
      {!isConnected && (
        <Stack.Screen name="WalletConnection" component={WalletConnection} />
      )}
      <Stack.Screen 
        name="WalletScreen" 
        component={WalletScreen}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          // Swipe back gesture'ı ekranın sol kenarından başlatmak için
          // Bu sayede PagerView'in swipe'ı ile çakışmaz
          gestureResponseDistance: 50, // Sol 50px'den swipe yapılırsa back gesture tetiklenir
        }}
      />
      <Stack.Screen name="SwapScreen" component={SwapScreen} />
      <Stack.Screen name="NftAssetsScreen" component={NftAssetsScreen} />
      <Stack.Screen name="NftAssetDetailScreen" component={NftAssetDetailScreen} />
    </Stack.Navigator>
  );
};


