import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform, Keyboard, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobalBottomSheet } from './useGlobalBottomSheet';
import { BottomSheetOptions } from '@/src/components/GlobalBottomSheet/types';

/**
 * Keyboard-aware bottom sheet hook
 * 
 * Klavye yüksekliğini takip eder ve bottom sheet'in snap points'lerini
 * klavye yüksekliğine göre dinamik olarak hesaplar.
 * 
 * @param minHeight - Bottom sheet'in minimum yüksekliği (input yüksekliği + padding)
 * @param expandedHeight - Bottom sheet'in genişletilmiş yüksekliği (ekran yüzdesi veya pixel)
 * @returns Bottom sheet açma fonksiyonu ve klavye yüksekliği
 */
export const useKeyboardAwareBottomSheet = (
    minHeight?: number,
    expandedHeight?: number | string
) => {
    const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
    const insets = useSafeAreaInsets();
    const screenHeight = Dimensions.get('window').height;

    // Klavye yüksekliği için state
    const [keyboardHeight, setKeyboardHeight] = useState(Platform.OS === 'ios' ? 300 : 250);

    // Klavye event listener'ları - klavye yüksekliğini gerçek zamanlı takip et
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (event) => {
                const height = event.endCoordinates.height;
                setKeyboardHeight(height);
                console.log('[useKeyboardAwareBottomSheet] ⌨️ Keyboard opened, height:', height);
            }
        );

        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setKeyboardHeight(Platform.OS === 'ios' ? 300 : 250); // Default değere dön
                console.log('[useKeyboardAwareBottomSheet] ⌨️ Keyboard closed');
            }
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    // Varsayılan min height (input yüksekliği + safe area)
    const defaultMinHeight = minHeight ?? (60 + insets.bottom);

    // Expanded height hesaplama
    const calculateExpandedHeight = useCallback(() => {
        if (!expandedHeight) {
            // Varsayılan: ekran yüksekliğinin %80'i
            return screenHeight * 0.8;
        }

        if (typeof expandedHeight === 'string') {
            // Yüzde olarak verilmişse (örn: '80%')
            const percentage = parseFloat(expandedHeight.replace('%', '')) / 100;
            return screenHeight * percentage;
        }

        // Pixel olarak verilmişse
        return expandedHeight;
    }, [expandedHeight, screenHeight]);

    // Snap points hesaplama
    // keyboardBehavior: 'interactive' kullanıldığında bottom sheet otomatik olarak klavyenin üstüne kayar
    // Bu yüzden snap points'e klavye yüksekliği eklemeye gerek yok
    const snapPoints = React.useMemo(() => {
        const expanded = calculateExpandedHeight();
        
        // Sadece expanded height kullan, klavye yüksekliği ekleme
        // keyboardBehavior: 'interactive' otomatik olarak klavyenin üstüne kaydırır
        return [defaultMinHeight, expanded];
    }, [defaultMinHeight, calculateExpandedHeight]);

    // Keyboard-aware bottom sheet açma fonksiyonu
    const openKeyboardAwareBottomSheet = useCallback(
        (content: React.ReactNode, options?: Partial<BottomSheetOptions>) => {
            const mergedOptions: BottomSheetOptions = {
                enablePanDownToClose: true,
                enableOverDrag: false,
                enableHandlePanningGesture: true,
                enableContentPanningGesture: false, // TEST: Input ağırlıklı sheet için false (gesture handler hatası için test)
                enableDynamicSizing: false,
                snapPoints,
                initialSnapIndex: 0,
                animateOnMount: true,
                paddingBottom: insets.bottom,
                keyboardBehavior: 'fillParent', // Klavye açıldığında bottom sheet klavyenin üstüne kayar (dokümantasyona göre)
                keyboardBlurBehavior: 'restore', // Klavye kapandığında eski haline döner
                android_keyboardInputMode: 'adjustResize',
                backdropOpacity: 0.5,
                ...options, // Kullanıcı tarafından sağlanan options öncelikli
            };

            openBottomSheet(content, mergedOptions);
        },
        [snapPoints, insets.bottom, openBottomSheet]
    );

    return {
        openKeyboardAwareBottomSheet,
        closeBottomSheet,
        keyboardHeight,
        snapPoints,
    };
};
