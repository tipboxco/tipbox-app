import React, { useCallback, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
// BLUEPRINT FIX: Portal kullanmıyoruz - GlobalUIHost içinde render ediliyor
// import { Portal } from '@gorhom/portal';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useContext } from 'react';
import { GlobalBottomSheetContext } from './context';
import { DEFAULT_BOTTOM_SHEET_OPTIONS } from './types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Global Bottom Sheet Component
 * DOĞRU MİMARİ: Sadece index ile kontrol, expand() YOK, close() YOK
 * STABİL FIX: index TEK SOURCE OF TRUTH, koşullu değiştirilmez
 */
export const GlobalBottomSheet: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();
  
  const context = useContext(GlobalBottomSheetContext);
  if (!context) {
    throw new Error('GlobalBottomSheet must be used within GlobalBottomSheetProvider');
  }
  
  const { state, closeBottomSheet } = context;
  const { content, index, options } = state;

  // CRITICAL FIX: Son index değerini track et (onChange race condition'ını önlemek için)
  const lastIndexRef = useRef<number>(index);
  
  // Index değiştiğinde ref'i güncelle
  React.useEffect(() => {
    lastIndexRef.current = index;
  }, [index]);

  // Options'ı merge et
  const mergedOptions = useMemo(() => {
    const safeOptions = options || {};
    return {
      ...DEFAULT_BOTTOM_SHEET_OPTIONS,
      ...safeOptions,
      enableDynamicSizing: safeOptions.snapPoints ? false : (safeOptions.enableDynamicSizing ?? true),
    };
  }, [options]);

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => {
      return (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior={mergedOptions.backdropPressBehavior}
          opacity={mergedOptions.backdropOpacity ?? 0.5}
          enableTouchThrough={false}
        />
      );
    },
    [mergedOptions.backdropPressBehavior, mergedOptions.backdropOpacity]
  );

  // Sheet değişikliklerini handle et
  // CRITICAL FIX: İkinci açılışta otomatik kapanma sorununu çöz
  // Sorun: gorhom mount/unmount sırasında onChange(-1) tetikleyebilir
  // Çözüm: Sadece gerçek kullanıcı kapanma durumunda closeBottomSheet çağır
  const handleSheetChanges = useCallback(
    (newIndex: number) => {
      // CRITICAL FIX: Sadece gerçek kapanma durumunda closeBottomSheet çağır
      // Koşullar:
      // 1. newIndex === -1 (sheet kapandı)
      // 2. lastIndexRef.current === 0 (sheet açıktı)
      // 3. content var (sheet gerçekten render edilmiş)
      // Bu sayede mount/unmount sırasındaki yanlış tetiklemeleri önleriz
      if (newIndex === -1 && lastIndexRef.current === 0 && content) {
        // Gerçek kapanma: Sheet açıktı, şimdi kapandı
        closeBottomSheet();
      }
      
      // Ref'i güncelle (bir sonraki onChange için)
      lastIndexRef.current = newIndex;
      
      // Custom onChange callback'i varsa çağır
      if (mergedOptions.onChange) {
        mergedOptions.onChange(newIndex);
      }
    },
    [closeBottomSheet, mergedOptions.onChange, content]
  );

  // Styles
  const backgroundStyle = {
    backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    ...mergedOptions.backgroundStyle,
  };

  const handleStyle = {
    backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    ...mergedOptions.handleStyle,
  };

  const handleIndicatorStyle = {
    backgroundColor: isDark ? '#333333' : '#CCCCCC',
    width: 40,
    height: 4,
    ...mergedOptions.handleIndicatorStyle,
  };

  // Padding bottom
  const paddingBottom = mergedOptions.paddingBottom ?? (Platform.OS === 'ios' ? insets.bottom + 8 : 45 + 8);

  // Content yoksa render etme
  if (!content) {
    return null;
  }

  // DOĞRU MİMARİ: Sadece index ile kontrol
  // enableDynamicSizing true ise snapPoints undefined olmalı
  const bottomSheetProps = mergedOptions.enableDynamicSizing
    ? {
        enableDynamicSizing: true,
      }
    : {
        snapPoints: mergedOptions.snapPoints || ['50%'],
      };

  // BLUEPRINT FIX: Portal kullanmıyoruz - GlobalUIHost içinde render ediliyor
  // Portal kullanmak çift render'a neden oluyor (Portal + GlobalUIHost)
  return (
    <BottomSheet
        index={index} // STABİL FIX: TEK SOURCE OF TRUTH, koşullu değiştirilmez
        {...bottomSheetProps}
        enablePanDownToClose={mergedOptions.enablePanDownToClose}
        enableOverDrag={mergedOptions.enableOverDrag}
        enableHandlePanningGesture={mergedOptions.enableHandlePanningGesture}
        enableContentPanningGesture={mergedOptions.enableContentPanningGesture}
        animateOnMount={mergedOptions.animateOnMount}
        backdropComponent={renderBackdrop}
        onChange={handleSheetChanges}
        backgroundStyle={backgroundStyle}
        handleStyle={handleStyle}
        handleIndicatorStyle={handleIndicatorStyle}
        keyboardBehavior={mergedOptions.keyboardBehavior || 'interactive'}
        keyboardBlurBehavior={mergedOptions.keyboardBlurBehavior || 'restore'}
        android_keyboardInputMode={mergedOptions.android_keyboardInputMode || 'adjustResize'}
      >
        <BottomSheetView 
          style={{ 
            paddingBottom,
            minHeight: 200,
          }}
        >
          {content}
        </BottomSheetView>
      </BottomSheet>
  );
};
