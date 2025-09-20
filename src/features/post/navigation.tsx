import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PostDetailScreen } from './screens';
import { useColorMode } from '@/src/hooks/useColorMode';

// Post Stack için type tanımlaması
export type PostStackParamList = {
  PostDetailScreen: { postData: any; type: 'post' | 'tipsAndTricks' | 'question' };
};

const Stack = createNativeStackNavigator<PostStackParamList>();

export const PostNavigator = () => {
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
        name="PostDetailScreen"
        component={PostDetailScreen}
      />
    </Stack.Navigator>
  );
};
