import React, { useRef, useCallback, useEffect } from 'react';
import { Platform, View } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
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
  
  const { isOpen, content, options, closeBottomSheet } = useGlobalBottomSheet();

  // Debug log'ları
  useEffect(() => {
    console.log('[GlobalBottomSheet] State:', {
      isOpen,
      hasContent: !!content,
      hasOptions: !!options,
      isExpanding: isExpandingRef.current,
    });
  }, [isOpen, content, options]);

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
    console.log('[GlobalBottomSheet] useEffect triggered:', {
      isOpen,
      hasContent: !!content,
      hasRef: !!bottomSheetRef.current,
      enableDynamicSizing: mergedOptions.enableDynamicSizing,
    });

    if (isOpen && content && !isExpandingRef.current) {
      // Ref'in hazır olmasını bekle - daha uzun timeout ve retry mekanizması
      let retryCount = 0;
      const maxRetries = 10;
      
      const tryExpand = () => {
        console.log(`[GlobalBottomSheet] Attempting to expand (retry ${retryCount + 1}/${maxRetries}), ref exists:`, !!bottomSheetRef.current);
        
        if (bottomSheetRef.current) {
          try {
            isExpandingRef.current = true;
            if (mergedOptions.snapPoints && mergedOptions.snapPoints.length > 0) {
              // Snap points varsa ilk snap point'e git
              console.log('[GlobalBottomSheet] Using snapPoints:', mergedOptions.snapPoints);
              bottomSheetRef.current.snapToIndex(mergedOptions.initialSnapIndex || 0);
            } else if (mergedOptions.enableDynamicSizing) {
              // Dynamic sizing varsa expand et
              console.log('[GlobalBottomSheet] Expanding with dynamic sizing');
              bottomSheetRef.current.expand();
            } else {
              // Fallback: expand et
              console.log('[GlobalBottomSheet] Expanding (fallback)');
              bottomSheetRef.current.expand();
            }
            console.log('[GlobalBottomSheet] Expand called successfully');
          } catch (error) {
            console.error('[GlobalBottomSheet] Error expanding:', error);
            isExpandingRef.current = false;
          }
        } else {
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`[GlobalBottomSheet] Ref is null, retrying in 100ms... (${retryCount}/${maxRetries})`);
            setTimeout(tryExpand, 100);
          } else {
            console.warn('[GlobalBottomSheet] Ref is still null after max retries');
            isExpandingRef.current = false;
          }
        }
      };

      // İlk deneme - daha kısa delay
      const timeoutId = setTimeout(tryExpand, 50);
      
      return () => {
        console.log('[GlobalBottomSheet] Cleaning up timeout');
        clearTimeout(timeoutId);
      };
    } else if (!isOpen && bottomSheetRef.current) {
      // Kapat
      console.log('[GlobalBottomSheet] Closing bottom sheet');
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
      console.log('[GlobalBottomSheet] Sheet changed, index:', index);
      
      // Sheet açıldığında (index >= 0) ve henüz expand edilmediyse
      if (index >= 0 && isOpen && content && !isExpandingRef.current) {
        console.log('[GlobalBottomSheet] Sheet opened, already expanded');
        isExpandingRef.current = true;
      }
      
      // Sheet kapandığında (index === -1)
      if (index === -1) {
        console.log('[GlobalBottomSheet] Sheet closed, calling closeBottomSheet');
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

  // Ref callback - ref set edildiğinde log (TÜM HOOK'LAR ERKEN RETURN'DEN ÖNCE OLMALI)
  const setRef = useCallback((ref: BottomSheet | null) => {
    console.log('[GlobalBottomSheet] Ref callback called, ref:', !!ref);
    bottomSheetRef.current = ref;
    if (ref && isOpen && content) {
      // Ref set edildiğinde hemen expand et
      console.log('[GlobalBottomSheet] Ref set, attempting immediate expand');
      setTimeout(() => {
        try {
          if (mergedOptions.snapPoints && mergedOptions.snapPoints.length > 0) {
            ref.snapToIndex(mergedOptions.initialSnapIndex || 0);
          } else if (mergedOptions.enableDynamicSizing) {
            ref.expand();
          } else {
            ref.expand();
          }
          console.log('[GlobalBottomSheet] Immediate expand successful');
        } catch (error) {
          console.error('[GlobalBottomSheet] Immediate expand error:', error);
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
    console.log('[GlobalBottomSheet] Not rendering - content:', !!content, 'isOpen:', isOpen);
    return null;
  }

  console.log('[GlobalBottomSheet] Rendering BottomSheet component');

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

