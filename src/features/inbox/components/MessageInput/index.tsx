import React, { useState } from 'react';
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
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onAddImage,
  placeholder = 'Mesajınızı yazın...',
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && onSendMessage) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <Box
      bg={isDark ? '#1A1A1A' : '#FFFFFF'}
      borderTopWidth={1}
      borderColor={isDark ? '#333' : '#E9E9E9'}
      px="$4"
      py="$3"
    >
      <HStack space="sm" alignItems="center">
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
        >
          <InputField
            placeholder={placeholder}
            placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize={11}
            value={message}
            onChangeText={setMessage}
            multiline={false}
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

