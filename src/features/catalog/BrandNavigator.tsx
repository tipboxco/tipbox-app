import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BrandDetailScreen from './screens/BrandDetailScreen';
import BrandProductBookScreen from './screens/BrandProductBookScreen';
import BrandProductDetailScreen from './screens/BrandProductDetailScreen';
import SurveyScreen from './screens/SurveyScreen';
import BrandEventsDetailScreen from './screens/BrandEventsDetailScreen';
import BrandEventDetail from './screens/BrandEventDetail';
import BrandHistoryScreen from './screens/BrandHistoryScreen';
import BrandSurveyListScreen from './screens/BrandSurveyListScreen';
import BrandPostListScreen from './screens/BrandPostListScreen';
import BrandEventsScreen from './screens/BrandEventsScreen';
import SurveyParticipationScreen from './screens/SurveyParticipationScreen';
import { useColorMode } from '@/src/hooks/useColorMode';

/**
 * Brand Navigator - Root Navigator için
 * BrandDetailScreen ve alt ekranlarını global olarak erişilebilir yapar
 * EventNavigator ve PostNavigator gibi, RootNavigator'ın DetailsGroup'unda kullanılır
 */
export type BrandStackParamList = {
  BrandDetailScreen: { brandId: string };
  BrandProductBookScreen: { brandId: string };
  BrandProductDetailScreen: { brandId: string; productId: string; productName?: string; productImage?: any };
  SurveyScreen: { brandId: string };
  SurveyParticipationScreen: { surveyId: string; brandId: string };
  BrandEventsDetailScreen: { eventId: string };
  BrandEventDetail: { eventId: string };
  BrandHistoryScreen: { brandId: string };
  BrandSurveyListScreen: { brandId: string };
  BrandPostListScreen: { brandId: string };
  BrandEventsScreen: { brandId: string };
};

const BrandStack = createNativeStackNavigator<BrandStackParamList>();

export const BrandNavigator = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <BrandStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? '#000000' : '#FAFAFA',
        },
      }}
    >
      <BrandStack.Screen
        name="BrandDetailScreen"
        component={BrandDetailScreen}
      />
      <BrandStack.Screen
        name="BrandProductBookScreen"
        component={BrandProductBookScreen}
      />
      <BrandStack.Screen
        name="BrandProductDetailScreen"
        component={BrandProductDetailScreen}
      />
      <BrandStack.Screen
        name="SurveyScreen"
        component={SurveyScreen}
      />
      <BrandStack.Screen
        name="SurveyParticipationScreen"
        component={SurveyParticipationScreen}
      />
      <BrandStack.Screen
        name="BrandEventsDetailScreen"
        component={BrandEventsDetailScreen}
      />
      <BrandStack.Screen
        name="BrandEventDetail"
        component={BrandEventDetail}
      />
      <BrandStack.Screen
        name="BrandHistoryScreen"
        component={BrandHistoryScreen}
      />
      <BrandStack.Screen
        name="BrandSurveyListScreen"
        component={BrandSurveyListScreen}
      />
      <BrandStack.Screen
        name="BrandPostListScreen"
        component={BrandPostListScreen}
      />
      <BrandStack.Screen
        name="BrandEventsScreen"
        component={BrandEventsScreen}
      />
    </BrandStack.Navigator>
  );
};
