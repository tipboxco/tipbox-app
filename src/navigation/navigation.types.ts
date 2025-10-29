import { NavigatorScreenParams } from '@react-navigation/native';
import { AuthStackParamList } from '@/src/features/auth/navigation';
import { FeedStackParamList } from '@/src/features/feed/navigation';
import { ExploreStackParamList } from '@/src/features/explore/navigation';
import { CatalogStackParamList } from '@/src/features/catalog/navigation';
import { ProfileStackParamList } from '@/src/features/profile/navigation';
import { SettingsStackParamList } from '@/src/features/settings/navigation';
import { EventsStackParamList } from '@/src/features/events/navigation';
import { MoreSchoiseStackParamList } from '@/src/features/moreSchoise/navigation';
import { PostStackParamList } from '@/src/features/post/navigation';
import { NotificationsStackParamList } from '@/src/features/notifications/navigation';
import { BookmarksStackParamList } from '@/src/features/bookmarks/navigation';
import { MarketplaceStackParamList } from '@/src/features/marketplace/navigation';

// Main Tab Navigator için type tanımlaması
export type MainTabParamList = {
  Feed: NavigatorScreenParams<FeedStackParamList>;
  Explore: NavigatorScreenParams<ExploreStackParamList>;
  Catalog: NavigatorScreenParams<CatalogStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
  Events: NavigatorScreenParams<EventsStackParamList>;
};

// Root Stack için type tanımlaması
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
  MoreSchoise: NavigatorScreenParams<MoreSchoiseStackParamList>;
  Post: NavigatorScreenParams<PostStackParamList>;
  Notifications: NavigatorScreenParams<NotificationsStackParamList>;
  Bookmarks: NavigatorScreenParams<BookmarksStackParamList>;
  Marketplace: NavigatorScreenParams<MarketplaceStackParamList>;
  Wallet: undefined;
};