/**
 * Tab Navigator Types
 * Tab bar navigator için type tanımlamaları
 * 
 * ARCHITECTURE FIX: FeedStack is now a Tab.Screen that uses FeedNavigator
 * This enables useScrollToTop to work correctly for Instagram-style "tap active tab → scroll to top"
 */
export type TabParamList = {
  FeedStack: undefined;
  ExploreStack: undefined;
  CatalogStack: undefined;
  EventsStack: undefined;
  NotificationStack: undefined;
  InboxStack: undefined;
};

