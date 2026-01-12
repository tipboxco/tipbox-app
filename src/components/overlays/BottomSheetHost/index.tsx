import React from 'react';
import { GlobalBottomSheet } from '@/src/components/GlobalBottomSheet';

/**
 * BottomSheetHost Component
 * 
 * Global bottom sheet'leri render eden host component.
 * GlobalUIHost içinde kullanılır.
 */
export const BottomSheetHost: React.FC = () => {
  return <GlobalBottomSheet />;
};
