import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MarketPlaceScreen from './screens/MarketPlaceScreen';
import SelectNFTScreen from './screens/SelectNFTScreen';
import NFTDetailScreen from './screens/NFTDetailScreen';
import { UserNFT } from '@/src/mock/marketplace/NFTList/types';

export type MarketplaceStackParamList = {
  MarketPlaceScreen: undefined;
  SelectNFTScreen: undefined;
  NFTDetailScreen: { nftData: UserNFT };
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
    </Stack.Navigator>
  );
};
