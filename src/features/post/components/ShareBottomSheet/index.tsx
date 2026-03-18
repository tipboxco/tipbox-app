import React, { useCallback, useState } from 'react';
import { VStack, HStack, Text, Pressable, Divider } from '@gluestack-ui/themed';
import {
  ArrowTopRightOnSquareIcon,
  PaperAirplaneIcon,
} from 'react-native-heroicons/outline';
import { Share } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useSharePost } from '@/src/features/interactions/api/hooks';

interface ShareBottomSheetProps {
  postId: string;
  postContent?: string;
  postAuthorName?: string;
  onShareSuccess?: () => void;
}

export const ShareBottomSheet: React.FC<ShareBottomSheetProps> = ({
  postId,
  postContent,
  postAuthorName,
  onShareSuccess,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('common');
  const { closeBottomSheet } = useGlobalBottomSheet();
  const sharePostMutation = useSharePost();
  const [isSharing, setIsSharing] = useState(false);

  const handleExternalShare = useCallback(async () => {
    closeBottomSheet();
    
    try {
      const shareMessage = postContent 
        ? `${postAuthorName ? `${postAuthorName}: ` : ''}${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}`
        : t('messages.checkOutPost');
      
      await Share.share({
        message: shareMessage,
        url: `tipboxapp://post/${postId}`,
      });
      
      if (onShareSuccess) {
        onShareSuccess();
      }
    } catch (error) {
      console.error('[ShareBottomSheet] External share error:', error);
    }
  }, [postId, postContent, postAuthorName, closeBottomSheet, onShareSuccess]);

  const handleInternalShare = useCallback(() => {
    if (isSharing) return;
    
    setIsSharing(true);
    
    sharePostMutation.mutate(
      {
        postId: postId,
        shareType: 'INTERNAL_REPOST',
      },
      {
        onSuccess: () => {
          closeBottomSheet();
          setIsSharing(false);
          if (onShareSuccess) {
            onShareSuccess();
          }
        },
        onError: (error) => {
          console.error('[ShareBottomSheet] Internal share error:', error);
          setIsSharing(false);
        },
      }
    );
  }, [postId, sharePostMutation, closeBottomSheet, onShareSuccess, isSharing]);

  return (
    <VStack 
      bg={isDark ? '$backgroundDark900' : '$white'} 
      pb={20}
      pt={8}
      minHeight={120}
    >
      {/* Internal Share (Repost) */}
      <Pressable
        onPress={handleInternalShare}
        px={20}
        py={16}
        borderBottomWidth={1}
        borderColor={isDark ? '$borderDark600' : '#E9E9E9'}
        disabled={isSharing || sharePostMutation.isPending}
        opacity={(isSharing || sharePostMutation.isPending) ? 0.6 : 1}
      >
        <HStack alignItems="center" space="md">
          <PaperAirplaneIcon width={20} height={20} color={isDark ? '#fff' : '#000'} />
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize="$md"
            fontWeight="$medium"
          >
            {isSharing || sharePostMutation.isPending ? t('share.sharing') : t('share.internalShare')}
          </Text>
        </HStack>
      </Pressable>

      {/* External Share */}
      <Pressable
        onPress={handleExternalShare}
        px={20}
        py={16}
      >
        <HStack alignItems="center" space="md">
          <ArrowTopRightOnSquareIcon width={20} height={20} color={isDark ? '#fff' : '#000'} />
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize="$md"
            fontWeight="$medium"
          >
            {t('share.externalShare')}
          </Text>
        </HStack>
      </Pressable>
    </VStack>
  );
};

export default ShareBottomSheet;
