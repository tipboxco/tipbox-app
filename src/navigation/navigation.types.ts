// Re-export all navigation types from global types
export type {
  RootStackParamList,
  AuthStackParamList,
  TabParamList,
  HomeStackParamList,
  ExploreStackParamList,
  ProfileStackParamList,
  SettingsStackParamList,
} from '@/src/types';

// Feature Navigation Types - Re-exported from features
export type { AuthStackParamList as AuthNavigationParamList } from '../features/auth/navigation';
export type { HomeStackParamList as HomeNavigationParamList } from '../features/home/navigation';
export type { ProfileStackParamList as ProfileNavigationParamList } from '../features/profile/navigation';
export type { ExploreStackParamList as ExploreNavigationParamList } from '../features/explore/navigation';
export type { SettingsStackParamList as SettingsNavigationParamList } from '../features/settings/navigation';

// Import for global declaration
import type { RootStackParamList } from '@/src/types';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
