import { navigationService } from '@/src/services/NavigationService';
import type { RootStackParamList } from '@/src/navigation/types/root.types';
import { ROOT_LEVEL_DETAIL_SCREENS } from './backStackOptimization';

/**
 * Shared Screen Navigation Utilities
 * 
 * Instagram/TikTok Pattern: Shared screens (Profile, MessageDetail, Settings, vb.)
 * birden fazla yerden çağrılabilir. Bu utility, stack buildup'ı önlemek için
 * akıllı navigation stratejileri sağlar.
 * 
 * Stratejiler:
 * 1. Replace Pattern: Eğer aynı ekran stack'te varsa, replace et
 * 2. Stack Pruning: Derin navigasyonlarda (3+ seviye) gereksiz ekranları temizle
 * 3. Smart Navigate: Stack'te varsa oraya dön, yoksa yeni ekle
 */

/**
 * Shared screen'ler - Bu ekranlar birden fazla yerden çağrılabilir
 */
export const SHARED_SCREENS = [
  'Profile',
  'Post',
  'MessageDetail',
  'SupportMessageDetail',
  'Settings',
  'Wallet',
  'Bookmarks',
  'Marketplace',
  'Event',
  'CollectionDetail',
] as const;

export type SharedScreen = typeof SHARED_SCREENS[number];

/**
 * Stack pruning threshold - Bu derinlikten sonra otomatik temizlik yapılır
 */
const STACK_PRUNING_THRESHOLD = 5;

/**
 * Instagram Pattern: Smart Navigate to Shared Screen
 * 
 * Eğer ekran stack'te varsa oraya geri döner (navigate),
 * yoksa yeni ekran ekler (push).
 * 
 * Ancak stack derinliği threshold'u geçerse, replace kullanarak
 * stack'i optimize eder.
 * 
 * @param routeName - Shared screen route name
 * @param params - Route params
 * @param options - Navigation options
 */
export function navigateToSharedScreen<RouteName extends keyof RootStackParamList>(
  routeName: RouteName,
  params?: RootStackParamList[RouteName],
  options?: {
    forceReplace?: boolean; // Zorla replace kullan
    maxStackDepth?: number; // Maksimum stack derinliği (default: STACK_PRUNING_THRESHOLD)
  }
): void {
  if (!navigationService.isReady()) {
    return;
  }

  // Shared screen değilse normal navigate kullan
  if (!SHARED_SCREENS.includes(routeName as SharedScreen)) {
    navigationService.navigate(routeName, params);
    return;
  }

  const stackDepth = navigationService.getStackDepth();
  const maxDepth = options?.maxStackDepth || STACK_PRUNING_THRESHOLD;

  // Stack derinliği threshold'u geçtiyse veya forceReplace true ise, replace kullan
  if (options?.forceReplace || stackDepth >= maxDepth) {
    navigationService.replace(routeName, params);
    return;
  }

  // Stack'te aynı ekran var mı kontrol et
  const existingIndex = navigationService.findRouteInStack(routeName as string);

  if (existingIndex !== -1) {
    // Stack'te var - oraya geri dön (navigate)
    // Ancak params farklıysa replace kullan (yeni içerik için)
    const currentState = navigationService.getNavigationState();
    if (currentState) {
      const existingRoute = currentState.routes[existingIndex];
      const existingParams = (existingRoute as any)?.params;
      
      // Params karşılaştırması (basit deep equality check)
      const paramsChanged = JSON.stringify(existingParams) !== JSON.stringify(params);
      
      if (paramsChanged) {
        // Params değişti, replace kullan
        navigationService.replace(routeName, params);
      } else {
        // Aynı params, oraya geri dön
        navigationService.navigate(routeName, params);
      }
    } else {
      navigationService.navigate(routeName, params);
    }
  } else {
    // Stack'te yok - yeni ekran ekle (navigate - push gibi davranır)
    // Native Stack Navigator'da push yok, navigate kullanıyoruz
    navigationService.navigate(routeName, params);
  }
}

/**
 * Stack Pruning: Derin navigasyonlarda gereksiz ekranları temizle
 * 
 * Instagram Pattern: Profile → MessageDetail → Settings → Wallet gibi
 * derin navigasyonlarda, geri dönüş yolunu optimize etmek için
 * aradaki gereksiz ekranları temizler.
 * 
 * Strateji:
 * - App (base) ekranını koru
 * - Son 2-3 ekranı koru (kullanıcı deneyimi için)
 * - Aradaki ekranları temizle
 * 
 * @param keepLastN - Son N ekranı koru (default: 2)
 */
export function pruneNavigationStack(keepLastN: number = 2): void {
  if (!navigationService.isReady()) {
    return;
  }

  try {
    const state = navigationService.getNavigationState();
    if (!state || !state.routes) {
      return;
    }

    const stackDepth = state.routes.length;
    
    // Stack derinliği threshold'dan küçükse pruning gerekmez
    if (stackDepth <= STACK_PRUNING_THRESHOLD) {
      return;
    }

    // App (base) ekranını bul
    const appIndex = state.routes.findIndex((route) => route.name === 'App');
    
    if (appIndex === -1) {
      // App yok, pruning yapamayız
      return;
    }

    // Son N ekranı koru
    const lastN = Math.min(keepLastN, stackDepth - appIndex - 1);
    const keepFromIndex = stackDepth - lastN;

    // App'ten son N ekranı koru, aradakileri temizle
    const optimizedRoutes = [
      ...state.routes.slice(0, appIndex + 1), // App ve öncesi
      ...state.routes.slice(keepFromIndex), // Son N ekran
    ];

    // Navigation'ı reset et (optimized routes ile)
    navigationService.reset(
      optimizedRoutes[optimizedRoutes.length - 1].name as keyof RootStackParamList,
      (optimizedRoutes[optimizedRoutes.length - 1] as any)?.params
    );
  } catch (error) {
    console.error('[SharedScreenNavigation] Stack pruning error:', error);
  }
}

/**
 * Navigate to shared screen with automatic stack pruning
 * 
 * Bu fonksiyon, navigateToSharedScreen + pruneNavigationStack'i
 * birleştirir. Stack derinliği threshold'u geçtiğinde otomatik
 * pruning yapar.
 * 
 * @param routeName - Shared screen route name
 * @param params - Route params
 * @param options - Navigation options
 */
export function navigateToSharedScreenWithPruning<RouteName extends keyof RootStackParamList>(
  routeName: RouteName,
  params?: RootStackParamList[RouteName],
  options?: {
    forceReplace?: boolean;
    maxStackDepth?: number;
    autoPrune?: boolean; // Otomatik pruning yap (default: true)
  }
): void {
  const autoPrune = options?.autoPrune !== false; // Default: true

  // Önce normal navigation yap
  navigateToSharedScreen(routeName, params, {
    forceReplace: options?.forceReplace,
    maxStackDepth: options?.maxStackDepth,
  });

  // Stack derinliği kontrolü ve otomatik pruning
  if (autoPrune) {
    setTimeout(() => {
      const stackDepth = navigationService.getStackDepth();
      const maxDepth = options?.maxStackDepth || STACK_PRUNING_THRESHOLD;
      
      if (stackDepth > maxDepth) {
        pruneNavigationStack(2); // Son 2 ekranı koru
      }
    }, 100); // Navigation tamamlandıktan sonra pruning yap
  }
}
