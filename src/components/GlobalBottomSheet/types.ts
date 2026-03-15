import { ViewStyle } from 'react-native';
import { ReactNode } from 'react';

/**
 * Global Bottom Sheet Options
 * Tüm bottom sheet'ler için ortak ayarlar
 */
export interface BottomSheetOptions {
  // Dynamic sizing - içeriğe göre otomatik boyutlandırma
  enableDynamicSizing?: boolean;
  
  // Max dynamic content size - Dynamic sizing ile maksimum yükseklik (0-1 arası veya pixel değeri)
  maxDynamicContentSize?: number;
  
  // Snap points - klavye açıldığında yukarı kayması için (enableDynamicSizing: false ise kullanılır)
  // @gorhom/bottom-sheet hem number[] (0-1 arası) hem de string[] (örn: ['50%']) formatını destekler
  snapPoints?: (number | string)[];
  
  // Initial snap index - hangi snap point'te başlayacağı (default: 0)
  initialSnapIndex?: number;
  
  // Gesture settings
  enablePanDownToClose?: boolean;
  enableOverDrag?: boolean;
  enableHandlePanningGesture?: boolean;
  enableContentPanningGesture?: boolean;
  enableHandle?: boolean;
  
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
  
  // Detach modal
  detached?: boolean;
  bottomInset?: number;
  style?: ViewStyle;

  // Animation config
  animationConfigs?: any;

  // Scroll wrapper
  // true: content'i BottomSheetView ile wrap et (default)
  // false: content'i wrap etme, custom scroll view kullanımına izin ver (BottomSheetFlatList, BottomSheetScrollView vb.)
  wrapWithScrollView?: boolean;
}

/**
 * Default Bottom Sheet Options
 * Tüm bottom sheet'ler için varsayılan ayarlar
 */
export const DEFAULT_BOTTOM_SHEET_OPTIONS: Required<Omit<BottomSheetOptions, 'onChange' | 'onClose' | 'backgroundStyle' | 'handleStyle' | 'handleIndicatorStyle' | 'paddingBottom' | 'animationConfigs'>> & {
  onChange?: (index: number) => void;
  onClose?: () => void;
  backgroundStyle?: ViewStyle;
  handleStyle?: ViewStyle;
  handleIndicatorStyle?: ViewStyle;
  paddingBottom?: number;
  animationConfigs?: any;
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
  // KEYBOARD FIX: Klavye bottom sheet'in altında açılacak şekilde ayarla
  // 'extend' klavyenin bottom sheet'i yukarı itmesini sağlar, böylece klavye bottom sheet'in altında kalır
  keyboardBehavior: 'extend',
  keyboardBlurBehavior: 'restore',
  android_keyboardInputMode: 'adjustResize',
  // Scroll wrapper
  wrapWithScrollView: true,
  detached: false,
  bottomInset: 0,
  enableHandle: true,
  maxDynamicContentSize: 0,
  snapPoints: [],
  initialSnapIndex: 0,
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
  snapToIndex: (index: number) => void;
}

