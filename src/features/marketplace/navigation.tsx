import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MarketPlaceScreen from './screens/MarketPlaceScreen';
import SelectNFTScreen from './screens/SelectNFTScreen';
import NFTDetailScreen from './screens/NFTDetailScreen';
import NFTSellScreen from './screens/NFTSellScreen';
import { UserNFT } from '@/src/mock/marketplace/NFTList/types';

export type MarketplaceStackParamList = {
  MarketPlaceScreen: { initialTab?: 'all' | 'myListings' } | undefined;
  SelectNFTScreen: undefined;
  NFTDetailScreen: { 
    nftId: string;
    mode?: 'view' | 'buy'; // view: Buy button hidden, buy: Buy button visible
  };
  NFTSellScreen: {
    nftId: string;
  };
};

const Stack = createNativeStackNavigator<MarketplaceStackParamList>();

export const MarketplaceNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MarketPlaceScreen" component={MarketPlaceScreen} />
      <Stack.Screen name="SelectNFTScreen" component={SelectNFTScreen} />
      <Stack.Screen name="NFTDetailScreen" component={NFTDetailScreen} />
      <Stack.Screen name="NFTSellScreen" component={NFTSellScreen} />
    </Stack.Navigator>
  );
};
