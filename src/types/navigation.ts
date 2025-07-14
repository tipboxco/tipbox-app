// Navigation ile ilgili global tipler

import type { NavigatorScreenParams } from '@react-navigation/native';

// Root Navigator Types
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<TabParamList>;
};

// Auth Navigator Types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Tab Navigator Types
export type TabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  ExploreTab: NavigatorScreenParams<ExploreStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

// Feature Stack Types
export type HomeStackParamList = {
  Home: undefined;
};

export type ExploreStackParamList = {
  Explore: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};
