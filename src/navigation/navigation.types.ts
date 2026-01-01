/**
 * Navigation Types - Legacy Export
 * 
 * Bu dosya backward compatibility için korunuyor.
 * Yeni kod için şu dosyaları kullanın:
 * - src/navigation/types/root.types.ts
 * - src/navigation/types/main.types.ts
 * - src/navigation/types/tab.types.ts
 */

// Re-export new type definitions
export type { RootStackParamList } from './types/root.types';
export type { MainStackParamList } from './types/main.types';
export type { TabParamList } from './types/tab.types';

// Legacy exports (deprecated - use types/root.types.ts instead)
export type { RootStackParamList as RootStackParamListLegacy } from './types/root.types';
export type { MainStackParamList as MainStackParamListLegacy } from './types/main.types';