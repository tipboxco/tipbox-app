import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EventDetailScreen, EventCreatePost, RewardsBadgesScreen } from './screens';
import { useColorMode } from '@/src/hooks/useColorMode';
import { EventType } from '@/src/utils';
import { EventProduct } from '@/src/mock/events/communityEvents/types';
import { InventoryBrand } from '@/src/features/profile/types';

/**
 * Event Navigator - Root Navigator için
 * EventDetailScreen ve EventCreatePost'u global olarak erişilebilir yapar
 * PostNavigator gibi, RootNavigator'ın DetailsGroup'unda kullanılır
 */
export type EventStackParamList = {
  EventDetailScreen: { 
    eventId: string;
  };
  EventCreatePost: { 
    eventId?: string; 
    eventType?: EventType; 
    product?: EventProduct; 
    productSource?: 'Catalog' | 'Inventory';
    selectedProduct?: {
      id: string;
      name: string;
      image: any;
      description?: string;
    };
    selectedInventoryProduct?: {
      id: string;
      productId: string;
      brand: InventoryBrand;
      image: string;
    };
  } | undefined;
  RewardsBadgesScreen: {
    eventId: string;
  };
};

const EventStack = createNativeStackNavigator<EventStackParamList>();

export const EventNavigator = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <EventStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? '#000000' : '#FAFAFA',
        },
      }}
    >
      <EventStack.Screen
        name="EventDetailScreen"
        component={EventDetailScreen}
      />
      <EventStack.Screen
        name="EventCreatePost"
        component={EventCreatePost}
      />
      <EventStack.Screen
        name="RewardsBadgesScreen"
        component={RewardsBadgesScreen}
      />
    </EventStack.Navigator>
  );
};
