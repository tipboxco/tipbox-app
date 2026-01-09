import React, { useCallback } from 'react';
import { VStack, HStack, Text, Pressable } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { Alert, Share } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useSharePost } from '@/src/features/interactions/api/hooks';

interface PostOptionsMenuProps {
  postId: string;
  postContent?: string;
  postAuthorName?: string;
}

export const PostOptionsMenu: React.FC<PostOptionsMenuProps> = ({
  postId,
  postContent,
  postAuthorName,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { closeBottomSheet } = useGlobalBottomSheet();
  const sharePostMutation = useSharePost();

  const handleExternalShare = useCallback(async () => {
    closeBottomSheet();
    
    try {
      const shareMessage = postContent 
        ? `${postAuthorName ? `${postAuthorName}: ` : ''}${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}`
        : `Check out this post on Tipbox!`;
      
      await Share.share({
        message: shareMessage,
        url: `tipboxapp://post/${postId}`,
      });
    } catch (error) {
      console.error('[PostOptionsMenu] Share error:', error);
    }
  }, [postId, postContent, postAuthorName, closeBottomSheet]);

  const handleReport = useCallback(() => {
    closeBottomSheet();
    
    Alert.alert(
      'Post\'u Raporla',
      'Bu post\'u raporlamak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Raporla',
          style: 'destructive',
          onPress: () => {
            // TODO: Post report API endpoint eklendiğinde buraya entegre edilecek
            console.log('[PostOptionsMenu] Report post:', postId);
            Alert.alert('Başarılı', 'Post raporlandı. İnceleme için teşekkürler.');
          },
        },
      ]
    );
  }, [postId, closeBottomSheet]);

  return (
    <VStack bg={isDark ? '$backgroundDark900' : '$white'} pb={20}>
      {/* External Share */}
      <Pressable
        onPress={handleExternalShare}
        px={20}
        py={16}
        borderBottomWidth={1}
        borderColor={isDark ? '$borderDark600' : '#E9E9E9'}
      >
        <HStack alignItems="center" space="md">
          <Feather name="share-2" size={20} color={isDark ? '#fff' : '#000'} />
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize="$md"
            fontWeight="$medium"
          >
            Dışarıda Paylaş
          </Text>
        </HStack>
      </Pressable>

      {/* Report */}
      <Pressable
        onPress={handleReport}
        px={20}
        py={16}
      >
        <HStack alignItems="center" space="md">
          <Feather name="flag" size={20} color="#FF3040" />
          <Text
            color="#FF3040"
            fontSize="$md"
            fontWeight="$medium"
          >
            Raporla
          </Text>
        </HStack>
      </Pressable>
    </VStack>
  );
};
