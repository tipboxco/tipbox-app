import { useEffect, useState, useCallback } from 'react';
import { navigationService } from '@/src/services/NavigationService';

/**
 * useDrawerGestureEnabled Hook
 * 
 * CRITICAL RULE: Drawer gesture sadece root tab ekranlarında ve stack index 0'da aktif olmalı.
 * Stack depth === 0 kontrolü ile back gesture çakışmasını önler.
 * 
 * Twitter/Instagram kuralı:
 * - Drawer sadece root tab ekranlarında swipe ile açılır
 * - İç stack'lerde swipe drawer KAPALI (back gesture öncelikli)
 * - Sadece Feed, Explore, Catalog, Events, Notifications, Inbox tab'larının 0. index'inde açılır
 * 
 * CRITICAL: NavigationService kullan - NavigationContainer dışında olduğumuz için useNavigation() çalışmaz
 * 
 * PERFORMANCE: Her navigation state değişikliğinde kontrol eder
 * 
 * @returns boolean - Drawer gesture enabled olup olmadığı
 */
export const useDrawerGestureEnabled = (): boolean => {
  const [isEnabled, setIsEnabled] = useState(false);

  // Drawer gesture'ın açık olabileceği tab stack'ler
  const DRAWER_ENABLED_TABS = [
    'FeedStack',
    'ExploreStack',
    'CatalogStack',
    'EventsStack',
    'NotificationStack',
    'InboxStack',
  ];

  const checkGestureEnabled = useCallback(() => {
    try {
      if (!navigationService.isReady()) {
        if (__DEV__) {
          console.log('[useDrawerGestureEnabled] Navigation not ready');
        }
        setIsEnabled(false);
        return;
      }

      const state = navigationService.getNavigationState() as any;
      if (!state) {
        if (__DEV__) {
          console.log('[useDrawerGestureEnabled] No navigation state');
        }
        setIsEnabled(false);
        return;
      }

      // Root stack'te hangi route aktif?
      const currentRoute = state.routes[state.index];
      if (!currentRoute) {
        if (__DEV__) {
          console.log('[useDrawerGestureEnabled] No current route');
        }
        setIsEnabled(false);
        return;
      }

      if (__DEV__) {
        console.log('[useDrawerGestureEnabled] Current route:', currentRoute.name);
      }

      // App (AppDrawerNavigator) içindeyiz mi?
      if (currentRoute.name !== 'App') {
        if (__DEV__) {
          console.log('[useDrawerGestureEnabled] Not in App, current:', currentRoute.name);
        }
        setIsEnabled(false);
        return;
      }

      // App'ın state'i var mı? (DrawerNavigator state)
      const appState = currentRoute.state;
      if (!appState || !appState.routes) {
        if (__DEV__) {
          console.log('[useDrawerGestureEnabled] No App state or routes');
        }
        setIsEnabled(false);
        return;
      }

      // DrawerNavigator içinde MainTabs var mı?
      const drawerRoute = appState.routes[appState.index];
      if (!drawerRoute || drawerRoute.name !== 'MainTabs') {
        if (__DEV__) {
          console.log('[useDrawerGestureEnabled] No MainTabs in drawer, route:', drawerRoute?.name);
        }
        setIsEnabled(false);
        return;
      }

      // MainTabs'ın state'i var mı? (TabNavigator state)
      const mainTabsState = drawerRoute.state;
      if (!mainTabsState || !mainTabsState.routes) {
        if (__DEV__) {
          console.log('[useDrawerGestureEnabled] No MainTabs state or routes');
        }
        setIsEnabled(false);
        return;
      }

      // Aktif tab hangisi?
      const activeTabIndex = mainTabsState.index;
      const activeTabRoute = mainTabsState.routes[activeTabIndex];
      if (!activeTabRoute) {
        if (__DEV__) {
          console.log('[useDrawerGestureEnabled] No active tab route at index:', activeTabIndex);
        }
        setIsEnabled(false);
        return;
      }

      if (__DEV__) {
        console.log('[useDrawerGestureEnabled] Active tab:', activeTabRoute.name, 'index:', activeTabIndex);
        console.log('[useDrawerGestureEnabled] Active tab route keys:', Object.keys(activeTabRoute));
        console.log('[useDrawerGestureEnabled] Active tab route.state exists:', !!activeTabRoute.state);
        if (activeTabRoute.state) {
          console.log('[useDrawerGestureEnabled] Active tab route.state keys:', Object.keys(activeTabRoute.state));
        }
      }

      // Aktif tab drawer'ı destekliyor mu?
      if (!DRAWER_ENABLED_TABS.includes(activeTabRoute.name)) {
        if (__DEV__) {
          console.log('[useDrawerGestureEnabled] Tab not in DRAWER_ENABLED_TABS:', activeTabRoute.name);
        }
        setIsEnabled(false);
        return;
      }

      // CRITICAL: Tab stack'inin state'ini kontrol et
      // React Navigation'da tab navigator state'i farklı yapıda olabilir
      const tabStackState = activeTabRoute.state;
      
      if (__DEV__) {
        console.log('[useDrawerGestureEnabled] Tab stack state exists:', !!tabStackState);
        if (tabStackState) {
          console.log('[useDrawerGestureEnabled] Tab stack state keys:', Object.keys(tabStackState));
          console.log('[useDrawerGestureEnabled] Tab stack index:', tabStackState.index);
          console.log('[useDrawerGestureEnabled] Tab stack routes count:', tabStackState.routes?.length);
        }
      }
      
      // State yoksa veya route'lar yoksa, muhtemelen ilk mount - index 0 kabul et
      // Tab navigator'da state her zaman olmayabilir, bu durumda drawer'ı enable et
      if (!tabStackState || !tabStackState.routes || tabStackState.routes.length === 0) {
        if (__DEV__) {
          console.log('[useDrawerGestureEnabled] No tab stack state or empty routes, enabling (assuming index 0)');
        }
        setIsEnabled(true);
        return;
      }

      // FeatureStack seviyesi: Tab stack'inin index'i 0 mı?
      const featureStackIndex = tabStackState.index ?? 0;
      if (__DEV__) {
        console.log('[useDrawerGestureEnabled] FeatureStack index:', featureStackIndex);
      }
      
      if (featureStackIndex !== 0) {
        // FeatureStack içinde başka ekran açılmış - drawer gesture kapalı
        if (__DEV__) {
          console.log('[useDrawerGestureEnabled] FeatureStack index !== 0, disabling');
        }
        setIsEnabled(false);
        return;
      }

      // FeatureStack index 0 - şimdi FeedNavigator seviyesini kontrol et
      const featureStackRoute = tabStackState.routes[featureStackIndex];
      if (!featureStackRoute) {
        if (__DEV__) {
          console.log('[useDrawerGestureEnabled] No feature stack route at index:', featureStackIndex);
        }
        setIsEnabled(true);
        return;
      }

      if (__DEV__) {
        console.log('[useDrawerGestureEnabled] Feature stack route:', featureStackRoute.name);
        console.log('[useDrawerGestureEnabled] Feature stack route state exists:', !!featureStackRoute.state);
      }

      if (!featureStackRoute.state) {
        // State yoksa, muhtemelen ilk mount - index 0 kabul et
        if (__DEV__) {
          console.log('[useDrawerGestureEnabled] No feature stack route state, enabling (assuming index 0)');
        }
        setIsEnabled(true);
        return;
      }

      // FeedNavigator seviyesi: Navigator stack'inin index'i 0 mı?
      const navigatorStackState = featureStackRoute.state;
      if (!navigatorStackState || !navigatorStackState.routes) {
        // State yoksa, muhtemelen ilk mount - index 0 kabul et
        if (__DEV__) {
          console.log('[useDrawerGestureEnabled] No navigator stack state, enabling (assuming index 0)');
        }
        setIsEnabled(true);
        return;
      }

      const navigatorStackIndex = navigatorStackState.index ?? 0;
      if (__DEV__) {
        console.log('[useDrawerGestureEnabled] Navigator stack index:', navigatorStackIndex);
        console.log('[useDrawerGestureEnabled] Navigator stack routes:', navigatorStackState.routes.map((r: any) => r.name));
      }
      
      if (navigatorStackIndex !== 0) {
        // Navigator stack içinde başka ekran açılmış (ör: ReviewDetail) - drawer gesture kapalı
        if (__DEV__) {
          console.log('[useDrawerGestureEnabled] Navigator stack index !== 0, disabling');
        }
        setIsEnabled(false);
        return;
      }

      // Her iki seviye de index 0 - drawer gesture açık
      if (__DEV__) {
        console.log('[useDrawerGestureEnabled] ✅ All checks passed, ENABLING drawer gesture');
      }
      setIsEnabled(true);
    } catch (error) {
      // Navigation state okunamazsa güvenli tarafta kal (drawer gesture kapalı)
      if (__DEV__) {
        console.warn('[useDrawerGestureEnabled] Error reading navigation state:', error);
      }
      setIsEnabled(false);
    }
  }, []);

  useEffect(() => {
    // İlk kontrol
    checkGestureEnabled();

    // PERFORMANCE FIX: Interval süresini artır - gereksiz re-render'ları azalt
    // Navigation state değişiklikleri çok sık olmaz, 500ms yeterli
    // TODO: NavigationService'e state change listener eklenebilir
    const interval = setInterval(() => {
      checkGestureEnabled();
    }, 500); // Her 500ms'de kontrol et (200ms'den 500ms'ye çıkarıldı - performans iyileştirmesi)

    return () => clearInterval(interval);
  }, [checkGestureEnabled]);

  return isEnabled;
};

