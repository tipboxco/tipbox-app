import { NavigatorScreenParams } from '@react-navigation/native';
import { AuthStackParamList } from '@/src/features/auth/navigation';
import { FeedStackParamList } from '@/src/features/feed/navigation';
import { ExploreStackParamList } from '@/src/features/explore/navigation';
import { CatalogStackParamList } from '@/src/features/catalog/navigation';
import { ProfileStackParamList } from '@/src/features/profile/navigation';
import { SettingsStackParamList } from '@/src/features/settings/navigation';
import { BridgeStackParamList } from '@/src/features/bridge/types';
import { PostStackParamList } from '@/src/features/post/navigation';

// Main Tab Navigator için type tanımlaması
export type MainTabParamList = {
  Feed: NavigatorScreenParams<FeedStackParamList>;
  Explore: NavigatorScreenParams<ExploreStackParamList>;
  Catalog: NavigatorScreenParams<CatalogStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Root Stack için type tanımlaması
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
  Bridge: NavigatorScreenParams<BridgeStackParamList>;
  Post: NavigatorScreenParams<PostStackParamList>;
};