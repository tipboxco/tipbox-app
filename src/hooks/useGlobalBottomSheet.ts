import { useContext } from 'react';
import { GlobalBottomSheetContext } from '@/src/components/GlobalBottomSheet/context';
import { GlobalBottomSheetContextType } from '@/src/components/GlobalBottomSheet/types';

/**
 * Global Bottom Sheet Hook
 * DOĞRU MİMARİ: Sadece context döndür
 */
export const useGlobalBottomSheet = (): GlobalBottomSheetContextType => {
  const context = useContext(GlobalBottomSheetContext);
  
  if (!context) {
    throw new Error('useGlobalBottomSheet must be used within GlobalBottomSheetProvider');
  }
  
  return context;
};

