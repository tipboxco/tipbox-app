import React, { useMemo, useState, useCallback } from 'react';
import { ImageSourcePropType, TextInput, Alert } from 'react-native';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { CachedImage } from '@/src/components/CachedImage';
import { TrashIcon, HeartIcon, PencilIcon } from 'react-native-heroicons/outline';
import { HeartIcon as HeartIconSolid } from 'react-native-heroicons/solid';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için

// Default user avatar
const DEFAULT_USER_AVATAR = require('@/assets/avatar/default-useravatar.png');

export interface CommentsCardProps {
  id?: string;
  userName: string;
  userTitle: string;
  avatar: ImageSourcePropType;
  timeAgo: string;
  content: string;
  commentId?: string;
  userId?: string;
  currentUserId?: string;
  postId?: string;
  likesCount?: number;
  isLiked?: boolean;
  onDelete?: (commentId: string, postId: string) => void;
  onLike?: (commentId: string, postId: string) => void;
  onUnlike?: (commentId: string, postId: string) => void;
  onEdit?: (commentId: string, postId: string, newContent: string) => void;
  isDeleting?: boolean;
  isLiking?: boolean;
  isEditing?: boolean;
}

export const CommentsCard: React.FC<CommentsCardProps> = ({
  userName,
  userTitle,
  avatar,
  timeAgo,
  content,
  commentId,
  userId,
  currentUserId,
  postId,
  likesCount = 0,
  isLiked: initialIsLiked = false,
  onDelete,
  onLike,
  onUnlike,
  onEdit,
  isDeleting = false,
  isLiking = false,
  isEditing = false,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [localLikesCount, setLocalLikesCount] = useState(likesCount);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editText, setEditText] = useState(content);
  
  // Avatar source state - görsel yüklenemezse default avatar'a geçiş için
  const [avatarSource, setAvatarSource] = useState(avatar || DEFAULT_USER_AVATAR);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const avatarLoadTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Avatar değiştiğinde state'i güncelle
  React.useEffect(() => {
    // Önceki timeout'u temizle
    if (avatarLoadTimeoutRef.current) {
      clearTimeout(avatarLoadTimeoutRef.current);
      avatarLoadTimeoutRef.current = null;
    }
    
    const newSource = avatar || DEFAULT_USER_AVATAR;
    
    // Eğer yeni source default avatar değilse, load kontrolü yap
    if (newSource !== DEFAULT_USER_AVATAR) {
      setAvatarSource(newSource);
      setIsImageLoaded(false);
      
      // 5 saniye içinde görsel yüklenmezse default avatar'a geç
      avatarLoadTimeoutRef.current = setTimeout(() => {
        setAvatarSource((currentSource: any) => {
          // Eğer hala yüklenmediyse ve source değişmediyse default avatar'a geç
          if (currentSource === newSource) {
            console.log('[CommentsCard] Avatar load timeout, using default avatar:', {
              userName,
              attemptedSource: newSource,
            });
            return DEFAULT_USER_AVATAR;
          }
          return currentSource;
        });
        setIsImageLoaded(true);
      }, 5000); // 5 saniye timeout
    } else {
      // Zaten default avatar ise direkt set et
      setAvatarSource(DEFAULT_USER_AVATAR);
      setIsImageLoaded(true);
    }
    
    return () => {
      if (avatarLoadTimeoutRef.current) {
        clearTimeout(avatarLoadTimeoutRef.current);
        avatarLoadTimeoutRef.current = null;
      }
    };
  }, [avatar, userName]);
  
  // Avatar başarıyla yüklendiğinde
  const handleAvatarLoad = useCallback(() => {
    setIsImageLoaded(true);
    // Timeout'u temizle
    if (avatarLoadTimeoutRef.current) {
      clearTimeout(avatarLoadTimeoutRef.current);
      avatarLoadTimeoutRef.current = null;
    }
  }, []);
  
  // Avatar yüklenme hatası durumunda default avatar'a geçiş
  const handleAvatarError = useCallback((error: Error) => {
    console.log('[CommentsCard] Avatar load error, using default avatar:', {
      userName,
      attemptedSource: avatarSource,
      error: error.message,
    });
    setAvatarSource(DEFAULT_USER_AVATAR);
    setIsImageLoaded(true); // Default avatar zaten yüklü sayılır
    // Timeout'u temizle
    if (avatarLoadTimeoutRef.current) {
      clearTimeout(avatarLoadTimeoutRef.current);
      avatarLoadTimeoutRef.current = null;
    }
  }, [userName, avatarSource]);

  // Metin uzunluğuna göre basit truncation kontrolü
  const shouldTruncate = useMemo(() => content.length > 160, [content]);

  // Sync with props
  React.useEffect(() => {
    setIsLiked(initialIsLiked);
  }, [initialIsLiked]);

  React.useEffect(() => {
    setLocalLikesCount(likesCount);
  }, [likesCount]);

  // Kullanıcının kendi yorumu mu kontrolü
  const isOwnComment = useMemo(() => {
    return commentId && userId && currentUserId && userId === currentUserId;
  }, [commentId, userId, currentUserId]);

  // Delete handler
  const handleDelete = useCallback(() => {
    if (!commentId || !postId || !onDelete || isDeleting) return;
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(commentId, postId),
        },
      ]
    );
  }, [commentId, postId, onDelete, isDeleting]);

  // Like handler - no optimistic update, wait for backend response
  const handleLike = useCallback(() => {
    if (!commentId || !postId || isLiking) return;
    
    if (isLiked) {
      onUnlike?.(commentId, postId);
    } else {
      onLike?.(commentId, postId);
    }
  }, [commentId, postId, isLiked, isLiking, onLike, onUnlike]);

  // Edit handlers
  const handleEditStart = useCallback(() => {
    setIsEditMode(true);
    setEditText(content);
  }, [content]);

  const handleEditCancel = useCallback(() => {
    setIsEditMode(false);
    setEditText(content);
  }, [content]);

  const handleEditSave = useCallback(() => {
    if (!commentId || !postId || !onEdit || !editText.trim() || editText.trim() === content) {
      setIsEditMode(false);
      return;
    }
    onEdit(commentId, postId, editText.trim());
    setIsEditMode(false);
  }, [commentId, postId, onEdit, editText, content]);

  return (
    <Box
      position="relative"
      borderBottomWidth={1}
      borderBottomColor="#E9E9E9"
      px={12}
      py={8}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
    >
      <HStack alignItems="flex-start" space="sm">
        {/* Avatar */}
        <CachedImage
          source={avatarSource}
          placeholder={DEFAULT_USER_AVATAR}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
          }}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="high"
          onLoadEnd={handleAvatarLoad}
          onError={handleAvatarError}
        />

        {/* Comment Content */}
        <VStack flex={1} space="xs">
          {/* Name & Title */}
          {userTitle ? (
            <VStack space="xs">
              <Text
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize="$xs"
                fontWeight="$bold"
              >
                {userName}
              </Text>
              <Text
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                fontSize="$xs"
                fontWeight="$medium"
                numberOfLines={1}
              >
                {userTitle}
              </Text>
            </VStack>
          ) : (
            <HStack alignItems="center" space="xs">
              <Text
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize="$sm"
                fontWeight="$bold"
              >
                {userName}
              </Text>
            </HStack>
          )}

          {/* Comment Text */}
          <VStack space="xs">
            {isEditMode ? (
              <VStack space="xs">
                <TextInput
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  style={{
                    color: isDark ? '#FFFFFF' : '#000000',
                    fontSize: 12,
                    lineHeight: 18,
                    backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                    borderRadius: 8,
                    padding: 8,
                    minHeight: 60,
                    maxHeight: 120,
                  }}
                  placeholderTextColor={isDark ? '#666666' : '#999999'}
                />
                <HStack space="sm" alignItems="center">
                  <Pressable
                    onPress={handleEditSave}
                    disabled={!editText.trim() || editText.trim() === content || isEditing}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      backgroundColor: editText.trim() && editText.trim() !== content && !isEditing
                        ? '#6366F1'
                        : isDark ? '#2A2A2A' : '#E5E5E5',
                      opacity: editText.trim() && editText.trim() !== content && !isEditing ? 1 : 0.5,
                    }}
                  >
                    <Text
                      color={editText.trim() && editText.trim() !== content && !isEditing ? '#FFFFFF' : (isDark ? '#666666' : '#999999')}
                      fontSize={11}
                      fontWeight="$medium"
                    >
                      Kaydet
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleEditCancel}
                    disabled={isEditing}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      backgroundColor: 'transparent',
                    }}
                  >
                    <Text
                      color={isDark ? '#8C8C8C' : '#8C8C8C'}
                      fontSize={11}
                      fontWeight="$medium"
                    >
                      İptal
                    </Text>
                  </Pressable>
                </HStack>
              </VStack>
            ) : (
              <>
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$xs"
                  lineHeight={14}
                  numberOfLines={isExpanded || !shouldTruncate ? undefined : 3}
                >
                  {content}
                </Text>

                {/* Expand / Collapse - sadece metin yeterince uzunsa göster */}
                {shouldTruncate && (
                  <Pressable
                    alignSelf="flex-start"
                    onPress={() => setIsExpanded((prev) => !prev)}
                  >
                    <Text
                      color="#829905"
                      fontSize="$xs"
                      fontWeight="$medium"
                      textDecorationLine="underline"
                    >
                      {isExpanded ? 'Daha az göster' : 'Daha fazla göster'}
                    </Text>
                  </Pressable>
                )}
              </>
            )}

            {/* Like Button - Her zaman görünür */}
            <HStack alignItems="center" space="xs" mt="$1">
              <Pressable
                onPress={handleLike}
                disabled={isLiking || !onLike || !onUnlike}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  opacity: (isLiking || !onLike || !onUnlike) ? 0.5 : 1,
                  paddingVertical: 4,
                  paddingHorizontal: 4,
                }}
              >
                {isLiked ? (
                  <HeartIconSolid width={18} height={18} color="#FF3040" />
                ) : (
                  <HeartIcon width={18} height={18} color={isDark ? '#8C8C8C' : '#8C8C8C'} />
                )}
                <Text
                  color={isLiked ? '#FF3040' : (isDark ? '#8C8C8C' : '#8C8C8C')}
                  fontSize={11}
                  fontWeight="$medium"
                >
                  {localLikesCount > 0 ? localLikesCount : 'Beğen'}
                </Text>
              </Pressable>
            </HStack>
          </VStack>
        </VStack>
      </HStack>

      {/* Time and Action Buttons */}
      <HStack
        position="absolute"
        top={8}
        right={12}
        alignItems="center"
        space="sm"
      >
        {/* Edit Button - sadece kullanıcının kendi yorumunda göster */}
        {isOwnComment && onEdit && !isEditMode && (
          <Pressable
            onPress={handleEditStart}
            disabled={isEditing}
            opacity={isEditing ? 0.5 : 1}
            p={4}
          >
            <PencilIcon
              width={16}
              height={16}
              color={isDark ? '#829905' : '#829905'}
            />
          </Pressable>
        )}
        {/* Delete Button - sadece kullanıcının kendi yorumunda göster */}
        {isOwnComment && onDelete && !isEditMode && (
          <Pressable
            onPress={handleDelete}
            disabled={isDeleting}
            opacity={isDeleting ? 0.5 : 1}
            p={4}
          >
            <TrashIcon
              width={16}
              height={16}
              color={isDark ? '#FF3040' : '#FF3040'}
            />
          </Pressable>
        )}
        <Text
          color={isDark ? '#8C8C8C' : '#8C8C8C'}
          fontSize="$xs"
          fontWeight="$medium"
        >
          {timeAgo}
        </Text>
      </HStack>
    </Box>
  );
};

export default CommentsCard;


