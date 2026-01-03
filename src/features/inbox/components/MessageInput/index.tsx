import React, { useState, useEffect, useRef } from 'react';
import { Keyboard } from 'react-native';
import {
  Box,
  HStack,
  Input,
  InputField,
  Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

interface MessageInputProps {
  onSendMessage?: (message: string) => void;
  onAddImage?: () => void;
  placeholder?: string;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  threadId?: string | null;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onAddImage,
  placeholder = 'Mesajınızı yazın...',
  onTypingStart,
  onTypingStop,
  threadId,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  // Typing indicator logic
  useEffect(() => {
    if (message.trim() && threadId) {
      const now = Date.now();
      
      // İlk karakter yazıldığında typing başlat
      if (now - lastTypingTimeRef.current > 1000) {
        onTypingStart?.();
        lastTypingTimeRef.current = now;
      }

      // Mevcut timeout'u temizle
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // 3 saniye sonra typing durdur
      typingTimeoutRef.current = setTimeout(() => {
        onTypingStop?.();
      }, 3000);
    } else {
      // Mesaj boşsa typing durdur
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onTypingStop?.();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, threadId, onTypingStart, onTypingStop]);

  const handleSend = () => {
    if (message.trim() && onSendMessage) {
      // Typing'i durdur
      onTypingStop?.();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      const messageToSend = message.trim();
      setMessage(''); // Input'u temizle
      Keyboard.dismiss(); // Klavyeyi kapat
      
      // Mesajı gönder
      onSendMessage(messageToSend);
    }
  };

  return (
    <Box
      bg={isDark ? '#1A1A1A' : '#FFFFFF'}
      borderTopWidth={1}
      borderColor={isDark ? '#333' : '#E9E9E9'}
      px="$4"
      py="$3"
      zIndex={1001}
      elevation={1001}
      position="relative"
    >
      <HStack space="sm" alignItems="center" justifyContent="center">
        {/* Görsel Ekleme Butonu */}
        <Pressable
          onPress={onAddImage}
          width={40}
          height={40}
          borderRadius={20}
          bg={isDark ? '#2A2A2A' : '#F2F2F2'}
          alignItems="center"
          justifyContent="center"
        >
          <Feather
            name="image"
            size={20}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </Pressable>

        {/* Mesaj Input */}
        <Input
          flex={1}
          bg={isDark ? '#2A2A2A' : '#F2F2F2'}
          borderWidth={0}
          borderRadius={20}
          height={40}
          alignItems="center"
          justifyContent="center"
        >
          <InputField
            placeholder={placeholder}
            placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize={11}
            value={message}
            onChangeText={setMessage}
            multiline={false}
            style={{ textAlignVertical: 'center' }}
          />
        </Input>

        {/* Gönder Butonu */}
        <Pressable
          onPress={handleSend}
          width={40}
          height={40}
          borderRadius={20}
          bg={message.trim() ? '#6366F1' : (isDark ? '#2A2A2A' : '#F2F2F2')}
          alignItems="center"
          justifyContent="center"
          disabled={!message.trim()}
        >
          <Feather
            name="send"
            size={18}
            color={message.trim() ? '#FFFFFF' : (isDark ? '#8C8C8C' : '#8C8C8C')}
          />
        </Pressable>
      </HStack>
    </Box>
  );
};

export default MessageInput;

