import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';

interface CommentBottomSheetProps {
  postId: string;
  onCommentSubmit: (comment: string) => void;
  isSubmitting?: boolean;
  autoFocus?: boolean; // Otomatik focus için prop
  onInputPress?: () => void; // Input'a tıklandığında çağrılacak callback
}

export const CommentBottomSheet: React.FC<CommentBottomSheetProps> = ({
  postId,
  onCommentSubmit,
  isSubmitting = false,
  autoFocus = true, // Varsayılan olarak true
  onInputPress,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { closeBottomSheet } = useGlobalBottomSheet();
  const inputRef = useRef<any>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (autoFocus) {
      const id = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [autoFocus]);

  const handleSubmit = () => {
    if (!commentText.trim() || isSubmitting) return;


    onCommentSubmit(commentText.trim());
    setCommentText('');
    closeBottomSheet();
  };


  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TextInput
          ref={inputRef}
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Write a comment..."
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

