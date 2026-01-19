import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NewsDetailScreen from './screens/NewsDetailScreen';
import { useColorMode } from '@/src/hooks/useColorMode';

/**
 * News Navigator - Root Navigator için
 * NewsDetailScreen'i global olarak erişilebilir yapar
 * PostNavigator gibi, RootNavigator'ın DetailsGroup'unda kullanılır
 */
export type NewsStackParamList = {
  NewsDetailScreen: { 
    newsId: string;
    brandId?: string;
    productId?: string;
  };
};

const NewsStack = createNativeStackNavigator<NewsStackParamList>();

export const NewsNavigator = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <NewsStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? '#000000' : '#FAFAFA',
        },
      }}
    >
      <NewsStack.Screen
        name="NewsDetailScreen"
        component={NewsDetailScreen}
      />
    </NewsStack.Navigator>
  );
};
