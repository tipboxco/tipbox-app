import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { Platform, View, Keyboard } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useContext } from 'react';
import { GlobalBottomSheetContext } from './context'; // ARCHITECTURE FIX: Import from context.ts to break circular dependency
import { DEFAULT_BOTTOM_SHEET_OPTIONS, BottomSheetOptions } from './types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// ARCHITECTURE FIX: Removed GluestackProvider import - GlobalBottomSheet is already inside AppProviders which includes GluestackProvider

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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const context = useContext(GlobalBottomSheetContext);
  if (!context) {
    throw new Error('GlobalBottomSheet must be used within GlobalBottomSheetProvider');
  }
  const { isOpen, content, options, closeBottomSheet } = context;

  // Klavye yüksekliğini takip et
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Options'ı merge et (default + custom)
  // ARCHITECTURE FIX: Safe options merge - options can be null
  // PERFORMANCE FIX: Memoize mergedOptions to prevent unnecessary recalculations
  // ARCHITECTURE FIX: Use enableDynamicSizing instead of snapPoints
  // ARCHITECTURE FIX: Must be defined before useEffect hooks that use it
  // ERROR FIX: Wrap in try-catch to prevent undefined errors
  const mergedOptions = useMemo(() => {
    try {
      const safeOptions = options || {};
      const defaultOptions = DEFAULT_BOTTOM_SHEET_OPTIONS || {};
      const merged = {
        ...defaultOptions,
        ...safeOptions,
        // ARCHITECTURE FIX: Use snapPoints if provided, otherwise use enableDynamicSizing
        enableDynamicSizing: safeOptions.snapPoints ? false : (safeOptions.enableDynamicSizing ?? defaultOptions.enableDynamicSizing ?? true),
        snapPoints: safeOptions.snapPoints,
        initialSnapIndex: safeOptions.initialSnapIndex ?? 0,
      } as Required<Omit<BottomSheetOptions, 'onChange' | 'onClose' | 'backgroundStyle' | 'handleStyle' | 'handleIndicatorStyle' | 'paddingBottom' | 'keyboardBehavior' | 'keyboardBlurBehavior' | 'android_keyboardInputMode' | 'snapPoints' | 'initialSnapIndex'>> & {
        onChange?: (index: number) => void;
        onClose?: () => void;
        backgroundStyle?: any;
        handleStyle?: any;
        handleIndicatorStyle?: any;
        paddingBottom?: number;
        keyboardBehavior?: 'interactive' | 'fillParent' | 'extend';
        keyboardBlurBehavior?: 'none' | 'restore';
        android_keyboardInputMode?: 'adjustResize' | 'adjustPan';
        snapPoints?: number[];
        initialSnapIndex?: number;
      };
      
      return merged;
    } catch (error) {
      console.error('[GlobalBottomSheet] ❌ Error creating mergedOptions:', error);
      // Return safe default options
      return {
        ...DEFAULT_BOTTOM_SHEET_OPTIONS,
        enableDynamicSizing: true,
        initialSnapIndex: 0,
      } as Required<Omit<BottomSheetOptions, 'onChange' | 'onClose' | 'backgroundStyle' | 'handleStyle' | 'handleIndicatorStyle' | 'paddingBottom' | 'keyboardBehavior' | 'keyboardBlurBehavior' | 'android_keyboardInputMode' | 'snapPoints' | 'initialSnapIndex'>> & {
        onChange?: (index: number) => void;
        onClose?: () => void;
        backgroundStyle?: any;
        handleStyle?: any;
        handleIndicatorStyle?: any;
        paddingBottom?: number;
        keyboardBehavior?: 'interactive' | 'fillParent' | 'extend';
        keyboardBlurBehavior?: 'none' | 'restore';
        android_keyboardInputMode?: 'adjustResize' | 'adjustPan';
        snapPoints?: number[];
        initialSnapIndex?: number;
      };
    }
  }, [options]);

  // ARCHITECTURE FIX: Debug log to verify bottom sheet state (after mergedOptions is defined)
  useEffect(() => {
    if (isOpen && content && mergedOptions) {
      console.log('[GlobalBottomSheet] ✅ Bottom sheet opened:', {
        hasContent: !!content,
        contentType: typeof content,
        isReactElement: React.isValidElement(content),
        enableDynamicSizing: mergedOptions.enableDynamicSizing,
      });
    }
  }, [isOpen, content, mergedOptions]);

  // PERFORMANCE FIX: Simplified expansion - no retry mechanism, no requestAnimationFrame delay
  // Primary expansion happens in setRef callback (immediate)
  // This useEffect is only fallback if setRef didn't trigger (rare edge case)
  // ARCHITECTURE FIX: Always use expand() with enableDynamicSizing, never snapToIndex
  // FLICKER FIX: Reset isExpandingRef when bottom sheet closes to prevent flicker on next open
  useEffect(() => {
    if (isOpen && content && bottomSheetRef.current && !isExpandingRef.current) {
      try {
        isExpandingRef.current = true;
        // PERFORMANCE FIX: Direct expand() call - no requestAnimationFrame delay
        // @gorhom/bottom-sheet handles timing internally, no need for RAF
        bottomSheetRef.current.expand();
      } catch (error) {
        console.error('[GlobalBottomSheet] ❌ Error expanding bottom sheet:', error);
        isExpandingRef.current = false;
      }
    } else if (!isOpen && bottomSheetRef.current) {
      // FLICKER FIX: Reset isExpandingRef immediately when closing
      isExpandingRef.current = false;
      bottomSheetRef.current.close();
    } else if (!isOpen) {
      // FLICKER FIX: Reset isExpandingRef even if ref is not set
      isExpandingRef.current = false;
    }
  }, [isOpen, content]); // PERFORMANCE FIX: Removed mergedOptions from dependencies to prevent unnecessary re-renders

  // Backdrop component - klavye açıldığında kararmaması için
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => {
      const backdropStyle = props.style && typeof props.style === 'object' && !Array.isArray(props.style)
        ? props.style
        : {};
      
      return (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior={mergedOptions.backdropPressBehavior}
          opacity={mergedOptions.backdropOpacity ?? 0.5}
          enableTouchThrough={false}
          // Klavye açıldığında backdrop'un opacity'sini sabit tut
          style={{
            ...backdropStyle,
            opacity: mergedOptions.backdropOpacity ?? 0.5,
          }}
        />
      );
    },
    [mergedOptions.backdropPressBehavior, mergedOptions.backdropOpacity]
  );

  // Sheet değişikliklerini handle et
  // FLICKER FIX: Only call closeBottomSheet if isOpen is actually false
  // This prevents closing when new content is being opened (isOpen is still true)
  // CONTROL FIX: Added better logging and control for sheet state changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      console.log(`[GlobalBottomSheet] 📊 Sheet index changed: ${index}, isOpen: ${isOpen}, hasContent: ${!!content}`);
      
      // Sheet açıldığında (index >= 0)
      if (index >= 0) {
        console.log('[GlobalBottomSheet] ✅ Bottom sheet is now open (index >= 0)');
        if (isOpen && content) {
          isExpandingRef.current = true;
        }
      }
      
      // Sheet kapandığında (index === -1)
      // FLICKER FIX: Only close if isOpen is actually false
      // If isOpen is still true, it means new content is being opened, don't close
      if (index === -1) {
        console.log('[GlobalBottomSheet] 🔒 Bottom sheet is now closed (index === -1)');
        if (!isOpen) {
          isExpandingRef.current = false;
          closeBottomSheet();
        } else {
          // Index is -1 but isOpen is still true - this means content is being updated
          // Just reset the expanding ref, don't close
          console.log('[GlobalBottomSheet] ⚠️ Sheet closed but isOpen is still true - content update in progress');
          isExpandingRef.current = false;
        }
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
    opacity: 1, // Bottom sheet'in opacity'sini sabit tut (klavye açıldığında kararmasın)
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

  // Merge styles - opacity'yi her zaman 1 tut (klavye açıldığında bottom sheet kararmasın)
  const backgroundStyle = {
    ...defaultBackgroundStyle,
    ...mergedOptions.backgroundStyle,
    opacity: 1, // Bottom sheet'in opacity'sini her zaman 1 tut
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

  // PERFORMANCE FIX: Expansion when ref is set (primary method)
  // This runs immediately when BottomSheet component mounts
  // PERFORMANCE FIX: Direct expand() call - no requestAnimationFrame delay
  // @gorhom/bottom-sheet handles timing internally, no need for RAF
  // ARCHITECTURE FIX: Always use expand() with enableDynamicSizing, never snapToIndex
  // FLICKER FIX: Reset isExpandingRef when ref is null (component unmounts)
  const setRef = useCallback((ref: BottomSheet | null) => {
    bottomSheetRef.current = ref;
    if (ref && isOpen && content) {
      // Reset isExpandingRef if it's stuck
      if (isExpandingRef.current) {
        console.log('[GlobalBottomSheet] ⚠️ isExpandingRef is true in setRef, resetting...');
        isExpandingRef.current = false;
      }
      
      try {
        isExpandingRef.current = true;
        // PERFORMANCE FIX: Direct expand() call - instant opening
        // @gorhom/bottom-sheet ref is ready when setRef is called
        console.log('[GlobalBottomSheet] 🚀 Calling expand() on ref set', {
          isOpen,
          hasContent: !!content,
        });
        ref.expand();
      } catch (error) {
        console.error('[GlobalBottomSheet] ❌ Error expanding bottom sheet:', error);
        isExpandingRef.current = false;
      }
    } else if (!ref) {
      // FLICKER FIX: Reset isExpandingRef when ref is null (component unmounts)
      isExpandingRef.current = false;
    } else {
      console.log('[GlobalBottomSheet] ⏸️ Not expanding in setRef:', {
        hasRef: !!ref,
        isOpen,
        hasContent: !!content,
        isExpanding: isExpandingRef.current,
      });
    }
  }, [isOpen, content]); // PERFORMANCE FIX: Removed mergedOptions from dependencies

  // ARCHITECTURE FIX: Also expand when isOpen changes after ref is set
  // This handles the case where isOpen changes but ref was already set
  useEffect(() => {
    if (bottomSheetRef.current && isOpen && content) {
      // Reset isExpandingRef if it's stuck
      if (isExpandingRef.current) {
        console.log('[GlobalBottomSheet] ⚠️ isExpandingRef is true, resetting...');
        isExpandingRef.current = false;
      }
      
      try {
        isExpandingRef.current = true;
        console.log('[GlobalBottomSheet] 🚀 Calling expand() on isOpen change', {
          hasRef: !!bottomSheetRef.current,
          isOpen,
          hasContent: !!content,
        });
        bottomSheetRef.current.expand();
      } catch (error) {
        console.error('[GlobalBottomSheet] ❌ Error expanding bottom sheet in useEffect:', error);
        isExpandingRef.current = false;
      }
    } else {
      console.log('[GlobalBottomSheet] ⏸️ Not expanding:', {
        hasRef: !!bottomSheetRef.current,
        isOpen,
        hasContent: !!content,
      });
    }
  }, [isOpen, content]);

  // ARCHITECTURE FIX: No need to wrap content with GluestackProvider
  // GlobalBottomSheet is already inside AppProviders which includes GluestackProvider
  // Wrapping again causes "StyledProvider" error because nested providers conflict

  // Eğer content yoksa render etme (HOOK'LARDAN SONRA)
  // CONTROL FIX: Added logging for render conditions
  if (!content || !isOpen) {
    if (!content) {
      console.log('[GlobalBottomSheet] ⏸️ Not rendering: no content');
    }
    if (!isOpen) {
      console.log('[GlobalBottomSheet] ⏸️ Not rendering: isOpen is false');
    }
    return null;
  }

  // ARCHITECTURE FIX: Safety check - mergedOptions should always be defined
  if (!mergedOptions) {
    console.error('[GlobalBottomSheet] ❌ mergedOptions is undefined');
    return null;
  }

  // CONTROL FIX: Log when bottom sheet is about to render
  console.log('[GlobalBottomSheet] 🎨 Rendering bottom sheet:', {
    hasContent: !!content,
    isOpen,
    enableDynamicSizing: mergedOptions.enableDynamicSizing,
    hasSnapPoints: !!mergedOptions.snapPoints,
  });

  // ARCHITECTURE FIX: Use index prop based on isOpen state
  // enableDynamicSizing ile birlikte index prop kullanmak daha güvenilir
  // isOpen true ise 0 (açık), false ise -1 (kapalı)
  const bottomSheetIndex = isOpen ? 0 : -1;

  // PERFORMANCE FIX: Use Portal to render Bottom Sheet outside navigation hierarchy
  // This prevents navigation re-renders from affecting Bottom Sheet performance
  // PortalProvider is already in AppProviders, so Portal should work correctly
  const bottomSheetContent = (
    <BottomSheet
      ref={setRef}
      index={bottomSheetIndex}
      snapPoints={mergedOptions.snapPoints}
      enableDynamicSizing={mergedOptions.snapPoints ? false : (mergedOptions.enableDynamicSizing ?? true)}
      enablePanDownToClose={mergedOptions.enablePanDownToClose ?? true}
      enableOverDrag={mergedOptions.enableOverDrag ?? false}
      enableHandlePanningGesture={mergedOptions.enableHandlePanningGesture ?? true}
      enableContentPanningGesture={mergedOptions.enableContentPanningGesture ?? true}
      animateOnMount={mergedOptions.animateOnMount ?? false}
      backdropComponent={renderBackdrop}
      onChange={handleSheetChanges}
      backgroundStyle={backgroundStyle}
      handleStyle={handleStyle}
      handleIndicatorStyle={handleIndicatorStyle}
      keyboardBehavior={mergedOptions.keyboardBehavior || 'interactive'}
      keyboardBlurBehavior={mergedOptions.keyboardBlurBehavior || 'restore'}
      android_keyboardInputMode={mergedOptions.android_keyboardInputMode || 'adjustResize'}
      // Z-index: Tab bar'dan yüksek
      // ARCHITECTURE FIX: NavigationContainer içinde render edildiği için
      // position: 'absolute' ve zIndex ile tüm ekran stack'lerinin üstünde görünür
      style={{ 
        zIndex: 10000,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
      containerStyle={{
        zIndex: 10000,
        elevation: 10000,
        position: 'absolute',
      }}
    >
      <BottomSheetView style={{ paddingBottom }}>
        {content}
      </BottomSheetView>
    </BottomSheet>
  );

  // ARCHITECTURE FIX: Portal kullanarak NavigationContainer içindeki Portal.Host'a render et
  // Portal hostName: 'navigation' NavigationContainer içinde tanımlı
  // Bu sayede bottom sheet NavigationContainer içinde ama tüm ekran stack'lerinin üstünde görünür
  return (
    <Portal hostName="navigation">
      {bottomSheetContent}
    </Portal>
  );
};

