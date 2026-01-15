
/**
 * Production-safe logger
 * 
 * Development'ta console.log, production'da sadece error/warn.
 */
export const navigationLogger = {
  debug: (...args: any[]) => {
    // Logs disabled
  },
  
  warn: (...args: any[]) => {
    // Logs disabled
  },
  
  error: (...args: any[]) => {
    // Logs disabled
  },
  
  log: (...args: any[]) => {
    // Logs disabled
  },
};

