import type { FeatureRouteMap } from './types';

/**
 * Feature Route Mapping
 * 
 * Navigation tree yapısından bağımsız navigation için route mapping.
 * Navigation tree değişirse sadece bu mapping güncellenir.
 * 
 * Yapı: App → MainTabs → TabStack → Feature Screen
 * 
 * Navigation Path:
 * - Root: App (RootStackParamList)
 * - TabContainer: MainTabs (DrawerParamList)
 * - Tab: FeedStack, ExploreStack, CatalogStack, vb. (TabParamList)
 * - Screen: Feed, Explore, Catalog, vb. (MainStackParamList)
 */
export const FEATURE_ROUTE_MAP: FeatureRouteMap = {
  FEED: {
    root: 'App',
    tabContainer: 'MainTabs',
    tab: 'FeedStack',
  },
  EXPLORE: {
    root: 'App',
    tabContainer: 'MainTabs',
    tab: 'ExploreStack',
  },
  CATALOG: {
    root: 'App',
    tabContainer: 'MainTabs',
    tab: 'ExploreStack',
  },
  EVENTS: {
    root: 'App',
    tabContainer: 'MainTabs',
    tab: 'EventsStack',
  },
  NOTIFICATION: {
    root: 'App',
    tabContainer: 'MainTabs',
    tab: 'NotificationStack',
  },
  INBOX: {
    root: 'App',
    tabContainer: 'MainTabs',
    tab: 'InboxStack',
  },
} as const;

/**
 * Get route mapping for a feature
 */
export function getRouteMapping(feature: string): FeatureRouteMap[string] | undefined {
  return FEATURE_ROUTE_MAP[feature.toUpperCase()];
}

