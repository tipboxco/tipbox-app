import React, { useRef, useCallback, useEffect } from 'react';
import { Platform, View } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useContext } from 'react';
import { GlobalBottomSheetContext } from '@/src/providers/GlobalBottomSheetProvider';
import { DEFAULT_BOTTOM_SHEET_OPTIONS, BottomSheetOptions } from './types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GluestackProvider } from '@/src/components/ui';

/**
 * Global Bottom Sheet Component
 * Tüm bottom sheet'leri render eden global component
 */
export const GlobalBottomSheet: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const isExpandingRef = useRef(false);
  
  const context = useContext(GlobalBottomSheetContext);
  if (!context) {
    throw new Error('GlobalBottomSheet must be used within GlobalBottomSheetProvider');
  }
  const { isOpen, content, options, closeBottomSheet } = context;

  // Options'ı merge et (default + custom)
  const mergedOptions: Required<Omit<BottomSheetOptions, 'snapPoints' | 'onChange' | 'onClose' | 'backgroundStyle' | 'handleStyle' | 'handleIndicatorStyle' | 'paddingBottom'>> & {
    snapPoints?: (string | number)[];
    onChange?: (index: number) => void;
    onClose?: () => void;
    backgroundStyle?: any;
    handleStyle?: any;
    handleIndicatorStyle?: any;
    paddingBottom?: number;
  } = {
    ...DEFAULT_BOTTOM_SHEET_OPTIONS,
    ...options,
  };

  // Bottom sheet açıldığında expand et
  useEffect(() => {
    if (isOpen && content && !isExpandingRef.current) {
      // Ref'in hazır olmasını bekle - daha uzun timeout ve retry mekanizması
      let retryCount = 0;
      const maxRetries = 10;
      
      const tryExpand = () => {
        if (bottomSheetRef.current) {
          try {
            isExpandingRef.current = true;
            if (mergedOptions.snapPoints && mergedOptions.snapPoints.length > 0) {
              // Snap points varsa ilk snap point'e git
              bottomSheetRef.current.snapToIndex(mergedOptions.initialSnapIndex || 0);
            } else if (mergedOptions.enableDynamicSizing) {
              // Dynamic sizing varsa expand et
              bottomSheetRef.current.expand();
            } else {
              // Fallback: expand et
              bottomSheetRef.current.expand();
            }
          } catch (error) {
            isExpandingRef.current = false;
          }
        } else {
          retryCount++;
          if (retryCount < maxRetries) {
            setTimeout(tryExpand, 100);
          } else {
            isExpandingRef.current = false;
          }
        }
      };

      // İlk deneme - daha kısa delay
      const timeoutId = setTimeout(tryExpand, 50);
      
      return () => {
        clearTimeout(timeoutId);
      };
    } else if (!isOpen && bottomSheetRef.current) {
      // Kapat
      isExpandingRef.current = false;
      bottomSheetRef.current.close();
    }
  }, [isOpen, content, mergedOptions.snapPoints, mergedOptions.enableDynamicSizing, mergedOptions.initialSnapIndex]);

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={mergedOptions.backdropPressBehavior}
        opacity={mergedOptions.backdropOpacity}
        enableTouchThrough={false}
      />
    ),
    [mergedOptions.backdropPressBehavior, mergedOptions.backdropOpacity]
  );

  // Sheet değişikliklerini handle et
  const handleSheetChanges = useCallback(
    (index: number) => {
      // Sheet açıldığında (index >= 0) ve henüz expand edilmediyse
      if (index >= 0 && isOpen && content && !isExpandingRef.current) {
        isExpandingRef.current = true;
      }
      
      // Sheet kapandığında (index === -1)
      if (index === -1) {
        isExpandingRef.current = false;
        closeBottomSheet();
      }
      
      // Custom onChange callback'i varsa çağır
      if (mergedOptions.onChange) {
        mergedOptions.onChange(index);
      }
    },
    [isOpen, content, closeBottomSheet, mergedOptions.onChange]
  );

  // Default styles
  const defaultBackgroundStyle = {
    backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  };

  const defaultHandleStyle = {
    backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  };

  const defaultHandleIndicatorStyle = {
    backgroundColor: isDark ? '#333333' : '#CCCCCC',
    width: 40,
    height: 4,
  };

  // Merge styles
  const backgroundStyle = {
    ...defaultBackgroundStyle,
    ...mergedOptions.backgroundStyle,
  };

  const handleStyle = {
    ...defaultHandleStyle,
    ...mergedOptions.handleStyle,
  };

  const handleIndicatorStyle = {
    ...defaultHandleIndicatorStyle,
    ...mergedOptions.handleIndicatorStyle,
  };

  // Padding bottom - default: safe area + tab bar height (45)
  const paddingBottom = mergedOptions.paddingBottom ?? (Platform.OS === 'ios' ? insets.bottom + 8 : 45 + 8);

  // Ref callback - ref set edildiğinde (TÜM HOOK'LAR ERKEN RETURN'DEN ÖNCE OLMALI)
  const setRef = useCallback((ref: BottomSheet | null) => {
    bottomSheetRef.current = ref;
    if (ref && isOpen && content) {
      // Ref set edildiğinde hemen expand et
      setTimeout(() => {
        try {
          if (mergedOptions.snapPoints && mergedOptions.snapPoints.length > 0) {
            ref.snapToIndex(mergedOptions.initialSnapIndex || 0);
          } else if (mergedOptions.enableDynamicSizing) {
            ref.expand();
          } else {
            ref.expand();
          }
        } catch (error) {
          // Silent error handling
        }
      }, 50);
    }
  }, [isOpen, content, mergedOptions.snapPoints, mergedOptions.enableDynamicSizing, mergedOptions.initialSnapIndex]);

  // Content'i GluestackProvider ile wrap et (memoize edilmiş) - HOOK'LAR ERKEN RETURN'DEN ÖNCE OLMALI
  const wrappedContent = React.useMemo(
    () => {
      if (!content) return null;
      return (
        <GluestackProvider>
          {content}
        </GluestackProvider>
      );
    },
    [content]
  );

  // Eğer content yoksa render etme (HOOK'LARDAN SONRA)
  if (!content || !isOpen) {
    return null;
  }

  // Portal kullanmadan direkt render et - Portal ref sorunlarına neden oluyor
  return (
    <BottomSheet
      ref={setRef}
      index={-1}
      snapPoints={mergedOptions.snapPoints}
      enablePanDownToClose={mergedOptions.enablePanDownToClose}
      enableOverDrag={mergedOptions.enableOverDrag}
      enableHandlePanningGesture={mergedOptions.enableHandlePanningGesture}
      enableContentPanningGesture={mergedOptions.enableContentPanningGesture}
      enableDynamicSizing={mergedOptions.enableDynamicSizing}
      animateOnMount={mergedOptions.animateOnMount}
      backdropComponent={renderBackdrop}
      onChange={handleSheetChanges}
      backgroundStyle={backgroundStyle}
      handleStyle={handleStyle}
      handleIndicatorStyle={handleIndicatorStyle}
      // Z-index: Tab bar'dan yüksek
      style={{ 
        zIndex: 10000,
        position: 'absolute',
      }}
      containerStyle={{
        zIndex: 10000,
        elevation: 10000,
      }}
    >
      <BottomSheetView style={{ paddingBottom }}>
        {wrappedContent || content}
      </BottomSheetView>
    </BottomSheet>
  );
};

