/**
 * Tab Navigator Types
 * Tab bar navigator için type tanımlamaları
 * 
 * ARCHITECTURE FIX: FeedStack is now a Tab.Screen that uses FeedNavigator
 * This enables useScrollToTop to work correctly for Instagram-style "tap active tab → scroll to top"
 */
import { NavigatorScreenParams } from '@react-navigation/native';
import { EventsStackParamList } from '@/src/features/events/navigation';

export type TabParamList = {
  FeedStack: undefined;
  ExploreStack: undefined;
  WalletStack: undefined;
  EventsStack: NavigatorScreenParams<EventsStackParamList>;
  NotificationStack: undefined;
  InboxStack: undefined;
};

