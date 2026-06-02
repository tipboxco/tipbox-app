import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, InteractionManager, Keyboard, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';

interface CommentBottomSheetProps {
  postId: string;
  onCommentSubmit: (comment: string) => void;
  isSubmitting?: boolean;
  autoFocus?: boolean;
  onInputPress?: () => void;
  initialText?: string;
  replyTo?: { username: string; onCancel: () => void };
}

export const CommentBottomSheet: React.FC<CommentBottomSheetProps> = ({
  postId,
  onCommentSubmit,
  isSubmitting = false,
  autoFocus = true, // Varsayılan olarak true
  onInputPress,
  initialText = '',
  replyTo,
}) => {
  const { t } = useTranslation('post');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { closeBottomSheet } = useGlobalBottomSheet();
  const inputRef = useRef<any>(null);
  const [commentText, setCommentText] = useState(initialText);

  // initialText değiştiğinde state'i güncelle
  useEffect(() => {
    if (initialText !== undefined) {
      setCommentText(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    if (autoFocus) {
      // Wait for bottom sheet animation to complete, then focus on next frame
      const interaction = InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      });

      return () => interaction.cancel();
    }
  }, [autoFocus]);

  const handleSubmit = () => {
    if (!commentText.trim() || isSubmitting) return;

    // Klavyeyi kapat
    Keyboard.dismiss();
    
    onCommentSubmit(commentText.trim());
    setCommentText('');
    
    // Bottom sheet'i kapat (klavye zaten kapalı)
    closeBottomSheet();
  };


  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
      {replyTo && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 6,
          paddingHorizontal: 4,
          marginBottom: 6,
        }}>
          <Text style={{ fontSize: 12, color: isDark ? '#888' : '#666' }}>
            @{replyTo.username} adlı kullanıcıya yanıt
          </Text>
          <Pressable onPress={replyTo.onCancel} hitSlop={8}>
            <Feather name="x" size={14} color={isDark ? '#888' : '#666'} />
          </Pressable>
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TextInput
          ref={inputRef}
          value={commentText}
          onChangeText={setCommentText}
          placeholder={t('comments.placeholders.writeComment')}
          placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
          style={{
            flex: 1,
            height: 40,
            borderRadius: 20,
            paddingHorizontal: 12,
            backgroundColor: isDark ? '#2A2A2A' : '#F2F2F2',
            color: isDark ? '#FFFFFF' : '#000000',
            fontSize: 14,
          }}
          onFocus={() => {
            // Input'a focus olduğunda (tıklandığında) snap point'i %80'e çıkar
            if (onInputPress) {
              onInputPress();
            }
          }}
        />

        {/* Paylaş/Send Icon */}
        <Pressable
          onPress={handleSubmit}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: commentText.trim() && !isSubmitting
              ? '#6366F1'
              : isDark
              ? '#2A2A2A'
              : '#F2F2F2',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          disabled={!commentText.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <Text style={{ color: isDark ? '#8C8C8C' : '#8C8C8C' }}>...</Text>
          ) : (
            <Feather
              name="send"
              size={18}
              color={
                commentText.trim()
                  ? '#FFFFFF'
                  : isDark
                  ? '#8C8C8C'
                  : '#8C8C8C'
              }
            />
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default CommentBottomSheet;

