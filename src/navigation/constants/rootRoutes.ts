/**
 * Root Route Constants
 * Type-safe root route isimleri
 * 
 * Kullanım:
 * navigationService.navigate(ROOT_ROUTES.POST, { ... })
 */
export const ROOT_ROUTES = {
  // Authentication
  AUTH: 'Auth',
  
  // Main Application
  MAIN_DRAWER: 'MainDrawer',
  
  // Settings & MoreSchoise
  SETTINGS: 'Settings',
  MORE_SCHOISE: 'MoreSchoise',
  
  // GlobalStackGroup - Deep-Dive Screens
  POST: 'Post',
  PROFILE: 'Profile',
  WALLET: 'Wallet',
  BOOKMARKS: 'Bookmarks',
  MARKETPLACE: 'Marketplace',
  EVENT: 'Event',
  BRAND: 'Brand',
  MESSAGE_DETAIL: 'MessageDetail',
  SUPPORT_MESSAGE_DETAIL: 'SupportMessageDetail',
  COLLECTION_DETAIL: 'CollectionDetail',
  PRODUCT_SELECT: 'ProductSelect',
} as const;

/**
 * Type-safe root route access
 */
export type RootRoute = typeof ROOT_ROUTES[keyof typeof ROOT_ROUTES];

