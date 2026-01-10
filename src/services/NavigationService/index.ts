import React from 'react';
import { NavigationContainerRef, NavigationState } from '@react-navigation/native';
import type { RootStackParamList } from '@/src/navigation/types/root.types';
import type { MainStackParamList } from '@/src/navigation/types/main.types';
import type { 
  NavigationGuards, 
  FeatureRouteMap,
  NavigationLogger 
} from './types';
import { getRouteMapping } from './routeMap';
import { navigationLogger } from './logger';
import type { FeedStackParamList } from '@/src/features/feed/navigation';
import type { CatalogStackParamList } from '@/src/features/catalog/navigation';
import type { ExploreStackParamList } from '@/src/features/explore/navigation';
import type { EventsStackParamList } from '@/src/features/events/navigation';
import type { NotificationsStackParamList } from '@/src/features/notifications/navigation';
import type { InboxStackParamList } from '@/src/features/inbox/navigation';

/**
 * Stack Param List Union Type
 * Type-safe screen name validation için
 */
type StackParamList = 
  | FeedStackParamList
  | CatalogStackParamList
  | ExploreStackParamList
  | EventsStackParamList
  | NotificationsStackParamList
  | InboxStackParamList;

/**
 * NavigationService
 * 
 * ARCHITECTURE PRINCIPLES:
 * - Pure: Store'lara bağımlı değil (guards pattern)
 * - Stateless: Navigation ref dışında state tutmaz
 * - Framework-agnostic: Navigation tree yapısından bağımsız (route mapping)
 * - Type-safe: Mümkün olduğunca compile-time type checking
 * 
 * Özellikler:
 * - Type-safe navigation (compile-time kontrol)
 * - Guards pattern ile store bağımlılığı yok
 * - Route mapping ile navigation tree'den bağımsız
 * - Production-safe logging
 * - Recursive route resolution
 */
/**
 * Pending Navigation Queue Item
 */
interface PendingNavigationItem {
  route: string;
  params?: any;
  timestamp: number;
  options?: {
    priority?: 'high' | 'normal' | 'low';
    force?: boolean;
  };
}

class NavigationService {
  private navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList>> | null = null;
  
  /**
   * ARCHITECTURE FIX: Navigation Queue Pattern
   * Pending navigation'ları FIFO queue'da tutar
   * Navigation ready olduğunda queue'daki tüm navigation'ları consume eder
   */
  private pendingNavigationQueue: PendingNavigationItem[] = [];

  /**
   * Navigation guards (opsiyonel)
   * Store bağımlılığını kaldırmak için guard pattern
   */
  private guards?: NavigationGuards;

  /**
   * Navigation logger
   * Default olarak production-safe logger kullanılır
   */
  private logger: NavigationLogger = navigationLogger;

  /**
   * Navigation ref'i set et
   * NavigationProvider tarafından çağrılır
   */
  setNavigationRef(ref: React.RefObject<NavigationContainerRef<RootStackParamList>>): void {
    this.navigationRef = ref;
  }

  /**
   * Navigation guards'ı set et
   * Store bağımlılığını kaldırmak için guard pattern
   * 
   * @param guards - Navigation guards (isUserBusy, setPendingNavigation, vb.)
   */
  setGuards(guards: NavigationGuards): void {
    this.guards = guards;
  }

  /**
   * Logger'ı set et (opsiyonel, default production-safe logger)
   */
  setLogger(logger: NavigationLogger): void {
    this.logger = logger;
  }

  /**
   * Navigation ref hazır mı kontrol et (public)
   */
  isReady(): boolean {
    if (!this.navigationRef?.current) {
      this.logger.warn('Navigation ref is not set');
      return false;
    }

    if (!this.navigationRef.current.isReady()) {
      this.logger.warn('Navigation is not ready yet');
      return false;
    }

    return true;
  }

