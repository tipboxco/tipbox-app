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
        // PERFORMANCE FIX: console.log kaldırıldı - gereksiz işlem
        setIsEnabled(false);
        return;
      }

      const state = navigationService.getNavigationState() as any;
      if (!state) {
        // PERFORMANCE FIX: console.log kaldırıldı
        setIsEnabled(false);
        return;
      }

      // Root stack'te hangi route aktif?
      const currentRoute = state.routes[state.index];
      if (!currentRoute) {
        // PERFORMANCE FIX: console.log kaldırıldı
        setIsEnabled(false);
        return;
      }

      // App (AppDrawerNavigator) içindeyiz mi?
      // CRITICAL: RootStack seviyesindeki detay ekranlarında (Profile, Post, vb.) drawer gesture KAPALI
      // Bu ekranlar: Profile, Post, Wallet, Bookmarks, Marketplace, MessageDetail, SupportMessageDetail, Settings, MoreSchoise
      const ROOT_LEVEL_DETAIL_SCREENS = [
        'Profile',
        'Post',
        'Wallet',
        'Bookmarks',
        'Marketplace',
        'MessageDetail',
        'SupportMessageDetail',
        'Settings',
        'MoreSchoise',
      ];
      
      if (ROOT_LEVEL_DETAIL_SCREENS.includes(currentRoute.name)) {
        // RootStack seviyesindeki detay ekranındayız - drawer gesture KAPALI
        setIsEnabled(false);
        return;
      }
      
      if (currentRoute.name !== 'App') {
        // PERFORMANCE FIX: console.log kaldırıldı
        setIsEnabled(false);
        return;
      }

      // App'ın state'i var mı? (DrawerNavigator state)
      const appState = currentRoute.state;
      if (!appState || !appState.routes) {
        // PERFORMANCE FIX: console.log kaldırıldı
        setIsEnabled(false);
        return;
      }

      // DrawerNavigator içinde MainTabs var mı?
      const drawerRoute = appState.routes[appState.index];
      if (!drawerRoute || drawerRoute.name !== 'MainTabs') {
        // PERFORMANCE FIX: console.log kaldırıldı
        setIsEnabled(false);
        return;
      }

      // MainTabs'ın state'i var mı? (TabNavigator state)
      const mainTabsState = drawerRoute.state;
      if (!mainTabsState || !mainTabsState.routes) {
        // PERFORMANCE FIX: console.log kaldırıldı
        setIsEnabled(false);
        return;
      }

      // Aktif tab hangisi?
      const activeTabIndex = mainTabsState.index;
      const activeTabRoute = mainTabsState.routes[activeTabIndex];
      if (!activeTabRoute) {
        // PERFORMANCE FIX: console.log kaldırıldı
        setIsEnabled(false);
        return;
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
      
      // PERFORMANCE FIX: Tüm console.log'lar kaldırıldı - gereksiz işlemler
      
      // State yoksa veya route'lar yoksa, muhtemelen ilk mount - index 0 kabul et
      // Tab navigator'da state her zaman olmayabilir, bu durumda drawer'ı enable et
      if (!tabStackState || !tabStackState.routes || tabStackState.routes.length === 0) {
        setIsEnabled(true);
        return;
      }

      // FeatureStack seviyesi: Tab stack'inin index'i 0 mı?
      const featureStackIndex = tabStackState.index ?? 0;
      
      if (featureStackIndex !== 0) {
        // FeatureStack içinde başka ekran açılmış - drawer gesture kapalı
        setIsEnabled(false);
        return;
      }

      // FeatureStack index 0 - şimdi FeedNavigator seviyesini kontrol et
      const featureStackRoute = tabStackState.routes[featureStackIndex];
      if (!featureStackRoute) {
        setIsEnabled(true);
        return;
      }

      if (!featureStackRoute.state) {
        // State yoksa, muhtemelen ilk mount - index 0 kabul et
        setIsEnabled(true);
        return;
      }

      // FeedNavigator seviyesi: Navigator stack'inin index'i 0 mı?
      const navigatorStackState = featureStackRoute.state;
      if (!navigatorStackState || !navigatorStackState.routes) {
        // State yoksa, muhtemelen ilk mount - index 0 kabul et
        setIsEnabled(true);
        return;
      }

      const navigatorStackIndex = navigatorStackState.index ?? 0;
      
      if (navigatorStackIndex !== 0) {
        // Navigator stack içinde başka ekran açılmış (ör: ReviewDetail) - drawer gesture kapalı
        setIsEnabled(false);
        return;
      }

      // Her iki seviye de index 0 - drawer gesture açık
      setIsEnabled(true);
    } catch (error) {
      // Navigation state okunamazsa güvenli tarafta kal (drawer gesture kapalı)
      // PERFORMANCE FIX: console.warn kaldırıldı - gereksiz işlem
      setIsEnabled(false);
    }
  }, []);

  useEffect(() => {
    // İlk kontrol
    checkGestureEnabled();

    // ✅ CRITICAL PERFORMANCE FIX: Interval süresini artır ve sadece gerektiğinde kontrol et
    // Navigation state değişiklikleri çok sık olmaz, 1000ms yeterli
    // TODO: NavigationService'e state change listener eklenebilir (daha iyi performans)
    const interval = setInterval(() => {
      checkGestureEnabled();
    }, 1000); // Her 1000ms'de kontrol et (500ms'den 1000ms'ye çıkarıldı - daha az re-render)

    return () => clearInterval(interval);
  }, [checkGestureEnabled]);

  return isEnabled;
};

