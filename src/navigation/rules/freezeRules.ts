/**
 * Navigation Freeze Rules
 * 
 * Production-grade navigation kuralları:
 * - Hangi ekran ne zaman render edilir / durdurulur?
 * - Memory leak'leri önlemek için katı kurallar
 * 
 * Twitter/Instagram seviyesinde akışkanlık için:
 * - Feed: always mounted (scroll position korunur)
 * - Tab root: mounted (state korunur)
 * - Stack detail: unmountOnBlur (memory efficient)
 * - Modal: unmount (temporary UI)
 * - Overlay: freeze background (context-free)
 */

export type ScreenType = 
  | 'feed'           // Feed ekranı - always mounted
  | 'tab-root'       // Tab root ekranları - mounted
  | 'stack-detail'   // Stack detail ekranları - unmountOnBlur
  | 'modal'          // Modal ekranlar - unmount
  | 'overlay';       // Overlay ekranlar - freeze background

export interface FreezeRule {
  unmountOnBlur: boolean;
  freezeOnBlur: boolean;
  lazy: boolean;
}

/**
 * Screen type'a göre freeze rule döndürür
 */
export const getFreezeRule = (screenType: ScreenType): FreezeRule => {
  switch (screenType) {
    case 'feed':
      // Feed: always mounted - scroll position korunur
      return {
        unmountOnBlur: false,
        freezeOnBlur: false,
        lazy: false,
      };
    
    case 'tab-root':
      // Tab root: mounted - state korunur
      return {
        unmountOnBlur: false,
        freezeOnBlur: false,
        lazy: true, // Lazy loading için
      };
    
    case 'stack-detail':
      // Stack detail: unmountOnBlur - memory efficient
      return {
        unmountOnBlur: true,
        freezeOnBlur: false,
        lazy: true,
      };
    
    case 'modal':
      // Modal: unmount - temporary UI
      return {
        unmountOnBlur: true,
        freezeOnBlur: false,
        lazy: true,
      };
    
    case 'overlay':
      // Overlay: freeze background - context-free
      return {
        unmountOnBlur: false,
        freezeOnBlur: true,
        lazy: true,
      };
    
    default:
      // Default: safe option (unmount on blur)
      return {
        unmountOnBlur: true,
        freezeOnBlur: false,
        lazy: true,
      };
  }
};

/**
 * Heavy tab'ler için özel freeze rule
 * Catalog, Events gibi ağır tab'lerde freezeOnBlur kullanılır
 */
export const getHeavyTabFreezeRule = (): FreezeRule => {
  return {
    unmountOnBlur: false,
    freezeOnBlur: true, // Heavy tab'lerde freeze
    lazy: true,
  };
};

