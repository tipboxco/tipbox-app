import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  ProfileScreen,
  InventoryScreen,
  InventoryDetailScreen
} from './screens';
import { ChevronLeft } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';

// Profile Stack için type tanımlaması
export type ProfileStackParamList = {
  ProfileMain: undefined;
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
        name="InventoryList"
        component={InventoryScreen}
      />
      <Stack.Screen
        name="InventoryDetail"
        component={InventoryDetailScreen}
      />
    </Stack.Navigator>
  );
};
