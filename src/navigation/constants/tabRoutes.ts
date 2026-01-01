/**
 * Tab Route Constants
 * Type-safe tab route isimleri
 * 
 * Kullanım:
 * navigationService.navigateNested(TAB_ROUTES.FEED, 'FeedScreen', { ... })
 */
export const TAB_ROUTES = {
  FEED: 'Feed',
  EXPLORE: 'Explore',
  CATALOG: 'Catalog',
  EVENTS: 'Events',
  NOTIFICATION: 'Notification',
  INBOX: 'Inbox',
} as const;

/**
 * Type-safe tab route access
 */
export type TabRoute = typeof TAB_ROUTES[keyof typeof TAB_ROUTES];

