/**
 * Post paylaşım bottom sheet – API base URL ihtiyacı ApiService (API_CONFIG) üzerinden gelir.
 * Bu modülde veya ShareToTrustedBottomSheet'te .env / API_BASE_URL import edilmez.
 */
import React, { useCallback } from 'react';
import { Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { ShareToTrustedBottomSheet } from '../ShareToTrustedBottomSheet';

export interface PostShareBottomSheetProps {
  postId: string;
  postContent?: string;
  postAuthorName?: string;
  onShareSuccess?: () => void;
}

/**
 * PostShareBottomSheet Hook
 * Tüm post tiplerinde share işlemi için ortak kullanım
 */
export const usePostShare = () => {
  const { openBottomSheet } = useGlobalBottomSheet();
  const insets = useSafeAreaInsets();

  const openPostShareSheet = useCallback(
    (props: PostShareBottomSheetProps) => {
      openBottomSheet(
        <ShareToTrustedBottomSheet
          postId={props.postId}
          postContent={props.postContent}
          postAuthorName={props.postAuthorName}
          onShareSuccess={props.onShareSuccess}
        />,
        {
          enablePanDownToClose: true,
          enableOverDrag: false,
          enableHandlePanningGesture: true,
          enableContentPanningGesture: true,
          enableDynamicSizing: true,
          animateOnMount: true,
          paddingBottom: Platform.OS === 'ios' ? Math.min(insets.bottom, 8) : 8,
          keyboardBehavior: 'interactive',
          keyboardBlurBehavior: 'restore',
          android_keyboardInputMode: 'adjustResize',
          onChange: (index: number) => {
            if (index === -1) {
              Keyboard.dismiss();
            }
          },
          onClose: () => {
            Keyboard.dismiss();
          },
        }
      );
    },
    [openBottomSheet, insets.bottom]
  );

  return { openPostShareSheet };
};
