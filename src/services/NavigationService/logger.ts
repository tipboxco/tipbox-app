import type { NavigationLogger } from './types';

/**
 * Production-safe logger
 * 
 * Development'ta console.log, production'da sadece error/warn.
 */
export const navigationLogger: NavigationLogger = {
  debug: (...args: any[]) => {
    if (__DEV__) {
      console.log('[NavigationService]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (__DEV__) {
      console.warn('[NavigationService] ⚠️', ...args);
    }
  },
  
  error: (...args: any[]) => {
    // Error'lar her zaman loglanır (production'da da)
    console.error('[NavigationService] ❌', ...args);
  },
  
  log: (...args: any[]) => {
    if (__DEV__) {
      console.log('[NavigationService] ✅', ...args);
    }
  },
};

