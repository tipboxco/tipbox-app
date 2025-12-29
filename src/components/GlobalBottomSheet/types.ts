import { ViewStyle } from 'react-native';
import { ReactNode } from 'react';

/**
 * Global Bottom Sheet Options
 * Tüm bottom sheet'ler için ortak ayarlar
 */
export interface BottomSheetOptions {
  // Snap points - eğer belirtilmezse enableDynamicSizing kullanılır
  snapPoints?: (string | number)[];
  
  // Dynamic sizing - içeriğe göre otomatik boyutlandırma
  enableDynamicSizing?: boolean;
  
  // Gesture settings
  enablePanDownToClose?: boolean;
  enableOverDrag?: boolean;
  enableHandlePanningGesture?: boolean;
  enableContentPanningGesture?: boolean;
  
  // Animation
  animateOnMount?: boolean;
  
  // Callbacks
  onChange?: (index: number) => void;
  onClose?: () => void;
  
  // Custom styles
  backgroundStyle?: ViewStyle;
  handleStyle?: ViewStyle;
  handleIndicatorStyle?: ViewStyle;
  
  // Backdrop
  backdropOpacity?: number;
  backdropPressBehavior?: 'none' | 'close' | 'collapse';
  
  // Padding
  paddingBottom?: number;
  
  // Initial snap index
  initialSnapIndex?: number;

  // Keyboard behavior
  keyboardBehavior?: 'interactive' | 'fillParent' | 'extend';
  keyboardBlurBehavior?: 'none' | 'restore';
  android_keyboardInputMode?: 'adjustResize' | 'adjustPan';
}

/**
 * Default Bottom Sheet Options
 * Tüm bottom sheet'ler için varsayılan ayarlar
 */
export const DEFAULT_BOTTOM_SHEET_OPTIONS: Required<Omit<BottomSheetOptions, 'snapPoints' | 'onChange' | 'onClose' | 'backgroundStyle' | 'handleStyle' | 'handleIndicatorStyle' | 'paddingBottom'>> & {
  snapPoints?: (string | number)[];
  onChange?: (index: number) => void;
  onClose?: () => void;
  backgroundStyle?: ViewStyle;
  handleStyle?: ViewStyle;
  handleIndicatorStyle?: ViewStyle;
  paddingBottom?: number;
} = {
  enableDynamicSizing: true,
  enablePanDownToClose: true,
  enableOverDrag: false,
  enableHandlePanningGesture: true,
  enableContentPanningGesture: true,
  animateOnMount: true,
  backdropOpacity: 0.5,
  backdropPressBehavior: 'close',
  initialSnapIndex: 0,
};

/**
 * Global Bottom Sheet Context Type
 */
export interface GlobalBottomSheetContextType {
  // State
  isOpen: boolean;
  content: ReactNode | null;
  options: BottomSheetOptions | null;
  
  // Actions
  openBottomSheet: (content: ReactNode, options?: BottomSheetOptions) => void;
  closeBottomSheet: () => void;
  updateContent: (content: ReactNode) => void;
}

