import React, { useState, useRef, useEffect } from 'react';
import { Platform, Keyboard } from 'react-native';
import {
  VStack,
  HStack,
  Text,
  Pressable,
  Input,
  InputField,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';

interface CommentBottomSheetProps {
  postId: string;
  onCommentSubmit: (comment: string) => void;
  isSubmitting?: boolean;
  autoFocus?: boolean; // Otomatik focus için prop
}

export const CommentBottomSheet: React.FC<CommentBottomSheetProps> = ({
  postId,
  onCommentSubmit,
  isSubmitting = false,
  autoFocus = true, // Varsayılan olarak true
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();
  const { closeBottomSheet } = useGlobalBottomSheet();
  const [commentText, setCommentText] = useState('');
  const textInputRef = useRef<any>(null);

  // Bottom sheet açıldığında input'a focus yap
  useEffect(() => {
    if (!autoFocus) {
      // autoFocus false ise, klavye zaten açık olduğu için sadece input'a focus yap
      // Bottom sheet açıldığında input'a focus yap (klavye zaten açık)
      const timer1 = setTimeout(() => {
        textInputRef.current?.focus();
      }, 50); // Bottom sheet render için kısa delay

      const timer2 = setTimeout(() => {
        textInputRef.current?.focus();
      }, 150);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }

    // autoFocus true ise, klavyeyi aç ve input'a focus yap
    // Bottom sheet açıldığında input'a hemen focus yaparak klavyeyi aç
    const timer1 = setTimeout(() => {
      textInputRef.current?.focus();
    }, 10); // Çok kısa delay - bottom sheet render için

    // Eğer ilk focus çalışmazsa, tekrar dene
    const timer2 = setTimeout(() => {
      textInputRef.current?.focus();
    }, 50);

    // Son bir deneme
    const timer3 = setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);

    // Son bir deneme daha
    const timer4 = setTimeout(() => {
      textInputRef.current?.focus();
    }, 200);

    // Son bir deneme daha
    const timer5 = setTimeout(() => {
      textInputRef.current?.focus();
    }, 400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [autoFocus]);

  const handleSubmit = () => {
    if (!commentText.trim() || isSubmitting) return;

    onCommentSubmit(commentText.trim());
    setCommentText('');
    closeBottomSheet();
  };


  return (
    <VStack flex={1} px="$4" py="$2">
      {/* Tek input ve paylaş iconu */}
      <HStack space="sm" alignItems="center" py="$2">
        <Input
          flex={1}
          bg={isDark ? '#2A2A2A' : '#F2F2F2'}
          borderWidth={0}
          borderRadius={20}
          height={40}
        >
          <InputField
            key="comment-input"
            ref={textInputRef}
            placeholder="Write a comment..."
            placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize={14}
            value={commentText}
            onChangeText={setCommentText}
            multiline={false}
          />
        </Input>

        {/* Paylaş/Send Icon */}
        <Pressable
          onPress={handleSubmit}
          width={40}
          height={40}
          borderRadius={20}
          bg={
            commentText.trim() && !isSubmitting
              ? '#6366F1'
              : isDark
              ? '#2A2A2A'
              : '#F2F2F2'
          }
          alignItems="center"
          justifyContent="center"
          disabled={!commentText.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>...</Text>
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
      </HStack>
    </VStack>
  );
};

export default CommentBottomSheet;

