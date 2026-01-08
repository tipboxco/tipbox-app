/**
 * Performance-optimized logger utility
 * Production ortamında console.log'ları devre dışı bırakır
 * Development ortamında normal çalışır
 */

// __DEV__ React Native'de built-in olarak mevcut
declare const __DEV__: boolean;

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LoggerConfig {
  enableInProduction: boolean;
  enabledLevels: LogLevel[];
}

const defaultConfig: LoggerConfig = {
  enableInProduction: false,
  enabledLevels: ['log', 'info', 'warn', 'error', 'debug'],
};

let config = { ...defaultConfig };

/**
 * Logger configuration
 */
export const configureLogger = (newConfig: Partial<LoggerConfig>) => {
  config = { ...config, ...newConfig };
};

/**
 * Check if logging should be enabled
 */
const shouldLog = (level: LogLevel): boolean => {
  // Production'da sadece enableInProduction true ise log al
  if (!__DEV__ && !config.enableInProduction) {
    return false;
  }
  return config.enabledLevels.includes(level);
};

/**
 * Performance-optimized logger
 * Production'da hiçbir işlem yapmaz (string interpolation bile olmaz)
 */
export const logger = {
  log: (...args: unknown[]) => {
    if (shouldLog('log')) {
      console.log(...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (shouldLog('info')) {
      console.info(...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) {
      console.warn(...args);
    }
  },
  
  error: (...args: unknown[]) => {
    if (shouldLog('error')) {
      console.error(...args);
    }
  },
  
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) {
      console.debug(...args);
    }
  },
  
  /**
   * Conditional logging - sadece condition true ise log alır
   * Performanslı: condition false ise argümanlar evaluate edilmez
   */
  logIf: (condition: boolean, ...args: unknown[]) => {
    if (condition && shouldLog('log')) {
      console.log(...args);
    }
  },
  
  /**
   * Performance timing - sadece development'da çalışır
   */
  time: (label: string) => {
    if (__DEV__) {
      console.time(label);
    }
  },
  
  timeEnd: (label: string) => {
    if (__DEV__) {
      console.timeEnd(label);
    }
  },
  
  /**
   * Group logging
   */
  group: (label: string) => {
    if (__DEV__) {
      console.group(label);
    }
  },
  
  groupEnd: () => {
    if (__DEV__) {
      console.groupEnd();
    }
  },
};

/**
 * No-op logger for production - tamamen boş fonksiyonlar
 * Tree-shaking ile production build'den tamamen kaldırılabilir
 */
export const noop = () => {};

export default logger;

