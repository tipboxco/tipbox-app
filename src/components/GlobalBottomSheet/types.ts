import { ViewStyle } from 'react-native';
import { ReactNode } from 'react';

/**
 * Global Bottom Sheet Options
 * Tüm bottom sheet'ler için ortak ayarlar
 */
export interface BottomSheetOptions {
  // Dynamic sizing - içeriğe göre otomatik boyutlandırma
  enableDynamicSizing?: boolean;
  
  // Snap points - klavye açıldığında yukarı kayması için (enableDynamicSizing: false ise kullanılır)
  snapPoints?: number[];
  
  // Initial snap index - hangi snap point'te başlayacağı (default: 0)
  initialSnapIndex?: number;
  
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

  // Keyboard behavior
  keyboardBehavior?: 'interactive' | 'fillParent' | 'extend';
  keyboardBlurBehavior?: 'none' | 'restore';
  android_keyboardInputMode?: 'adjustResize' | 'adjustPan';
}

/**
 * Default Bottom Sheet Options
 * Tüm bottom sheet'ler için varsayılan ayarlar
 */
export const DEFAULT_BOTTOM_SHEET_OPTIONS: Required<Omit<BottomSheetOptions, 'onChange' | 'onClose' | 'backgroundStyle' | 'handleStyle' | 'handleIndicatorStyle' | 'paddingBottom'>> & {
  onChange?: (index: number) => void;
  onClose?: () => void;
  backgroundStyle?: ViewStyle;
  handleStyle?: ViewStyle;
  handleIndicatorStyle?: ViewStyle;
  paddingBottom?: number;
} = {
  // ARCHITECTURE FIX: Use enableDynamicSizing instead of snapPoints
  // Dynamic sizing adapts to content height automatically
  enableDynamicSizing: true,
  enablePanDownToClose: true,
  enableOverDrag: false,
  enableHandlePanningGesture: true,
  enableContentPanningGesture: true,
  // SMOOTH FIX: Enable animateOnMount for smooth opening animation
  animateOnMount: true,
  backdropOpacity: 0.5,
  backdropPressBehavior: 'close',
};

/**
 * Global Bottom Sheet State
 * DOĞRU MİMARİ: Sadece content ve index
 */
export type BottomSheetState = {
  content: ReactNode | null;
  index: number; // -1 closed, 0 open
  options: BottomSheetOptions | null;
};

/**
 * Global Bottom Sheet Context Type
 * DOĞRU MİMARİ: Sadece state ve basit actions
 */
export interface GlobalBottomSheetContextType {
  // State
  state: BottomSheetState;
  
  // Actions
  openBottomSheet: (content: ReactNode, options?: BottomSheetOptions) => void;
  closeBottomSheet: () => void;
}

