import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  ProfileScreen,
  ProfileEditScreen,
  InventoryScreen,
  InventoryDetailScreen,
  Trust_TrusterListScreen,
  SuggestedUsersScreen,
  CollectionsScreen
} from './screens';
import { ChevronLeft } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';

// Profile Stack için type tanımlaması
export type ProfileStackParamList = {
  ProfileMain: { userId?: string } | undefined;
  ProfileEdit: undefined;
  InventoryList: { userId: string; selectMode?: 'event'; returnScreen?: string };
  InventoryDetail: { itemId: string; userId: string };
  Collections: undefined;
  TrustList: { userId: string; initialTab?: 'trust' | 'truster' };
  SuggestedUsers: undefined;
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
        options={{
          contentStyle: {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
            padding: 0,
            margin: 0,
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: 0,
            paddingRight: 0,
            marginTop: 0,
            marginBottom: 0,
            marginLeft: 0,
            marginRight: 0,
          },
          animation: 'none',
        }}
      />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
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
        name="TrustList"
        component={Trust_TrusterListScreen}
      />
      <Stack.Screen
        name="SuggestedUsers"
        component={SuggestedUsersScreen}
      />
      <Stack.Screen
        name="Collections"
        component={CollectionsScreen}
      />
    </Stack.Navigator>
  );
};