  /**
   * Recursive active route resolver
   * 
   * Nested navigation state'lerinde (Drawer → Tab → Screen) 
   * gerçek aktif ekranı bulur.
   */
  private getActiveRoute(state: NavigationState | undefined): { name?: string; params?: any } | null {
    if (!state) {
      return null;
    }

    let route = state.routes[state.index];
    
    // Recursively traverse nested states
    while (route.state) {
      const nestedState = route.state as NavigationState;
      if (nestedState.routes && nestedState.index !== undefined) {
        route = nestedState.routes[nestedState.index];
      } else {
        break;
      }
    }

    return {
      name: route.name,
      params: (route as any)?.params,
    };
  }

  /**
   * Type-safe root navigation
   * 
   * Sadece RootStackParamList'teki route'ları kabul eder.
   * Compile-time'da type kontrolü yapılır.
   * 
   * Safety Check: Guards pattern ile kullanıcı busy kontrolü.
   * 
   * @param routeName - Root route name (RootStackParamList key)
   * @param params - Route params (type-safe)
   * @param options - Navigation options (priority, force, vb.)
   */
  navigate<RouteName extends keyof RootStackParamList>(
    routeName: RouteName,
    params?: RootStackParamList[RouteName],
    options?: {
      priority?: 'high' | 'normal' | 'low';
      force?: boolean; // Kullanıcı busy olsa bile navigate et
    }
  ): void {
    // ARCHITECTURE FIX: Navigation Queue Pattern
    // Navigation ready değilse queue'ya ekle, ready olduğunda consume edilir
    if (!this.isReady()) {
      this.pendingNavigationQueue.push({
        route: routeName as string,
        params,
        timestamp: Date.now(),
        options,
      });
      return;
    }

    // Safety Check - Guards Pattern
    // Store'a bağımlılık yok, guards üzerinden kontrol edilir
    if (!options?.force && this.guards) {
      const isUserBusy = this.guards.isUserBusy();
      
      if (isUserBusy) {
        // High priority navigation'lar (ör: acil bildirimler) yine de navigate edebilir
        if (options?.priority !== 'high') {
          const reason = this.guards.getBusyReason?.() || 'unknown';
          this.logger.warn('User is busy, navigation deferred:', {
            route: routeName,
            reason,
            priority: options?.priority || 'normal',
          });
          
          // Pending navigation'a yaz (guards üzerinden)
          if (this.guards.setPendingNavigation) {
            this.guards.setPendingNavigation({
              route: routeName as string,
              params,
            });
          }
          
          return;
        }
      }
    }

    try {
      // Type assertion: React Navigation's type system doesn't fully support generic navigation
      // This is safe because we validate routeName is a keyof RootStackParamList
      (this.navigationRef!.current!.navigate as any)(routeName, params);
      this.logger.log('Navigated to:', routeName, params);
    } catch (error) {
      this.logger.error('Navigation error:', error);
      this.logger.error('Route:', routeName, 'Params:', params);
    }
  }

  /**
   * Nested navigation (Tab → Feature)
   * 
   * Route mapping pattern kullanarak navigation tree'den bağımsız navigation.
   * Navigation tree değişse bile sadece routeMap güncellenir.
   * 
   * @param tabName - Tab route name (MainStackParamList key)
   * @param screenName - Feature screen name
   * @param params - Screen params
   * 
   * @example
   * ```typescript
   * navigationService.navigateNested('Catalog', 'BrandProductDetailScreen', { productId: '123' });
   * ```
   */
  navigateNested<TabName extends keyof MainStackParamList>(
    tabName: TabName,
    screenName: string,
    params?: unknown
  ): void {
    if (!this.isReady()) {
      return;
    }

    try {
      // Route mapping pattern: Navigation tree'den bağımsız
      const routeMapping = getRouteMapping(tabName);
      
      if (!routeMapping) {
        this.logger.error('Route mapping not found for tab:', tabName);
        return;
      }

      // Build navigation params using route mapping
      // Yapı: root → tabContainer → tabStack → feature → screen
      // Örnek: App → MainTabs → FeedStack → Feed → ScreenName
      const navigationParams: any = {
        screen: routeMapping.tabContainer || 'MainTabs',
        params: {
          screen: routeMapping.tab,
          params: {
            screen: tabName, // MainStackParamList key'i (Feed, Explore, Catalog, vb.)
            params: {
              screen: screenName,
              params: params,
            },
          },
        },
      };
      
      // Navigate using root route from mapping
      (this.navigationRef!.current!.navigate as any)(routeMapping.root, navigationParams);
      this.logger.log('Navigated nested:', tabName, screenName, params);
    } catch (error) {
      this.logger.error('Nested navigation error:', error);
      this.logger.error('Tab:', tabName, 'Screen:', screenName, 'Params:', params);
    }
  }

