import React, { useCallback } from 'react';
import { VStack, HStack, Text, Pressable } from '@gluestack-ui/themed';
import {
  ArrowTopRightOnSquareIcon,
  FlagIcon,
  PencilIcon,
  TrashIcon,
} from 'react-native-heroicons/outline';
import { Alert, Share } from 'react-native';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useSharePost } from '@/src/features/interactions/api/hooks';
import { useUpdatePost, useDeletePost } from '@/src/features/post/api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';

interface PostOptionsMenuProps {
  postId: string;
  postContent?: string;
  postAuthorName?: string;
  postAuthorId?: string; // Post sahibinin ID'si
  postType?: 'post' | 'experience' | 'benchmark' | 'tips_and_tricks' | 'question' | 'update'; // Post tipi (update için gerekli)
  postContextType?: 'product' | 'product_group' | 'sub_category'; // Context type (update için gerekli)
  postContextId?: string; // Context ID (update için gerekli)
  /** Modal içinde kullanıldığında kapatmak için; verilmezse closeBottomSheet kullanılır */
  onClose?: () => void;
}

export const PostOptionsMenu: React.FC<PostOptionsMenuProps> = ({
  postId,
  postContent,
  postAuthorName,
  postAuthorId,
  postType,
  postContextType,
  postContextId,
  onClose,
}) => {
  const { t } = useTranslation();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { closeBottomSheet } = useGlobalBottomSheet();
  const close = onClose ?? closeBottomSheet;
  const sharePostMutation = useSharePost();
  const updatePostMutation = useUpdatePost();
  const deletePostMutation = useDeletePost();
  const { user } = useAppStore();
  
  // Post sahibi kontrolü
  const isPostOwner = user?.id && postAuthorId && user.id === postAuthorId;

  const handleExternalShare = useCallback(async () => {
    close();
    
    try {
      const shareMessage = postContent
        ? `${postAuthorName ? `${postAuthorName}: ` : ''}${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}`
        : t('messages.checkOutPost');
      
      await Share.share({
        message: shareMessage,
        url: `tipboxapp://post/${postId}`,
      });
    } catch (error) {
      console.error('[PostOptionsMenu] Share error:', error);
    }
  }, [postId, postContent, postAuthorName, close]);

  const handleUpdate = useCallback(() => {
    close();
    
    // CRITICAL: Update seçeneği sadece experience post tipinde görünür
    if (postType === 'experience') {
      // Experience post için: Direkt CreateUpdatePostScreen'e yönlendir
      // postId burada experience post'un ID'si - experiencePostId olarak gönder
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'CreateUpdatePostScreen',
        params: {
          experiencePostId: postId,
          product: postContextType === 'product' && postContextId ? {
            id: postContextId,
            name: '',
          } : undefined,
        },
      });
    } else {
      // Diğer post tipleri için update özelliği yok
      // Bu kod bloğuna normalde ulaşılmamalı (showUpdateOption = false)
      Alert.alert(t('dialogs.info'), t('messages.updateOnlyForExperience'));
    }
  }, [postId, postType, postContextType, postContextId, close, t]);

  const handleDelete = useCallback(() => {
    closeBottomSheet();
    
    console.log('[PostOptionsMenu] 🗑️ Delete button clicked for post:', postId);
    
    Alert.alert(
      t('dialogs.deletePost.title'),
      t('dialogs.deletePost.message'),
      [
        {
          text: t('buttons.cancel'),
          style: 'cancel',
          onPress: () => {
            console.log('[PostOptionsMenu] ❌ Delete cancelled by user');
          },
        },
        {
          text: t('buttons.delete'),
          style: 'destructive',
          onPress: async () => {
            console.log('[PostOptionsMenu] ✅ Delete confirmed, sending DELETE request to /posts/' + postId);
            
            try {
              const response = await deletePostMutation.mutateAsync(postId);
              
              console.log('[PostOptionsMenu] ✅ Post deleted successfully:', {
                postId,
                response,
                timestamp: new Date().toISOString(),
              });
              
              Alert.alert(t('messages.success'), t('messages.postDeleted'));
              // Navigate back if needed
              navigationService.goBack();
            } catch (error: any) {
              console.error('[PostOptionsMenu] ❌ Delete post error:', {
                postId,
                url: `/posts/${postId}`,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                timestamp: new Date().toISOString(),
              });

              Alert.alert(
                t('messages.error'),
                error.response?.data?.message || t('messages.deleteError')
              );
            }
          },
        },
      ]
    );
  }, [postId, deletePostMutation, close, t]);

  const handleReport = useCallback(() => {
    close();

    Alert.alert(
      t('dialogs.reportPost.title'),
      t('dialogs.reportPost.message'),
      [
        {
          text: t('buttons.cancel'),
          style: 'cancel',
        },
        {
          text: t('buttons.report'),
          style: 'destructive',
          onPress: () => {
            // TODO: Post report API endpoint eklendiğinde buraya entegre edilecek
            console.log('[PostOptionsMenu] Report post:', postId);
            Alert.alert(t('messages.success'), t('messages.postReported'));
          },
        },
      ]
    );
  }, [postId, close, t]);

  // CRITICAL: Update seçeneği sadece experience post tipinde görünür
  const showUpdateOption = isPostOwner && postType === 'experience';

  return (
    <VStack 
      bg={isDark ? '$backgroundDark900' : '$white'} 
      pb={20}
      pt={8}
      minHeight={isPostOwner ? 200 : 120}
    >
      {/* Post Owner Actions - Sadece post sahibi görür */}
      {isPostOwner && (
        <>
          {/* Update - SADECE experience post tipinde görünür */}
          {showUpdateOption && (
            <Pressable
              onPress={handleUpdate}
              px={20}
              py={16}
              borderBottomWidth={1}
              borderColor={isDark ? '$borderDark600' : '#E9E9E9'}
            >
              <HStack alignItems="center" space="md">
                <PencilIcon width={20} height={20} color={isDark ? '#fff' : '#000'} />
                <Text
                  color={isDark ? '$textDark50' : '#000'}
                  fontSize="$md"
                  fontWeight="$medium"
                >
                  {t('menu.update')}
                </Text>
              </HStack>
            </Pressable>
          )}

          {/* Delete - Tüm post tiplerinde görünür */}
          <Pressable
            onPress={handleDelete}
            px={20}
            py={16}
            borderBottomWidth={1}
            borderColor={isDark ? '$borderDark600' : '#E9E9E9'}
          >
            <HStack alignItems="center" space="md">
              <TrashIcon width={20} height={20} color="#FF3040" />
              <Text
                color="#FF3040"
                fontSize="$md"
                fontWeight="$medium"
              >
                {t('menu.delete')}
              </Text>
            </HStack>
          </Pressable>
        </>
      )}

      {/* External Share */}
      <Pressable
        onPress={handleExternalShare}
        px={20}
        py={16}
        borderBottomWidth={1}
        borderColor={isDark ? '$borderDark600' : '#E9E9E9'}
      >
        <HStack alignItems="center" space="md">
          <ArrowTopRightOnSquareIcon width={20} height={20} color={isDark ? '#fff' : '#000'} />
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize="$md"
            fontWeight="$medium"
          >
            {t('menu.externalShare')}
          </Text>
        </HStack>
      </Pressable>

      {/* Report - Sadece post sahibi değilse göster */}
      {!isPostOwner && (
        <Pressable
          onPress={handleReport}
          px={20}
          py={16}
        >
          <HStack alignItems="center" space="md">
            <FlagIcon width={20} height={20} color="#FF3040" />
            <Text
              color="#FF3040"
              fontSize="$md"
              fontWeight="$medium"
            >
              {t('menu.report')}
            </Text>
          </HStack>
        </Pressable>
      )}
    </VStack>
  );
};
