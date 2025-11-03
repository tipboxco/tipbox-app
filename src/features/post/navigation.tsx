import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PostDetailScreen, PostsScreen, CreatePostScreen, CreateTipsAndTrickPostScreen, CreateQuestionPostScreen, CreateExperiencePostScreen } from './screens';
import { useColorMode } from '@/src/hooks/useColorMode';

// Post Stack için type tanımlaması
export type PostStackParamList = {
  PostDetailScreen: { postData: any; type: 'post' | 'tipsAndTricks' | 'question' | 'benchmark' | 'experience' };
  PostsScreen: { stage: 'SubCategories' | 'ProductGroup' | 'Product'; name: string };
  CreatePostScreen: undefined;
  CreateTipsAndTrickPostScreen: undefined;
  CreateQuestionPostScreen: undefined;
  CreateExperiencePostScreen: undefined;
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
      <Stack.Screen
        name="PostsScreen"
        component={PostsScreen}
      />
      <Stack.Screen
        name="CreatePostScreen"
        component={CreatePostScreen}
      />
      <Stack.Screen
        name="CreateTipsAndTrickPostScreen"
        component={CreateTipsAndTrickPostScreen}
      />
      <Stack.Screen
        name="CreateQuestionPostScreen"
        component={CreateQuestionPostScreen}
      />
      <Stack.Screen
        name="CreateExperiencePostScreen"
        component={CreateExperiencePostScreen}
      />
    </Stack.Navigator>
  );
};