  /**
   * Navigation reset (clear stack)
   * 
   * @param routeName - Root route name
   * @param params - Route params
   */
  reset<RouteName extends keyof RootStackParamList>(
    routeName: RouteName,
    params?: RootStackParamList[RouteName]
  ): void {
    if (!this.isReady()) {
      return;
    }

    try {
      this.navigationRef!.current!.reset({
        index: 0,
        routes: [{ name: routeName as never, params: params as never }],
      });
      this.logger.log('Reset navigation to:', routeName);
    } catch (error) {
      this.logger.error('Reset navigation error:', error);
    }
  }

  /**
   * Go back
   */
  goBack(): void {
    if (!this.isReady()) {
      return;
    }

    try {
      if (this.navigationRef!.current!.canGoBack()) {
        this.navigationRef!.current!.goBack();
        this.logger.log('Went back');
      } else {
        this.logger.warn('Cannot go back - no previous screen');
      }
    } catch (error) {
      this.logger.error('Go back error:', error);
    }
  }

  /**
   * Get current route name
   * 
   * Recursive resolver kullanarak nested state'lerde gerçek aktif ekranı bulur.
   */
  getCurrentRouteName(): string | undefined {
    if (!this.isReady()) {
      return undefined;
    }

    try {
      const state = this.navigationRef!.current!.getState();
      const activeRoute = this.getActiveRoute(state);
      return activeRoute?.name;
    } catch (error) {
      this.logger.error('Get current route error:', error);
      return undefined;
    }
  }

  /**
   * Get current route (name + params)
   * 
   * Recursive resolver kullanarak nested state'lerde gerçek aktif ekranı bulur.
   */
  getCurrentRoute(): { name?: string; params?: any } | undefined {
    if (!this.isReady()) {
      return undefined;
    }

    try {
      const state = this.navigationRef!.current!.getState();
      return this.getActiveRoute(state) || undefined;
    } catch (error) {
      this.logger.error('Get current route error:', error);
      return undefined;
    }
  }

  /**
   * Get navigation state
   * 
   * NavigationContainer dışındaki component'ler için navigation state'ine erişim sağlar.
   * Örnek: Custom drawer, overlay component'ler
   * 
   * @returns NavigationState | undefined
   */
  getNavigationState(): NavigationState | undefined {
    if (!this.isReady()) {
      return undefined;
    }

    try {
      return this.navigationRef!.current!.getState();
    } catch (error) {
      this.logger.error('Get navigation state error:', error);
      return undefined;
    }
  }

  /**
   * ARCHITECTURE FIX: Consume Pending Navigation Queue
   * Navigation ready olduğunda queue'daki tüm navigation'ları FIFO sırasıyla consume eder
   * 
   * Bu method NavigationContainer'ın onReady ve onStateChange event'lerinden çağrılır
   */
  consumePendingNavigationQueue(): void {
    if (!this.isReady()) {
      return;
    }

    if (this.pendingNavigationQueue.length === 0) {
      return;
    }


    // Queue'daki tüm navigation'ları FIFO sırasıyla consume et
    while (this.pendingNavigationQueue.length > 0) {
      const pending = this.pendingNavigationQueue.shift();
      if (pending) {
        // Navigate et (bu sefer ready olduğu için direkt execute edilir)
        this.navigate(pending.route as any, pending.params, pending.options);
      }
    }
  }

  /**
   * Clear pending navigation queue
   * Kullanıcı logout olduğunda veya navigation reset edildiğinde çağrılır
   */
  clearPendingNavigationQueue(): void {
    this.pendingNavigationQueue = [];
  }
}

// Singleton instance
export const navigationService = new NavigationService();
