import { NavigatorScreenParams } from '@react-navigation/native';
import { AuthStackParamList } from '@/src/features/auth/navigation';
import { SettingsStackParamList } from '@/src/features/settings/navigation';
import { MoreSchoiseStackParamList } from '@/src/features/moreSchoise/navigation';
import { FeedStackParamList } from '@/src/features/feed/navigation';
import { ExploreStackParamList } from '@/src/features/explore/navigation';
import { CatalogStackParamList } from '@/src/features/catalog/navigation';
import { EventsStackParamList } from '@/src/features/events/navigation';
import { ProfileStackParamList } from '@/src/features/profile/navigation';
import { PostStackParamList } from '@/src/features/post/navigation';
import { NotificationsStackParamList } from '@/src/features/notifications/navigation';
import { BookmarksStackParamList } from '@/src/features/bookmarks/navigation';
import { MarketplaceStackParamList } from '@/src/features/marketplace/navigation';
import { InboxStackParamList } from '@/src/features/inbox/navigation';

// Main Stack için type tanımlaması (TabNavigator içindeki Stack)
// Her tab'ın kendi Stack Navigator'ı var ve tüm ekranlar bu Stack'ler içinde
export type MainStackParamList = {
  Feed: NavigatorScreenParams<FeedStackParamList>;
  Explore: NavigatorScreenParams<ExploreStackParamList>;
  Catalog: NavigatorScreenParams<CatalogStackParamList>;
  Events: NavigatorScreenParams<EventsStackParamList>;
  Notification: NavigatorScreenParams<NotificationsStackParamList>;
  Inbox: NavigatorScreenParams<InboxStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
  Post: NavigatorScreenParams<PostStackParamList>;
  Bookmarks: NavigatorScreenParams<BookmarksStackParamList>;
  Marketplace: NavigatorScreenParams<MarketplaceStackParamList>;
  Wallet: undefined;
};

// Root Stack için type tanımlaması
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
  MoreSchoise: NavigatorScreenParams<MoreSchoiseStackParamList>;
};