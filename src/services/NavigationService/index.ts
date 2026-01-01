import React from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '@/src/navigation/types/root.types';
import type { MainStackParamList } from '@/src/navigation/types/main.types';

/**
 * NavigationService
 * 
 * Type-safe merkezi navigation servisi.
 * UI bağlamından bağımsız navigation için tek giriş noktası.
 * 
 * Özellikler:
 * - Type-safe navigation (compile-time kontrol)
 * - Generic methods ile yanlış route/param engelleme
 * - Navigation ref kontrolü (isReady check)
 * - Error handling ve logging
 * 
 * Kullanım:
 * ```typescript
 * navigationService.navigate(ROOT_ROUTES.POST, { screen: 'PostDetailScreen', params: { ... } });
 * navigationService.navigateNested(TAB_ROUTES.FEED, 'FeedScreen', {});
 * ```
 */
class NavigationService {
  private navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList>> | null = null;

  /**
   * Navigation ref'i set et
   * NavigationProvider tarafından çağrılır
   */
  setNavigationRef(ref: React.RefObject<NavigationContainerRef<RootStackParamList>>): void {
    this.navigationRef = ref;
  }

  /**
   * Navigation ref hazır mı kontrol et (public)
   */
  isReady(): boolean {
    if (!this.navigationRef?.current) {
      console.warn('[NavigationService] ⚠️ Navigation ref is not set');
      return false;
    }

    if (!this.navigationRef.current.isReady()) {
      console.warn('[NavigationService] ⚠️ Navigation is not ready yet');
      return false;
    }

    return true;
  }

  /**
   * Type-safe root navigation
   * 
   * Sadece RootStackParamList'teki route'ları kabul eder.
   * Compile-time'da type kontrolü yapılır.
   * 
   * Safety Check: Kullanıcı kritik ekrandayken navigation defer edilir.
   * 
   * @param routeName - Root route name (RootStackParamList key)
   * @param params - Route params (type-safe)
   * @param options - Navigation options (priority, force, vb.)
   * 
   * @example
   * ```typescript
   * navigationService.navigate(ROOT_ROUTES.POST, {
   *   screen: 'PostDetailScreen',
   *   params: { postData, type: 'post' }
   * });
   * ```
   */
  navigate<RouteName extends keyof RootStackParamList>(
    routeName: RouteName,
    params?: RootStackParamList[RouteName],
    options?: {
      priority?: 'high' | 'normal' | 'low';
      force?: boolean; // Kullanıcı busy olsa bile navigate et
    }
  ): void {
    if (!this.isReady()) {
      return;
    }

    // Safety Check - App State Awareness
    // Kullanıcı kritik ekrandayken (form, ödeme vb.) navigation'ı defer et
    if (!options?.force) {
      const { useAppStore } = require('@/src/store/appStore');
      const appState = useAppStore.getState();
      
      if (appState.isUserBusy) {
        // High priority navigation'lar (ör: acil bildirimler) yine de navigate edebilir
        if (options?.priority !== 'high') {
          console.warn('[NavigationService] ⏳ User is busy, navigation deferred:', {
            route: routeName,
            reason: appState.busyReason,
            priority: options?.priority || 'normal',
          });
          
          // Pending navigation'a yaz
          const { useNotificationStore } = require('@/src/store/notificationStore');
          const notificationStore = useNotificationStore.getState();
          notificationStore.setPendingNavigation({
            route: routeName as string,
            params,
          });
          
          return;
        }
      }
    }

    try {
      // Type assertion: React Navigation's type system doesn't fully support generic navigation
      // This is safe because we validate routeName is a keyof RootStackParamList
      (this.navigationRef!.current!.navigate as any)(routeName, params);
      console.log('[NavigationService] ✅ Navigated to:', routeName, params);
    } catch (error) {
      console.error('[NavigationService] ❌ Navigation error:', error);
      console.error('[NavigationService] Route:', routeName, 'Params:', params);
    }
  }

  /**
   * Nested navigation (Tab → Feature)
   * 
   * Tab içindeki feature screen'lere navigate etmek için.
   * 
   * @param tabName - Tab route name (MainStackParamList key)
   * @param screenName - Feature screen name
   * @param params - Screen params
   * 
   * @example
   * ```typescript
   * navigationService.navigateNested(TAB_ROUTES.FEED, 'FeedScreen', {});
   * ```
   */
  navigateNested<
    TabName extends keyof MainStackParamList,
    ScreenName extends keyof MainStackParamList[TabName]
  >(
    tabName: TabName,
    screenName: ScreenName,
    params?: MainStackParamList[TabName][ScreenName]
  ): void {
    if (!this.isReady()) {
      return;
    }

    try {
      // Nested navigation: MainDrawer → Tabs → Tab → Feature Screen
      // Use any for nested navigation params (React Navigation limitation)
      const navigationParams: any = {
        screen: 'Tabs',
        params: {
          screen: tabName,
          params: {
            screen: screenName,
            params: params,
          },
        },
      };
      
      // Type assertion: React Navigation's type system doesn't fully support nested navigation
      (this.navigationRef!.current!.navigate as any)('MainDrawer', navigationParams);
      console.log('[NavigationService] ✅ Navigated nested:', tabName, screenName, params);
    } catch (error) {
      console.error('[NavigationService] ❌ Nested navigation error:', error);
      console.error('[NavigationService] Tab:', tabName, 'Screen:', screenName, 'Params:', params);
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
      console.log('[NavigationService] ✅ Reset navigation to:', routeName);
    } catch (error) {
      console.error('[NavigationService] ❌ Reset navigation error:', error);
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
        console.log('[NavigationService] ✅ Went back');
    } else {
      console.warn('[NavigationService] ⚠️ Cannot go back - no previous screen');
    }
    } catch (error) {
      console.error('[NavigationService] ❌ Go back error:', error);
    }
  }

  /**
   * Get current route name
   */
  getCurrentRouteName(): string | undefined {
    if (!this.isReady()) {
      return undefined;
    }

    try {
      const state = this.navigationRef!.current!.getState();
      return state?.routes[state.index]?.name;
    } catch (error) {
      console.error('[NavigationService] ❌ Get current route error:', error);
      return undefined;
    }
  }
}

// Singleton instance
export const navigationService = new NavigationService();

