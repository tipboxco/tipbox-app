import { NavigatorScreenParams } from '@react-navigation/native';
import { AuthStackParamList } from '@/src/features/auth/navigation';
import { FeedStackParamList } from '@/src/features/feed/navigation';
import { ExploreStackParamList } from '@/src/features/explore/navigation';
import { CatalogStackParamList } from '@/src/features/catalog/navigation';
import { InventoryStackParamList } from '@/src/features/inventory/navigation';
import { ProfileStackParamList } from '@/src/features/profile/navigation';
import { SettingsStackParamList } from '@/src/features/settings/navigation';

// Main Tab Navigator için type tanımlaması
export type MainTabParamList = {
  Feed: NavigatorScreenParams<FeedStackParamList>;
  Explore: NavigatorScreenParams<ExploreStackParamList>;
  Catalog: NavigatorScreenParams<CatalogStackParamList>;
  Inventory: NavigatorScreenParams<InventoryStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Root Stack için type tanımlaması
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};