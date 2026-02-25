import React, { useCallback } from 'react';
import { VStack, HStack, Text, Pressable } from '@gluestack-ui/themed';
import {
  ArrowTopRightOnSquareIcon,
  FlagIcon,
  PencilIcon,
  TrashIcon,
} from 'react-native-heroicons/outline';
import { Alert, Share } from 'react-native';
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
        : `Check out this post on Tipbox!`;
      
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
      // Experience post için: SelectExperienceForUpdateScreen'e yönlendir
      // Bu ekranda kullanıcı experience post'unu seçecek ve ardından update oluşturacak
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'SelectExperienceForUpdateScreen',
        params: {
          product: postContextType === 'product' && postContextId ? {
            id: postContextId,
            name: '', // SelectExperience screen'de post detayından alınacak
          } : undefined,
        },
      });
    } else {
      // Diğer post tipleri için update özelliği yok
      // Bu kod bloğuna normalde ulaşılmamalı (showUpdateOption = false)
      Alert.alert('Info', 'Update feature is only available for experience posts.');
    }
  }, [postId, postType, postContextType, postContextId, close]);

  const handleDelete = useCallback(() => {
    closeBottomSheet();
    
    console.log('[PostOptionsMenu] 🗑️ Delete button clicked for post:', postId);
    
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            console.log('[PostOptionsMenu] ❌ Delete cancelled by user');
          },
        },
        {
          text: 'Delete',
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
              
              Alert.alert('Success', 'Post deleted successfully.');
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
                'Error',
                error.response?.data?.message || 'An error occurred while deleting the post.'
              );
            }
          },
        },
      ]
    );
  }, [postId, deletePostMutation, close]);

  const handleReport = useCallback(() => {
    close();
    
    Alert.alert(
      'Report Post',
      'Are you sure you want to report this post?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            // TODO: Post report API endpoint eklendiğinde buraya entegre edilecek
            console.log('[PostOptionsMenu] Report post:', postId);
            Alert.alert('Success', 'Post reported. Thank you for your review.');
          },
        },
      ]
    );
  }, [postId, close]);

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
                  Güncelle
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
                Sil
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
            Dışarıda Paylaş
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
              Raporla
            </Text>
          </HStack>
        </Pressable>
      )}
    </VStack>
  );
};
