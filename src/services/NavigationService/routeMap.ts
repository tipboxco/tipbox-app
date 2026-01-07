import type { FeatureRouteMap } from './types';

/**
 * Feature Route Mapping
 * 
 * Navigation tree yapısından bağımsız navigation için route mapping.
 * Navigation tree değişirse sadece bu mapping güncellenir.
 * 
 * Yapı: MainDrawer → Tabs → Tab → Feature Screen
 */
export const FEATURE_ROUTE_MAP: FeatureRouteMap = {
  FEED: {
    root: 'MainDrawer',
    tabContainer: 'Tabs',
    tab: 'Feed',
  },
  EXPLORE: {
    root: 'MainDrawer',
    tabContainer: 'Tabs',
    tab: 'Explore',
  },
  CATALOG: {
    root: 'MainDrawer',
    tabContainer: 'Tabs',
    tab: 'Catalog',
  },
  EVENTS: {
    root: 'MainDrawer',
    tabContainer: 'Tabs',
    tab: 'Events',
  },
  NOTIFICATION: {
    root: 'MainDrawer',
    tabContainer: 'Tabs',
    tab: 'Notification',
  },
  INBOX: {
    root: 'MainDrawer',
    tabContainer: 'Tabs',
    tab: 'Inbox',
  },
} as const;

/**
 * Get route mapping for a feature
 */
export function getRouteMapping(feature: string): FeatureRouteMap[string] | undefined {
  return FEATURE_ROUTE_MAP[feature.toUpperCase()];
}

