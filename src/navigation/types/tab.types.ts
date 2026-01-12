/**
 * Tab Navigator Types
 * Tab bar navigator için type tanımlamaları
 * 
 * ARCHITECTURE FIX: FeedScreen is now a direct Tab.Screen (not wrapped in FeedNavigator)
 * This enables useScrollToTop to work correctly for Instagram-style "tap active tab → scroll to top"
 */
export type TabParamList = {
  FeedScreen: undefined;
  ExploreStack: undefined;
  CatalogStack: undefined;
  EventsStack: undefined;
  NotificationStack: undefined;
  InboxStack: undefined;
};

