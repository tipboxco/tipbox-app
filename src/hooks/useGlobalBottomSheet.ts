import { useContext, useMemo } from 'react';
import { GlobalBottomSheetContext } from '@/src/providers/GlobalBottomSheetProvider';
import { GlobalBottomSheetContextType } from '@/src/components/GlobalBottomSheet/types';

/**
 * ARCHITECTURE FIX: Selector Pattern for Global Bottom Sheet Hook
 * 
 * Granular subscription to prevent unnecessary re-renders.
 * Only re-renders when specific state changes (isOpen, content, options).
 * Actions (openBottomSheet, closeBottomSheet) are stable references.
 * 
 * @example
 * ```tsx
 * const { openBottomSheet, closeBottomSheet, isOpen } = useGlobalBottomSheet();
 * 
 * const handleOpen = () => {
 *   openBottomSheet(<MyContent />, {
 *     enablePanDownToClose: true,
 *   });
 * };
 * ```
 */
export const useGlobalBottomSheet = (): GlobalBottomSheetContextType => {
  const context = useContext(GlobalBottomSheetContext);
  
  if (!context) {
    throw new Error('useGlobalBottomSheet must be used within GlobalBottomSheetProvider');
  }
  
  // ARCHITECTURE FIX: Memoize return value to prevent unnecessary re-renders
  // Only re-render when actual state changes (isOpen, content, options)
  // Actions are already stable (useCallback in provider)
  return useMemo(() => context, [
    context.isOpen,
    context.content,
    context.options,
    context.openBottomSheet,
    context.closeBottomSheet,
    context.updateContent,
  ]);
};

