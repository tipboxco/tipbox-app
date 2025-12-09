import { useContext } from 'react';
import { GlobalBottomSheetContext } from '@/src/providers/GlobalBottomSheetProvider';
import { GlobalBottomSheetContextType } from '@/src/components/GlobalBottomSheet/types';

/**
 * Global Bottom Sheet Hook
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
  
  return context;
};

