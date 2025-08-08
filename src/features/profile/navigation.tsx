import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen, BadgesScreen, FeedScreen, InventoryScreen, WishlistScreen } from './screens';

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  BadgesScreen: undefined;
  ProfileFeed: undefined;
  ProfileInventory: undefined;
  Wishlist: undefined;
  EditProfile: undefined;
};

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileNavigator = () => {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <ProfileStack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
      />
      <ProfileStack.Screen
        name="BadgesScreen"
        component={BadgesScreen}
        options={{
          headerShown: true,
          headerTitle: 'Rozetlerim'
        }}
      />
      <ProfileStack.Screen
        name="ProfileFeed"
        component={FeedScreen}
        options={{
          headerShown: true,
          headerTitle: 'Gönderilerim'
        }}
      />
      <ProfileStack.Screen
        name="ProfileInventory"
        component={InventoryScreen}
        options={{
          headerShown: true,
          headerTitle: 'Envanterim'
        }}
      />
      <ProfileStack.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          headerShown: true,
          headerTitle: 'İstek Listem'
        }}
      />
    </ProfileStack.Navigator>
  );
};