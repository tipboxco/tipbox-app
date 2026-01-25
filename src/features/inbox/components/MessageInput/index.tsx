import React, { useState, useEffect, useRef } from 'react';
import { Keyboard } from 'react-native';
import {
  Box,
  HStack,
  Input,
  InputField,
  Pressable,
  VStack,
  Image,
  Text,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

interface SelectedImage {
  uri: string;
  type: string;
  name: string;
  fileSize?: number;
}

interface MessageInputProps {
  onSendMessage?: (message: string) => void;
  onAddImage?: () => void;
  onSendImage?: (image: SelectedImage, caption: string) => void;
  placeholder?: string;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  threadId?: string | null;
  selectedImage?: SelectedImage | null;
  onClearSelectedImage?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onAddImage,
  onSendImage,
  placeholder = 'Type your message...',
  onTypingStart,
  onTypingStop,
  threadId,
  selectedImage,
  onClearSelectedImage,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);
  
  // Görsel seçildiğinde input'u temizle ve placeholder'ı değiştir
  useEffect(() => {
    if (selectedImage) {
      setMessage('');
    }
  }, [selectedImage]);

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
    // Eğer görsel seçiliyse, görsel + caption gönder
    if (selectedImage && onSendImage) {
      const caption = message.trim();
      onSendImage(selectedImage, caption);
      setMessage(''); // Input'u temizle
      Keyboard.dismiss(); // Klavyeyi kapat
      return;
    }
    
    // Normal mesaj gönder
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

  const canSend = selectedImage || message.trim();
  const sendButtonBg = canSend ? '#6366F1' : (isDark ? '#2A2A2A' : '#F2F2F2');
  const sendButtonColor = canSend ? '#FFFFFF' : (isDark ? '#8C8C8C' : '#8C8C8C');

  return (
    <Box
      bg={isDark ? '#1A1A1A' : '#FFFFFF'}
      borderTopWidth={1}
      borderColor={isDark ? '#333' : '#E9E9E9'}
      px="$4"
      py="$2"
      zIndex={1004}
      elevation={1004}
      position="relative"
    >
      {/* Seçilen Görsel Preview */}
      {selectedImage && (
        <VStack space="xs" mb="$2">
          <Box position="relative" width="100%" maxHeight={200} borderRadius={12} overflow="hidden">
            <Image
              source={{ uri: selectedImage.uri }}
              alt="Selected image"
              width="100%"
              height={200}
              resizeMode="cover"
            />
            <Pressable
              position="absolute"
              top={8}
              right={8}
              width={32}
              height={32}
              borderRadius={16}
              bg="rgba(0, 0, 0, 0.6)"
              alignItems="center"
              justifyContent="center"
              onPress={onClearSelectedImage}
            >
              <Feather name="x" size={18} color="#FFFFFF" />
            </Pressable>
          </Box>
        </VStack>
      )}

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
            placeholder={selectedImage ? 'Add a caption...' : placeholder}
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
          bg={sendButtonBg}
          alignItems="center"
          justifyContent="center"
          disabled={!canSend}
        >
          <Feather
            name="send"
            size={18}
            color={sendButtonColor}
          />
        </Pressable>
      </HStack>
    </Box>
  );
};

export default MessageInput;

