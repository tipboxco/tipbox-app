import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  ProfileScreen, 
  TrustListScreen, 
  TrusterListScreen, 
  WishlistScreen,
  SetupProfileScreen,
  SelectCategoriesScreen,
  InventoryScreen,
  InventoryDetailScreen,
  CollectionsScreen
} from './screens';
import { ChevronLeft } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';

// Profile Stack için type tanımlaması
export type ProfileStackParamList = {
  ProfileMain: undefined;
  TrustList: undefined;
  TrusterList: undefined;
  WishlistDetail: undefined;
  SetupProfile: undefined;
  SelectCategories: undefined;
  InventoryList: undefined;
  InventoryDetail: { itemId: string };
  Collections: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileNavigator = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
        },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
      />
      <Stack.Screen
        name="TrustList"
        component={TrustListScreen}
      />
      <Stack.Screen
        name="TrusterList"
        component={TrusterListScreen}
      />
      <Stack.Screen
        name="WishlistDetail"
        component={WishlistScreen}
      />
      <Stack.Screen
        name="SetupProfile"
        component={SetupProfileScreen}
      />
      <Stack.Screen
        name="SelectCategories"
        component={SelectCategoriesScreen}
      />
      <Stack.Screen
        name="InventoryList"
        component={InventoryScreen}
      />
      <Stack.Screen
        name="InventoryDetail"
        component={InventoryDetailScreen}
      />
      <Stack.Screen
        name="Collections"
        component={CollectionsScreen}
        options={{
          headerShown: true,
          headerTitle: '',
          headerShadowVisible: false,
          headerLeft: () => (
            <ChevronLeft
              size={24}
              color={isDark ? '#FFFFFF' : '#000000'}
            />
          ),
        }}
      />
    </Stack.Navigator>
  );
};
