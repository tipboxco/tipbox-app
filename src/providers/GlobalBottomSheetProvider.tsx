import React, { useState, useCallback, useMemo, useRef } from 'react';
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
   * STABILITY FIX:
   * closeBottomSheet() cleanup timeout'u, araya giren openBottomSheet() sonrası
   * yeni content'i yanlışlıkla temizleyebiliyor (race condition).
   * Çözüm: timeout'u ref ile track et, open'da iptal et, ayrıca opId ile guard et.
   */
  const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opIdRef = useRef(0);
  /** animateOnMount true olan sheet'lerde kapanış animasyonu bitene kadar beklemek için */
  const optionsRef = useRef<BottomSheetOptions | null>(null);
  optionsRef.current = state.options;

  const bumpOpId = () => {
    opIdRef.current += 1;
    return opIdRef.current;
  };

  const cancelPendingCleanup = () => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }
  };

  /**
   * Bottom sheet aç
   * STABİL FIX: Eğer sheet zaten açıksa, önce kapat sonra aç (content değişikliği için)
   */
  const openBottomSheet = useCallback((content: ReactNode, options?: BottomSheetOptions) => {
    // CRITICAL FIX: Cleanup iptal ve instant state update
    cancelPendingCleanup();
    bumpOpId();

    // PERFORMANCE: Tek setState ile instant açılış (no animation delay)
    setState({
      content,
      index: 0, // Open
      options: options || null,
    });
  }, []);

  /**
   * Bottom sheet kapat
   * STABİL FIX: Double close guard - index zaten -1 ise tekrar set etme
   */
  const closeBottomSheet = useCallback(() => {
    // Çift cleanup timeout'u birikmesini engelle
    cancelPendingCleanup();
    const closeOpId = bumpOpId();

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
    // CRITICAL FIX: Cleanup delay'i minimal yap (instant açılış için)
    // animateOnMount false ise cleanup anlık, true ise minimal bekleme
    const cleanupDelay = optionsRef.current?.animateOnMount ? 150 : 0;
    cleanupTimeoutRef.current = setTimeout(() => {
      setState(prev => {
        // Eğer bu close'tan sonra başka bir open/close olduysa cleanup yapma
        if (opIdRef.current !== closeOpId) {
          return prev;
        }

        // Eğer sheet yeniden açıldıysa content'i temizleme
        if (prev.index !== -1) {
          return prev;
        }

        return {
          ...prev,
          content: null,
          options: null,
        };
      });
      cleanupTimeoutRef.current = null;
    }, cleanupDelay);
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

