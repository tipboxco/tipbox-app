import React, { useCallback } from 'react';
import { MenuView } from '@react-native-menu/menu';
import { Alert, Share, Platform } from 'react-native';
import { useSharePost } from '@/src/features/interactions/api/hooks';

interface PostContextMenuProps {
  postId: string;
  postContent?: string;
  postAuthorName?: string;
  children: React.ReactNode;
}

export const PostContextMenu: React.FC<PostContextMenuProps> = ({
  postId,
  postContent,
  postAuthorName,
  children,
}) => {
  const sharePostMutation = useSharePost();

  const handleExternalShare = useCallback(async () => {
    try {
      const shareMessage = postContent 
        ? `${postAuthorName ? `${postAuthorName}: ` : ''}${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}`
        : `Check out this post on Tipbox!`;
      
      await Share.share({
        message: shareMessage,
        url: `tipboxapp://post/${postId}`,
      });
    } catch (error) {
      console.error('[PostContextMenu] Share error:', error);
    }
  }, [postId, postContent, postAuthorName]);

  const handleReport = useCallback(() => {
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
            console.log('[PostContextMenu] Report post:', postId);
            Alert.alert('Başarılı', 'Post raporlandı. İnceleme için teşekkürler.');
          },
        },
      ]
    );
  }, [postId]);

  const menuActions = [
    {
      id: 'share',
      title: 'Dışarıda Paylaş',
      titleColor: Platform.OS === 'ios' ? '#000000' : '#000000',
      image: Platform.OS === 'ios' ? 'square.and.arrow.up' : undefined,
      imageColor: Platform.OS === 'ios' ? '#000000' : undefined,
    },
    {
      id: 'report',
      title: 'Raporla',
      titleColor: '#FF3040',
      attributes: {
        destructive: true,
      },
      image: Platform.OS === 'ios' ? 'flag' : undefined,
      imageColor: Platform.OS === 'ios' ? '#FF3040' : undefined,
    },
  ];

  const handleMenuAction = useCallback(({ nativeEvent }: { nativeEvent: { event: string } }) => {
    const actionId = nativeEvent.event;
    
    console.log('[PostContextMenu] Menu action selected:', actionId);
    
    if (actionId === 'share') {
      handleExternalShare();
    } else if (actionId === 'report') {
      handleReport();
    }
  }, [handleExternalShare, handleReport]);

  return (
    <MenuView
      title="Post Seçenekleri"
      actions={menuActions}
      onPressAction={handleMenuAction}
      shouldOpenOnLongPress={false}
      onPress={() => {
        console.log('[PostContextMenu] MenuView pressed - Post ID:', postId);
      }}
    >
      {children}
    </MenuView>
  );
};
