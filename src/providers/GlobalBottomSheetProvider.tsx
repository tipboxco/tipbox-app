import React, { createContext, useState, useCallback, useMemo } from 'react';
import { ReactNode } from 'react';
import { GlobalBottomSheetContextType, BottomSheetOptions } from '@/src/components/GlobalBottomSheet/types';
import { GlobalBottomSheet } from '@/src/components/GlobalBottomSheet';

// Context oluştur
const GlobalBottomSheetContext = createContext<GlobalBottomSheetContextType | undefined>(undefined);

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
   */
  const openBottomSheet = useCallback((newContent: ReactNode, newOptions?: BottomSheetOptions) => {
    // Tüm state'leri aynı anda set et
    setContent(newContent);
    setOptions(newOptions || null);
    setIsOpen(true);
  }, []);

  /**
   * Bottom sheet kapat
   */
  const closeBottomSheet = useCallback(() => {
    setIsOpen(false);
    // Kısa bir delay ile content'i temizle (animasyon tamamlansın)
    setTimeout(() => {
      setContent(null);
      setOptions(null);
    }, 300);
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
 * Global Bottom Sheet Context'i export et (hook için)
 */
export { GlobalBottomSheetContext };

