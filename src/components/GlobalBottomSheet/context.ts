import { createContext } from 'react';
import { GlobalBottomSheetContextType } from './types';

/**
 * ARCHITECTURE FIX: Context extracted to separate file to break circular dependency
 * 
 * Circular dependency was:
 * - GlobalBottomSheetProvider.tsx imports GlobalBottomSheet/index.tsx
 * - GlobalBottomSheet/index.tsx imports GlobalBottomSheetContext from GlobalBottomSheetProvider.tsx
 * 
 * Solution: Extract context to separate file
 */
export const GlobalBottomSheetContext = createContext<GlobalBottomSheetContextType | undefined>(undefined);






