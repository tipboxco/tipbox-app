/**
 * Deep Link Service Types
 * Deep linking için type tanımları
 */

/**
 * Deep Link Route
 * Navigation route mapping
 */
export interface DeepLinkRoute {
  screen: string;
  params?: Record<string, any>;
}

/**
 * Deep Link Pattern
 * URL pattern matching için
 */
export interface DeepLinkPattern {
  pattern: RegExp;
  handler: (match: RegExpMatchArray) => DeepLinkRoute;
}

/**
 * Navigation Screen Map
 * Screen isimlerini route'lara map eder
 */
export interface NavigationScreenMap {
  [key: string]: {
    screen: string;
    paramMapper?: (params: Record<string, any>) => Record<string, any>;
  };
}

