import React, { useState, useCallback, useMemo } from 'react';
import { ReactNode } from 'react';
import { GlobalBottomSheetContextType, BottomSheetOptions } from '@/src/components/GlobalBottomSheet/types';
import { GlobalBottomSheet } from '@/src/components/GlobalBottomSheet';
import { GlobalBottomSheetContext } from '@/src/components/GlobalBottomSheet/context'; // ARCHITECTURE FIX: Import from context.ts to break circular dependency

interface GlobalBottomSheetProviderProps {
  children: ReactNode;
}

/**
 * Global Bottom Sheet Provider
 * Tüm bottom sheet'leri global olarak yönetir
 */
export const GlobalBottomSheetProvider: React.FC<GlobalBottomSheetProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [options, setOptions] = useState<BottomSheetOptions | null>(null);

  /**
   * Bottom sheet aç
   * PERFORMANCE FIX: Removed InteractionManager - instant opening
   * InteractionManager was causing 100-300ms delay, now opens instantly
   * FLICKER FIX: If bottom sheet is already open, just update content without closing
   * This prevents flicker and the open/close flicker issue
   */
  const openBottomSheet = useCallback((newContent: ReactNode, newOptions?: BottomSheetOptions) => {
    // FLICKER FIX: If bottom sheet is already open, just update content
    // This prevents the flicker issue where bottom sheet opens and closes quickly
    if (isOpen) {
      // Just update content and options, keep bottom sheet open
      // This provides smooth transition without closing/reopening
      setContent(newContent);
      setOptions(newOptions || null);
      // Keep isOpen as true - don't change it
    } else {
      // PERFORMANCE FIX: Instant opening - no InteractionManager delay
      // React 18 auto-batches these state updates
      // All updates happen in a single render cycle, no delay
      setContent(newContent);
      setOptions(newOptions || null);
      setIsOpen(true);
    }
  }, [isOpen]);

  /**
   * Bottom sheet kapat
   * PERFORMANCE FIX: Reduced cleanup delay from 300ms to 200ms
   * @gorhom/bottom-sheet animation is typically faster, 200ms is sufficient
   */
  const closeBottomSheet = useCallback(() => {
    setIsOpen(false);
    // PERFORMANCE FIX: Reduced delay for faster cleanup
    // @gorhom/bottom-sheet close animation is typically 200-250ms
    setTimeout(() => {
      setContent(null);
      setOptions(null);
    }, 200); // Reduced from 300ms to 200ms
  }, []);

  /**
   * Content güncelle (aynı bottom sheet içinde farklı content göstermek için)
   */
  const updateContent = useCallback((newContent: ReactNode) => {
    setContent(newContent);
  }, []);

  // Context value
  const contextValue = useMemo<GlobalBottomSheetContextType>(
    () => ({
      isOpen,
      content,
      options,
      openBottomSheet,
      closeBottomSheet,
      updateContent,
    }),
    [isOpen, content, options, openBottomSheet, closeBottomSheet, updateContent]
  );

  return (
    <GlobalBottomSheetContext.Provider value={contextValue}>
      {children}
      <GlobalBottomSheet />
    </GlobalBottomSheetContext.Provider>
  );
};

/**
 * ARCHITECTURE FIX: Context is now exported from context.ts
 * No need to export here to avoid circular dependency
 */

