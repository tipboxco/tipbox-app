import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import InventoryScreen from './screens/InventoryScreen';
import InventoryDetailScreen from './screens/InventoryDetailScreen';
import { InventoryStackParamList } from './types';

const Stack = createNativeStackNavigator<InventoryStackParamList>();

export const InventoryNavigator = () => {
  const navigation = useNavigation();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="InventoryList" 
        component={InventoryScreen}
        options={{
          title: 'Inventory',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <ChevronLeft 
              size={24} 
              color={isDark ? '#FFFFFF' : '#000000'} 
              style={{ marginLeft: 16 }}
              onPress={() => navigation.goBack()} 
            />
          ),
          headerStyle: {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
          },
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: '600',
          },
          headerTintColor: isDark ? '#FFFFFF' : '#000000',
        }}
      />
      <Stack.Screen 
        name="InventoryDetail" 
        component={InventoryDetailScreen}
        options={{ title: 'Product Details' }}
      />
    </Stack.Navigator>
  );
};