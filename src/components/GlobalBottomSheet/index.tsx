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

  // PERFORMANCE FIX: Fallback expansion with useEffect (only if setRef didn't trigger)
  // Primary expansion happens in setRef callback, this is fallback for edge cases
  // PERFORMANCE FIX: Removed requestAnimationFrame - direct expand() call for instant opening
  // ARCHITECTURE FIX: Always use expand() with enableDynamicSizing, never snapToIndex
  // FLICKER FIX: Reset isExpandingRef when bottom sheet closes to prevent flicker on next open
  // CONTROL FIX: Added better control and logging for bottom sheet expansion
  // FIX: Wait for ref to be ready before expanding (retry mechanism)
  useEffect(() => {
    console.log('[GlobalBottomSheet] 🔄 useEffect triggered:', {
      isOpen,
      hasContent: !!content,
      hasRef: !!bottomSheetRef.current,
      isExpandingRef: isExpandingRef.current,
    });
    
    if (isOpen && content) {
      // FIX: If ref is not ready yet, wait for it with retry mechanism
      if (!bottomSheetRef.current) {
        console.log('[GlobalBottomSheet] ⏳ Ref not ready yet, waiting...');
        // Retry mechanism: Check for ref every 50ms, max 10 times (500ms total)
        let retryCount = 0;
        const maxRetries = 10;
        const retryInterval = setInterval(() => {
          retryCount++;
          if (bottomSheetRef.current) {
            console.log('[GlobalBottomSheet] ✅ Ref is now ready, expanding...');
            clearInterval(retryInterval);
            // Ref is ready, now expand
            if (!isExpandingRef.current) {
              isExpandingRef.current = true;
              requestAnimationFrame(() => {
                if (bottomSheetRef.current && isOpen && content) {
                  try {
                    console.log('[GlobalBottomSheet] 🚀 Calling expand() after ref ready');
                    bottomSheetRef.current.expand();
                    console.log('[GlobalBottomSheet] ✅ expand() called successfully (useEffect after ref ready)');
                  } catch (error) {
                    console.error('[GlobalBottomSheet] ❌ Error expanding bottom sheet:', error);
                    isExpandingRef.current = false;
                  }
                }
              });
            }
          } else if (retryCount >= maxRetries) {
            console.warn('[GlobalBottomSheet] ⚠️ Ref not ready after max retries, giving up');
            clearInterval(retryInterval);
          }
        }, 50);
        
        return () => clearInterval(retryInterval);
      }
      
      // Ref is ready, proceed with expansion
      if (!isExpandingRef.current) {
        try {
          isExpandingRef.current = true;
          console.log('[GlobalBottomSheet] 🔄 Attempting to expand bottom sheet (useEffect)');
          // CONTROL FIX: Use requestAnimationFrame to ensure ref is fully ready
          requestAnimationFrame(() => {
            if (bottomSheetRef.current && isOpen && content) {
              try {
                console.log('[GlobalBottomSheet] 🚀 Calling expand() in requestAnimationFrame (useEffect)');
                bottomSheetRef.current.expand();
                console.log('[GlobalBottomSheet] ✅ expand() called successfully (useEffect)');
              } catch (error) {
                console.error('[GlobalBottomSheet] ❌ Error expanding bottom sheet (useEffect RAF):', error);
                isExpandingRef.current = false;
              }
            }
          });
        } catch (error) {
          console.error('[GlobalBottomSheet] ❌ Error expanding bottom sheet (useEffect):', error);
          isExpandingRef.current = false;
        }
      } else {
        // CONTROL FIX: If already expanding, try again after a short delay
        // This handles cases where expand() was called but didn't work
        const timeoutId = setTimeout(() => {
          if (bottomSheetRef.current && isOpen && content) {
            try {
              console.log('[GlobalBottomSheet] 🔄 Retrying expand() after delay');
              bottomSheetRef.current.expand();
            } catch (error) {
              console.error('[GlobalBottomSheet] ❌ Error retrying expand():', error);
            }
          }
        }, 200);
        return () => clearTimeout(timeoutId);
      }
    } else if (!isOpen && bottomSheetRef.current) {
      // FLICKER FIX: Reset isExpandingRef immediately when closing
      // This ensures next open doesn't have stale state
      console.log('[GlobalBottomSheet] 🔒 Closing bottom sheet');
      isExpandingRef.current = false;
      bottomSheetRef.current.close();
    } else if (!isOpen) {
      // FLICKER FIX: Reset isExpandingRef even if ref is not set
      // This handles edge cases where ref might be null
      isExpandingRef.current = false;
    } else {
      console.log('[GlobalBottomSheet] ⏸️ useEffect: Conditions not met:', {
        isOpen,
        hasContent: !!content,
        hasRef: !!bottomSheetRef.current,
      });
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
  // PERFORMANCE FIX: Removed requestAnimationFrame - direct expand() call for instant opening
  // ARCHITECTURE FIX: Always use expand() with enableDynamicSizing, never snapToIndex
  // FLICKER FIX: Reset isExpandingRef when ref is null (component unmounts)
  // CONTROL FIX: Added better control and logging for bottom sheet expansion
  const setRef = useCallback((ref: BottomSheet | null) => {
    console.log('[GlobalBottomSheet] 🔗 setRef called:', {
      hasRef: !!ref,
      isOpen,
      hasContent: !!content,
      isExpandingRef: isExpandingRef.current,
    });
    bottomSheetRef.current = ref;
    if (ref && isOpen && content) {
      // CONTROL FIX: Always try to expand when ref is set, even if isExpandingRef is true
      // This ensures bottom sheet opens even if previous expansion failed
      try {
        if (!isExpandingRef.current) {
          isExpandingRef.current = true;
          console.log('[GlobalBottomSheet] 🔄 Attempting to expand bottom sheet (setRef)');
        }
        // ARCHITECTURE FIX: Always use expand() with enableDynamicSizing
        // CONTROL FIX: Use requestAnimationFrame to ensure ref is fully ready
        requestAnimationFrame(() => {
          if (ref && isOpen && content) {
            try {
              console.log('[GlobalBottomSheet] 🚀 Calling expand() in requestAnimationFrame');
              ref.expand();
              console.log('[GlobalBottomSheet] ✅ expand() called successfully (setRef)');
            } catch (error) {
              console.error('[GlobalBottomSheet] ❌ Error expanding bottom sheet (setRef RAF):', error);
            }
          }
        });
      } catch (error) {
        console.error('[GlobalBottomSheet] ❌ Error expanding bottom sheet (setRef):', error);
        isExpandingRef.current = false;
      }
    } else if (!ref) {
      // FLICKER FIX: Reset isExpandingRef when ref is null (component unmounts)
      // This ensures clean state for next mount
      console.log('[GlobalBottomSheet] 🔒 Ref is null, resetting isExpandingRef');
      isExpandingRef.current = false;
    } else {
      console.log('[GlobalBottomSheet] ⏸️ Conditions not met for expansion:', {
        hasRef: !!ref,
        isOpen,
        hasContent: !!content,
      });
    }
  }, [isOpen, content]); // PERFORMANCE FIX: Removed mergedOptions from dependencies

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

  // PERFORMANCE FIX: Always start at -1 (closed) and use expand() to open
  // This eliminates the two-stage opening (mount at initialIndex → expand)
  // Direct expand() is faster than mount → initialIndex → expand
  // ARCHITECTURE FIX: Bottom sheet always starts closed, expand() opens it instantly
  const initialIndex = -1;

  // PERFORMANCE FIX: Use Portal to render Bottom Sheet outside navigation hierarchy
  // This prevents navigation re-renders from affecting Bottom Sheet performance
  // PortalProvider is already in AppProviders, so Portal should work correctly
  const bottomSheetContent = (
    <BottomSheet
      ref={setRef}
      index={initialIndex}
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
        {content}
      </BottomSheetView>
    </BottomSheet>
  );

  // ARCHITECTURE FIX: Use Portal to render outside navigation hierarchy
  // This improves performance by isolating Bottom Sheet from navigation re-renders
  // FIX: Remove hostName to use default Portal host (root level)
  // This ensures bottom sheet renders above TabNavigator (zIndex: 1000)
  return (
    <Portal>
      {bottomSheetContent}
    </Portal>
  );
};

