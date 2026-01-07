
/**
 * Production-safe logger
 * 
 * Development'ta console.log, production'da sadece error/warn.
 */
export const navigationLogger = {
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[NavigationService]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[NavigationService] ⚠️', ...args);
    }
  },
  
  error: (...args: any[]) => {
    // Error'lar her zaman loglanır (production'da da)
    console.error('[NavigationService] ❌', ...args);
  },
  
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[NavigationService] ✅', ...args);
    }
  },
};

