import { navigationService } from '@/src/services/NavigationService';

/**
 * Back Stack Optimization Utilities
 * 
 * Twitter/X ve Instagram gibi yüksek performanslı uygulamalarda
 * detay ekranlarından (Profile, Post, vb.) geri dönerken back stack
 * optimizasyonu yapılır.
 * 
 * Bu utility, navigasyon geçmişini optimize etmek için kullanılır.
 */

/**
 * RootStack seviyesindeki detay ekranları
 * Bu ekranlar açıldığında Tab Bar ve Drawer otomatik arkada kalır
 */
export const ROOT_LEVEL_DETAIL_SCREENS = [
  'Profile',
  'Post',
  'Wallet',
  'Bookmarks',
  'Marketplace',
  'MessageDetail',
  'SupportMessageDetail',
  'Settings',
  'MoreSchoise',
] as const;

export type RootLevelDetailScreen = typeof ROOT_LEVEL_DETAIL_SCREENS[number];

/**
 * Detay ekranından geri dönerken back stack'i optimize et
 * 
 * Kullanım Senaryosu:
 * - Feed → Profile → Post → Profile (geri) → Feed'e dönmek istiyoruz
 * - Normalde: Feed → Profile → Post → Profile → Feed (tüm stack)
 * - Optimize: Feed → Profile → Post → Feed (Post'tan direkt Feed'e)
 * 
 * @param targetScreen - Geri dönülecek hedef ekran (default: 'App' - MainTabs)
 */
export const optimizeBackStack = (targetScreen: string = 'App'): void => {
  if (!navigationService.isReady()) {
    return;
  }

  try {
    const state = navigationService.getNavigationState();
    if (!state) {
      return;
    }

    // RootStack seviyesindeki detay ekranındayız
    const currentRoute = state.routes[state.index];
    if (!ROOT_LEVEL_DETAIL_SCREENS.includes(currentRoute.name as RootLevelDetailScreen)) {
      // Detay ekranında değiliz, optimizasyon gerekmez
      return;
    }

    // Back stack'te App (MainTabs) var mı kontrol et
    const appRouteIndex = state.routes.findIndex((route) => route.name === targetScreen);
    if (appRouteIndex === -1) {
      // App route yok, normal back yap
      navigationService.goBack();
      return;
    }

    // App route'dan sonraki tüm detay ekranlarını atla
    // Sadece App route'a kadar olan stack'i koru
    const optimizedRoutes = state.routes.slice(0, appRouteIndex + 1);
    
    // Navigation'ı reset et (back stack optimizasyonu)
    navigationService.reset(targetScreen, undefined);
  } catch (error) {
    console.error('[BackStackOptimization] Error optimizing back stack:', error);
    // Hata durumunda normal back yap
    navigationService.goBack();
  }
};

/**
 * Detay ekranından MainTabs'a (Feed) geri dön
 * 
 * Kullanım: Profile ekranından Feed'e dönmek istediğinizde
 */
export const navigateBackToMainTabs = (): void => {
  optimizeBackStack('App');
};
