import React, { useState, useCallback, useMemo } from 'react';
import { ReactNode } from 'react';
import { GlobalBottomSheetContextType, BottomSheetOptions, BottomSheetState } from '@/src/components/GlobalBottomSheet/types';
import { GlobalBottomSheetContext } from '@/src/components/GlobalBottomSheet/context';

interface GlobalBottomSheetProviderProps {
  children: ReactNode;
}

/**
 * Global Bottom Sheet Provider
 * DOĞRU MİMARİ: Sadece state ve basit actions
 */
export const GlobalBottomSheetProvider: React.FC<GlobalBottomSheetProviderProps> = ({ children }) => {
  const [state, setState] = useState<BottomSheetState>({
    content: null,
    index: -1, // -1 closed, 0 open
    options: null,
  });

  /**
   * Bottom sheet aç
   * STABİL FIX: Eğer sheet zaten açıksa, önce kapat sonra aç (content değişikliği için)
   */
  const openBottomSheet = useCallback((content: ReactNode, options?: BottomSheetOptions) => {
    setState(prev => {
      // Eğer sheet zaten açıksa ve content değişiyorsa, önce index'i -1 yap
      // Sonra hemen 0 yap (gorhom'un internal state'i ile senkronize olması için)
      if (prev.index === 0 && prev.content !== content) {
        // Content değişiyor, önce kapat sonra aç
        // Ama burada direkt 0 yapıyoruz çünkü gorhom onChange ile handle edecek
        return {
          content,
          index: 0, // Open
          options: options || null,
        };
      }
      // Normal açılış
      return {
        content,
        index: 0, // Open
        options: options || null,
      };
    });
  }, []);

  /**
   * Bottom sheet kapat
   * STABİL FIX: Double close guard - index zaten -1 ise tekrar set etme
   */
  const closeBottomSheet = useCallback(() => {
    setState(prev => {
      // STABİL FIX: Index zaten -1 ise double close'u önle
      if (prev.index === -1) {
        return prev;
      }
      return {
        ...prev,
        index: -1, // Closed
      };
    });
    // Content'i temizle (gorhom animasyon süresi: ~250ms)
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        content: null,
        options: null,
      }));
    }, 250);
  }, []);

  // Context value
  const contextValue = useMemo<GlobalBottomSheetContextType>(
    () => ({
      state,
      openBottomSheet,
      closeBottomSheet,
    }),
    [state, openBottomSheet, closeBottomSheet]
  );

  return (
    <GlobalBottomSheetContext.Provider value={contextValue}>
      {children}
    </GlobalBottomSheetContext.Provider>
  );
};

/**
 * ARCHITECTURE FIX: Context is now exported from context.ts
 * No need to export here to avoid circular dependency
 */

