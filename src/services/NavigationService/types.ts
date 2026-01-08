/**
 * Navigation Guards
 * 
 * NavigationService'in store'lara bağımlılığını kaldırmak için guard pattern.
 * Guards, NavigationService'i initialize ederken inject edilir.
 */
export interface NavigationGuards {
  /**
   * Kullanıcı şu anda kritik bir işlemde mi? (form, ödeme, vb.)
   */
  isUserBusy: () => boolean;
  
  /**
   * Kullanıcı busy ise, neden busy?
   */
  getBusyReason?: () => string | null;
  
  /**
   * Pending navigation'ı kaydet
   */
  setPendingNavigation?: (navigation: { route: string; params?: any }) => void;
  
  /**
   * Pending navigation'ı al
   */
  getPendingNavigation?: () => { route: string; params?: any } | null;
}

/**
 * Route Mapping Configuration
 * 
 * Navigation tree yapısından bağımsız navigation için route mapping.
 * Navigation tree değişse bile mapping güncellenerek çalışır.
 */
export interface RouteMapping {
  /**
   * Root route name (örn: 'MainDrawer')
   */
  root: string;
  
  /**
   * Tab container route name (örn: 'Tabs')
   */
  tabContainer?: string;
  
  /**
   * Tab route name (örn: 'Feed', 'Catalog')
   */
  tab: string;
}

/**
 * Feature Route Map
 * 
 * Her feature için navigation tree mapping'i.
 */
export type FeatureRouteMap = {
  [feature: string]: RouteMapping;
};

/**
 * Navigation Logger
 * 
 * Production'da logging'i kontrol etmek için.
 */
export interface NavigationLogger {
  debug: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  log: (...args: any[]) => void;
}

