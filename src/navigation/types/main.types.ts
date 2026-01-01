import { NavigatorScreenParams } from '@react-navigation/native';
import { FeedStackParamList } from '@/src/features/feed/navigation';
import { ExploreStackParamList } from '@/src/features/explore/navigation';
import { CatalogStackParamList } from '@/src/features/catalog/navigation';
import { EventsStackParamList } from '@/src/features/events/navigation';
import { NotificationsStackParamList } from '@/src/features/notifications/navigation';
import { InboxStackParamList } from '@/src/features/inbox/navigation';

/**
 * Main Stack Param List
 * TabNavigator içindeki feature stack'ler için type tanımlamaları
 * 
 * Not: Global screens (Post, Profile, Wallet, vb.) burada YOK
 * Global screens RootStackParamList'te tanımlı
 */
export type MainStackParamList = {
  Feed: NavigatorScreenParams<FeedStackParamList>;
  Explore: NavigatorScreenParams<ExploreStackParamList>;
  Catalog: NavigatorScreenParams<CatalogStackParamList>;
  Events: NavigatorScreenParams<EventsStackParamList>;
  Notification: NavigatorScreenParams<NotificationsStackParamList>;
  Inbox: NavigatorScreenParams<InboxStackParamList>;
};

