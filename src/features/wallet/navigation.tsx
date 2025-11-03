import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WalletScreen } from './screens/WalletScreen';
import { WalletConnection } from './screens/WalletConnection';
import { SwapScreen } from './screens/SwapScreen';
import { NftAssetsScreen } from './screens/NftAssetsScreen';
import { NftAssetDetailScreen } from './screens/NftAssetDetailScreen';
import { useWalletStore } from '@/src/store';

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
  const isConnected = useWalletStore(state => state.isConnected);
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


