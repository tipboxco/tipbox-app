import React, { ReactNode } from 'react';
import { useKeyboardAwareBottomSheet } from '@/src/hooks/useKeyboardAwareBottomSheet';

interface KeyboardAwareBottomSheetProps {
    /**
     * Bottom sheet içeriği
     */
    content: ReactNode;
    
    /**
     * Minimum yükseklik (input yüksekliği + padding)
     * Varsayılan: 60 + safe area bottom
     */
    minHeight?: number;
    
    /**
     * Genişletilmiş yükseklik
     * - Sayı: pixel cinsinden (örn: 400)
     * - String: yüzde cinsinden (örn: '80%')
     * Varsayılan: ekran yüksekliğinin %80'i
     */
    expandedHeight?: number | string;
    
    /**
     * Ek bottom sheet options
     */
    options?: Partial<import('@/src/components/GlobalBottomSheet/types').BottomSheetOptions>;
    
    /**
     * Bottom sheet açıldığında çağrılacak callback
     */
    onOpen?: () => void;
    
    /**
     * Bottom sheet kapandığında çağrılacak callback
     */
    onClose?: () => void;
}

/**
 * Keyboard-aware bottom sheet component
 * 
 * Klavye açıldığında bottom sheet otomatik olarak yukarı kayar.
 * Klavye kapandığında bottom sheet eski haline döner.
 * 
 * @example
 * ```tsx
 * <KeyboardAwareBottomSheet
 *   content={<CommentInput />}
 *   minHeight={60}
 *   expandedHeight="80%"
 *   onOpen={() => console.log('Bottom sheet opened')}
 *   onClose={() => console.log('Bottom sheet closed')}
 * />
 * ```
 */
export const KeyboardAwareBottomSheet: React.FC<KeyboardAwareBottomSheetProps> = ({
    content,
    minHeight,
    expandedHeight,
    options,
    onOpen,
    onClose,
}) => {
    const { openKeyboardAwareBottomSheet, closeBottomSheet } = useKeyboardAwareBottomSheet(
        minHeight,
        expandedHeight
    );

    // Component mount olduğunda bottom sheet'i aç
    React.useEffect(() => {
        openKeyboardAwareBottomSheet(content, {
            ...options,
            onChange: (index) => {
                // Bottom sheet kapandığında
                if (index === -1) {
                    onClose?.();
                }
                // Custom onChange callback'i varsa çağır
                options?.onChange?.(index);
            },
        });
        onOpen?.();

        // Cleanup: Component unmount olduğunda bottom sheet'i kapat
        return () => {
            closeBottomSheet();
        };
    }, [content, minHeight, expandedHeight, options, onOpen, onClose, openKeyboardAwareBottomSheet, closeBottomSheet]);

    return null; // Bu component sadece side effect için, render etmez
};

/**
 * Keyboard-aware bottom sheet açma fonksiyonu
 * 
 * @example
 * ```tsx
 * const { openKeyboardAwareBottomSheet } = useKeyboardAwareBottomSheet(60, '80%');
 * 
 * const handleOpen = () => {
 *   openKeyboardAwareBottomSheet(
 *     <CommentInput />,
 *     { enablePanDownToClose: true }
 *   );
 * };
 * ```
 */
export { useKeyboardAwareBottomSheet } from '@/src/hooks/useKeyboardAwareBottomSheet';
