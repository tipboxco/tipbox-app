import React, { useMemo, useState, useCallback, useRef } from 'react';
import { ImageSourcePropType, TextInput, Alert, View, StyleSheet, Platform } from 'react-native';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '@/src/hooks/useColorMode';
import { CachedImage } from '@/src/components/CachedImage';
import { TrashIcon, HeartIcon, PencilIcon, ArrowUturnLeftIcon } from 'react-native-heroicons/outline';
import { HeartIcon as HeartIconSolid } from 'react-native-heroicons/solid';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
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
  replyContext?: {
    userName: string;
    onPress?: () => void;
  };
}

const CommentsCardInner: React.FC<CommentsCardProps> = ({
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
  isLiked = false,
  onDelete,
  onLike,
  onUnlike,
  onEdit,
  replyContext,
}) => {
  const { t } = useTranslation('common');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editText, setEditText] = useState(content);

  // Cooldown ref - çift tıklamayı önle (state değil, re-render tetiklemesin)
  const likeCooldownRef = useRef(false);

  // Swipe gesture için shared value
  const translateX = useSharedValue(0);
  const ACTION_WIDTH = 70; // Her buton için genişlik
  const SWIPE_THRESHOLD = -50; // Swipe'ın geçerli olması için minimum mesafe

  // Avatar source - CachedImage'ın kendi error/placeholder mekanizmasına güven
  const avatarSource = avatar || DEFAULT_USER_AVATAR;

  // Metin uzunluğuna göre basit truncation kontrolü
  const shouldTruncate = useMemo(() => content.length > 160, [content]);

  // Kullanıcının kendi yorumu mu kontrolü
  const isOwnComment = useMemo(() => {
    return commentId && userId && currentUserId && userId === currentUserId;
  }, [commentId, userId, currentUserId]);

  // Swipe'ı kapat - smooth animasyon ile
  const closeSwipe = useCallback(() => {
    'worklet';
    translateX.value = withSpring(0, {
      damping: 25,
      stiffness: 400,
      mass: 0.8,
      overshootClamping: false,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    });
  }, [translateX]);

  // Kaç tane action var (edit + delete)
  const numActions = (onEdit ? 1 : 0) + (onDelete ? 1 : 0);
  const maxSwipe = -(ACTION_WIDTH * numActions);

  // Tap gesture - açıkken content'e dokunulduğunda kapat
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onStart(() => {
      if (translateX.value !== 0) {
        translateX.value = withSpring(0, {
          damping: 25,
          stiffness: 400,
          mass: 0.8,
          overshootClamping: false,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
        });
      }
    });

  // Pan gesture (Reanimated v3 API)
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // 10px'den fazla kaydırınca aktif ol
    .failOffsetY([-10, 10]) // Dikey scroll ile çakışma olmasın
    .onUpdate((event) => {
      // Sadece sola kaydırmaya izin ver ve max genişliği sınırla
      const newValue = event.translationX;

      // Sola kaydırma (negatif değerler) ve sağa kaydırmayı engelle
      if (newValue > 0) {
        translateX.value = 0;
      } else if (newValue < maxSwipe) {
        translateX.value = maxSwipe;
      } else {
        translateX.value = newValue;
      }
    })
    .onEnd((event) => {
      // Hızlı swipe veya threshold'u geçtiyse aç, değilse kapat
      const springConfig = {
        damping: 25,
        stiffness: 400,
        mass: 0.8,
        overshootClamping: false,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      };

      if (event.translationX < SWIPE_THRESHOLD || event.velocityX < -500) {
        translateX.value = withSpring(maxSwipe, springConfig);
      } else {
        translateX.value = withSpring(0, springConfig);
      }
    });

  // Gesture'ları birleştir - hem tap hem pan çalışsın
  const composedGesture = Gesture.Race(tapGesture, panGesture);

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Delete handler
  const handleDelete = useCallback(() => {
    if (!commentId || !postId || !onDelete) return;
    closeSwipe(); // Swipe'ı kapat
    Alert.alert(
      t('dialogs.deleteComment.title'),
      t('dialogs.deleteComment.message'),
      [
        {
          text: t('buttons.cancel'),
          style: 'cancel',
        },
        {
          text: t('buttons.delete'),
          style: 'destructive',
          onPress: () => onDelete(commentId, postId),
        },
      ]
    );
  }, [commentId, postId, onDelete, t, closeSwipe]);

  // Like handler - NO optimistic update, just call API
  const handleLike = useCallback(() => {
    if (!commentId || !postId) return;
    // Cooldown ile çift tıklama engeli (re-render tetiklemez)
    if (likeCooldownRef.current) return;
    likeCooldownRef.current = true;
    setTimeout(() => { likeCooldownRef.current = false; }, 1000);

    // Swipe açıksa kapat
    if (translateX.value !== 0) {
      closeSwipe();
    }

    if (isLiked) {
      onUnlike?.(commentId, postId);
    } else {
      onLike?.(commentId, postId);
    }
  }, [commentId, postId, isLiked, onLike, onUnlike, translateX, closeSwipe]);

  // Edit handlers
  const handleEditStart = useCallback(() => {
    closeSwipe(); // Swipe'ı kapat
    setIsEditMode(true);
    setEditText(content);
  }, [content, closeSwipe]);

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


  const CommentContent = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
          borderBottomColor: isDark ? '#2A2A2A' : '#E9E9E9',
        }
      ]}
    >
        {/* Reply context header */}
        {replyContext && (
          <Pressable
            onPress={replyContext.onPress}
            disabled={!replyContext.onPress}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 4 }}
          >
            <ArrowUturnLeftIcon width={10} height={10} color={isDark ? '#666666' : '#AAAAAA'} />
            <Text color={isDark ? '#666666' : '#AAAAAA'} fontSize={10} fontWeight="$medium">
              {t('comments.replyTo', { name: replyContext.userName })}
            </Text>
          </Pressable>
        )}
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
        />

        {/* Comment Content */}
        <VStack flex={1} space="xs">
          {/* Name & Title */}
          {userTitle ? (
            <VStack space="xs">
              <HStack alignItems="center" justifyContent="space-between">
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$xs"
                  fontWeight="$bold"
                >
                  {userName}
                </Text>
                <Text
                  color={isDark ? '#AAAAAA' : '#8C8C8C'}
                  fontSize="$xs"
                  fontWeight="$medium"
                >
                  {timeAgo}
                </Text>
              </HStack>
              <Text
                color={isDark ? '#AAAAAA' : '#8C8C8C'}
                fontSize="$xs"
                fontWeight="$medium"
                numberOfLines={1}
              >
                {userTitle}
              </Text>
            </VStack>
          ) : (
            <HStack alignItems="center" space="xs" justifyContent="space-between">
              <Text
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize="$sm"
                fontWeight="$bold"
              >
                {userName}
              </Text>
              <Text
                color={isDark ? '#AAAAAA' : '#8C8C8C'}
                fontSize="$xs"
                fontWeight="$medium"
              >
                {timeAgo}
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
                    disabled={!editText.trim() || editText.trim() === content}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      backgroundColor: editText.trim() && editText.trim() !== content
                        ? '#6366F1'
                        : isDark ? '#2A2A2A' : '#E5E5E5',
                      opacity: editText.trim() && editText.trim() !== content ? 1 : 0.5,
                    }}
                  >
                    <Text
                      color={editText.trim() && editText.trim() !== content ? '#FFFFFF' : (isDark ? '#666666' : '#999999')}
                      fontSize={11}
                      fontWeight="$medium"
                    >
                      {t('buttons.save')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleEditCancel}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      backgroundColor: 'transparent',
                    }}
                  >
                    <Text
                      color={isDark ? '#AAAAAA' : '#8C8C8C'}
                      fontSize={11}
                      fontWeight="$medium"
                    >
                      {t('buttons.cancel')}
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
                      {isExpanded ? t('menu.showLess') : t('menu.showMore')}
                    </Text>
                  </Pressable>
                )}
              </>
            )}

            {/* Like Button */}
            <HStack alignItems="center" space="xs" mt="$1">
              <Pressable
                onPress={handleLike}
                disabled={!onLike || !onUnlike}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  opacity: (!onLike || !onUnlike) ? 0.5 : 1,
                  paddingVertical: 4,
                  paddingHorizontal: 4,
                }}
              >
                {isLiked ? (
                  <HeartIconSolid width={18} height={18} color="#FF3040" />
                ) : (
                  <HeartIcon width={18} height={18} color={isDark ? '#AAAAAA' : '#8C8C8C'} />
                )}
                <Text
                  color={isLiked ? '#FF3040' : (isDark ? '#8C8C8C' : '#8C8C8C')}
                  fontSize={11}
                  fontWeight="$medium"
                >
                  {likesCount > 0 ? likesCount : t('buttons.like')}
                </Text>
              </Pressable>
            </HStack>
          </VStack>
        </VStack>
      </HStack>
    </View>
  );

  // Swipeable container sadece kendi yorumlarında aktif
  if (isOwnComment && !isEditMode && (onEdit || onDelete)) {
    return (
      <View style={styles.swipeContainer}>
        {/* Action Buttons (arkada, sağda) */}
        <View style={styles.actionsContainer}>
          {onEdit && (
            <Pressable
              onPress={handleEditStart}
              style={[
                styles.actionButton,
                { backgroundColor: isDark ? '#3A3A3A' : '#E5E5E5', width: ACTION_WIDTH },
              ]}
            >
              <PencilIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
              <Text
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={11}
                fontWeight="$medium"
                mt={4}
              >
                {t('buttons.edit')}
              </Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              onPress={handleDelete}
              style={[
                styles.actionButton,
                { backgroundColor: '#FF3040', width: ACTION_WIDTH },
              ]}
            >
              <TrashIcon width={20} height={20} color="#FFFFFF" />
              <Text
                color="#FFFFFF"
                fontSize={11}
                fontWeight="$medium"
                mt={4}
              >
                {t('buttons.delete')}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Swipeable Content */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.swipeableContent, animatedStyle]}>
            {CommentContent}
          </Animated.View>
        </GestureDetector>
      </View>
    );
  }

  return CommentContent;
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#E9E9E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  swipeContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  swipeableContent: {
    backgroundColor: 'transparent',
  },
});

const CommentsCard = React.memo(CommentsCardInner);
export default CommentsCard;
