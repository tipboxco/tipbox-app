import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EventDetailScreen, EventCreatePost, RewardsBadgesScreen, SurveyScreen } from './screens';
import { useColorMode } from '@/src/hooks/useColorMode';
import { EventType } from '@/src/utils';
import { EventProduct } from '@/src/mock/events/communityEvents/types';
import type { InventoryBrand } from '@/src/features/profile/types';
import type { EventDetailProduct } from './types';

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
    eventTypeRaw?: string;
    roastProduct?: EventDetailProduct;
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
  SurveyScreen: {
    brandId: string;
    surveyId: string;
    title: string;
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
        options={{
          // Initial screen: disable inner navigator's gesture so
          // RootStack's swipe-back can dismiss the entire EventNavigator
          gestureEnabled: false,
        }}
      />
      <EventStack.Screen
        name="EventCreatePost"
        component={EventCreatePost}
      />
      <EventStack.Screen
        name="RewardsBadgesScreen"
        component={RewardsBadgesScreen}
      />
      <EventStack.Screen
        name="SurveyScreen"
        component={SurveyScreen}
      />
    </EventStack.Navigator>
  );
};
