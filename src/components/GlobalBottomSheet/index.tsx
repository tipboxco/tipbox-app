import React, { useCallback, useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  useBottomSheetTimingConfigs,
} from '@gorhom/bottom-sheet';
// BLUEPRINT FIX: Portal kullanmıyoruz - GlobalUIHost içinde render ediliyor
// import { Portal } from '@gorhom/portal';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useContext } from 'react';
import { GlobalBottomSheetContext } from './context';
import { DEFAULT_BOTTOM_SHEET_OPTIONS } from './types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '@/src/hooks/useKeyboard';

/**
 * Global Bottom Sheet Component
 * DOĞRU MİMARİ: Sadece index ile kontrol, expand() YOK, close() YOK
 * STABİL FIX: index TEK SOURCE OF TRUTH, koşullu değiştirilmez
 */
export const GlobalBottomSheet: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboard();
  
  const context = useContext(GlobalBottomSheetContext);
  if (!context) {
    throw new Error('GlobalBottomSheet must be used within GlobalBottomSheetProvider');
  }
  
  const { state, closeBottomSheet } = context;
  const { content, index, options, openId } = state;
  

  // CRITICAL FIX: Son index değerini track et (onChange race condition'ını önlemek için)
  const lastIndexRef = useRef<number>(index);

  // RACE CONDITION FIX: gorhom mount sırasında onChange(-1) tetikleyebilir
  // Açılış zamanını kaydet, 500ms içindeki onChange(-1)'leri yoksay
  const openTimestampRef = useRef<number>(0);

  // Index değiştiğinde ref'i güncelle
  React.useEffect(() => {
    lastIndexRef.current = index;
    // Sheet açıldığında timestamp kaydet
    if (index === 0 && content) {
      openTimestampRef.current = Date.now();
    }
  }, [index, content]);

  // Options'ı merge et
  const mergedOptions = useMemo(() => {
    const safeOptions = options || {};
    // snapPoints varsa enableDynamicSizing false olmalı
    const hasSnapPoints = safeOptions.snapPoints && safeOptions.snapPoints.length > 0;
    return {
      ...DEFAULT_BOTTOM_SHEET_OPTIONS,
      ...safeOptions,
      enableDynamicSizing: hasSnapPoints ? false : (safeOptions.enableDynamicSizing ?? DEFAULT_BOTTOM_SHEET_OPTIONS.enableDynamicSizing),
    };
  }, [options]);

  // Backdrop component
  // CRITICAL: Detached modals need backdrop to work properly
  // Backdrop opacity 0 ise backdrop'u render etme
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => {
      const backdropOpacity = mergedOptions.backdropOpacity ?? 0.5;
      // Backdrop opacity 0 ise boş component döndür
      if (backdropOpacity === 0) {
        return <></>;
      }
      return (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior={mergedOptions.backdropPressBehavior ?? 'close'}
          opacity={backdropOpacity}
          enableTouchThrough={false}
          style={mergedOptions.detached ? { zIndex: 999 } : undefined}
        />
      );
    },
    [mergedOptions.backdropPressBehavior, mergedOptions.backdropOpacity, mergedOptions.detached]
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
      // 2. lastIndexRef.current >= 0 (sheet açıktı - herhangi bir snap point'te)
      // 3. content var (sheet gerçekten render edilmiş)
      // Bu sayede mount/unmount sırasındaki yanlış tetiklemeleri önleriz
      if (newIndex === -1 && lastIndexRef.current >= 0 && content) {
        // RACE CONDITION FIX: gorhom mount sırasında spurious onChange(-1) tetikleyebilir
        // Açılıştan 500ms içindeki close event'lerini yoksay
        const timeSinceOpen = Date.now() - openTimestampRef.current;
        if (timeSinceOpen < 500) {
          // Mount sırasında tetiklenen spurious event - yoksay
          // lastIndexRef güncellenmez, böylece gerçek kapanışta koşul hâlâ çalışır
          return;
        }
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
  // Detached modda: backgroundStyle'dan gelen borderRadius kullanılır (tüm köşeler)
  // Normal modda: sadece üst köşeler yuvarlatılmış
  const baseBackgroundColor = isDark ? '#1A1A1A' : '#FDFDFB';
  
  // Detached modda radius'u backgroundStyle'dan al, normal modda üst köşeleri yuvarla
  const backgroundStyle = mergedOptions.detached
    ? {
        // Detached modda: backgroundStyle'dan gelen borderRadius'u kullan
        // borderTopLeftRadius ve borderTopRightRadius'u kaldırmak için explicit olarak set etme
        ...mergedOptions.backgroundStyle,
        backgroundColor: mergedOptions.backgroundStyle?.backgroundColor || baseBackgroundColor,
      }
    : {
        backgroundColor: baseBackgroundColor,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        ...mergedOptions.backgroundStyle,
      };

  // Handle style - detached modda minimal, normal modda üst köşeler yuvarlatılmış
  const handleStyle = mergedOptions.detached
    ? {
        // Detached modda handle style'ı minimal tut
        ...mergedOptions.handleStyle,
      }
    : {
        backgroundColor: baseBackgroundColor,
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

  // Detach modal style - Example pattern: style prop should contain marginHorizontal for detached modals
  // If style is provided, use it directly (it should contain marginHorizontal: 24 for detached)
  // If not provided and detached, add default marginHorizontal
  // CRITICAL: Detached modals need high z-index to appear above other content
  const sheetContainerStyle = mergedOptions.detached
    ? {
        marginHorizontal: 0,
        zIndex: 1000,
        elevation: 1000, // Android için
        ...mergedOptions.style,
      }
    : mergedOptions.style;

  // Padding bottom
  const paddingBottom = mergedOptions.paddingBottom ?? 0;

  // animateOnMount true ise açılış/kapanış için aynı timing config (kapanış da animasyonlu olsun)
  // PERFORMANCE FIX: Duration'ı 300ms'den 180ms'ye düşür (daha hızlı açılış/kapanış)
  const timingConfigs = useBottomSheetTimingConfigs({ duration: 180 });
  const animationConfigs = mergedOptions.animateOnMount ? timingConfigs : undefined;

  // Content yoksa render etme
  if (!content) {
    console.log('[GlobalBottomSheet] No content, not rendering');
    return null;
  }

  console.log('[GlobalBottomSheet] Rendering with index:', index);

  // DOĞRU MİMARİ: Sadece index ile kontrol
  // enableDynamicSizing true ise snapPoints undefined olmalı
  // @gorhom/bottom-sheet hem number[] (0-1 arası) hem de string[] (örn: ['50%']) formatını destekler
  const bottomSheetProps = mergedOptions.enableDynamicSizing
    ? {
        enableDynamicSizing: true,
        ...(mergedOptions.maxDynamicContentSize !== undefined && {
          maxDynamicContentSize: mergedOptions.maxDynamicContentSize,
        }),
      }
    : {
        snapPoints: mergedOptions.snapPoints || [0.25], // Default: 50% (number format)
      };

  // BLUEPRINT FIX: Portal kullanmıyoruz - GlobalUIHost içinde render ediliyor
  // Portal kullanmak çift render'a neden oluyor (Portal + GlobalUIHost)
  return (
    <BottomSheet
        key={openId} // REOPEN FIX: Force fresh instance on each open to prevent gorhom stale state
        index={index} // STABİL FIX: TEK SOURCE OF TRUTH, koşullu değiştirilmez
        {...bottomSheetProps}
        enablePanDownToClose={mergedOptions.enablePanDownToClose}
        enableOverDrag={mergedOptions.enableOverDrag}
        enableHandlePanningGesture={mergedOptions.enableHandlePanningGesture}
        enableContentPanningGesture={mergedOptions.enableContentPanningGesture}
        animateOnMount={mergedOptions.animateOnMount !== undefined ? mergedOptions.animateOnMount : false}
        animationConfigs={mergedOptions.animationConfigs ?? animationConfigs}
        backdropComponent={renderBackdrop}
        onChange={handleSheetChanges}
        backgroundStyle={backgroundStyle}
        handleStyle={handleStyle}
        handleIndicatorStyle={handleIndicatorStyle}
        keyboardBehavior={mergedOptions.keyboardBehavior ?? 'extend'}
        keyboardBlurBehavior={mergedOptions.keyboardBlurBehavior ?? 'restore'}
        android_keyboardInputMode={mergedOptions.android_keyboardInputMode ?? 'adjustResize'}
        detached={mergedOptions.detached ?? false}
        bottomInset={mergedOptions.bottomInset}

        style={sheetContainerStyle}
      >
        {mergedOptions.wrapWithScrollView !== false ? (
          // Default: content'i BottomSheetView ile wrap et
          // snapPoints modunda flex:1 ile alanı doldur, dynamic sizing modunda minHeight kullan
          <BottomSheetView
            style={{
              paddingBottom,
              ...(mergedOptions.enableDynamicSizing ? { minHeight: 200 } : { flex: 1 }),
            }}
          >
            {content}
            {keyboardHeight > 0 && (
              <View style={{ height: keyboardHeight }} />
            )}
          </BottomSheetView>
        ) : (
          // Custom scroll view mode: content'i wrap etme
          // ShareToTrustedBottomSheet gibi componentler kendi BottomSheetFlatList'lerini kullanabilir
          content
        )}
      </BottomSheet>
  );
};
