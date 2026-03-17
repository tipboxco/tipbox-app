import React from 'react';
import {
  Box,
  HStack,
  Text,
  Pressable,
  VStack,
  Image,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { toImageSource } from '@/src/utils';

interface MessageDetailHeaderProps {
  senderName: string;
  senderTitle: string;
  senderAvatar: any;
  onBackPress?: () => void;
  onAvatarPress?: () => void;
}

export const MessageDetailHeader: React.FC<MessageDetailHeaderProps> = ({
  senderName,
  senderTitle,
  senderAvatar,
  onBackPress,
  onAvatarPress,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <VStack
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      borderBottomWidth={1}
      borderColor={isDark ? '#333' : '#E9E9E9'}
      position="relative"
      zIndex={1000}
    >
      {/* Header Section */}
      <Box
        px="$4"
        py="$2"
        minHeight={56}
        justifyContent="center"
        position="relative"
      >
        <HStack space="md" alignItems="center" justifyContent="space-between">
          {/* Geri Butonu */}
          <Pressable onPress={onBackPress}>
            <Feather
              name="arrow-left"
              size={22}
              color={isDark ? '#FFFFFF' : '#000000'}
            />
          </Pressable>

          {/* Kullanıcı Bilgisi - Orta */}
          <Pressable
            flex={1}
            onPress={onAvatarPress}
            disabled={!onAvatarPress}
          >
            <HStack
              space="sm"
              alignItems="center"
              justifyContent="center"
              px="$2"
            >
              {senderAvatar ? (
                <>
                  <Image
                    source={
                      toImageSource(senderAvatar) ||
                      require('@/assets/avatar/default-useravatar.png')
                    }
                    alt={senderName}
                    width={48}
                    height={48}
                    borderRadius={16}
                  />
                  <VStack flex={1} space="xs">
                    <Text
                      color={isDark ? '#FFFFFF' : '#000000'}
                      fontSize={12}
                      fontWeight="$semibold"
                      numberOfLines={1}
                    >
                      {senderName}
                    </Text>
                    {senderTitle ? (
                      <Text
                        color={isDark ? '#8C8C8C' : '#8C8C8C'}
                        fontSize={9}
                        fontWeight="$normal"
                        numberOfLines={1}
                      >
                        {senderTitle}
                      </Text>
                    ) : null}
                  </VStack>
                </>
              ) : (
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={14}
                  fontWeight="$semibold"
                  numberOfLines={1}
                >
                  {senderName}
                </Text>
              )}
            </HStack>
          </Pressable>

          {/* Sağ boşluk (header dengeleme) */}
          <Box width={22} />
        </HStack>
      </Box>

    </VStack>
  );
};

export default MessageDetailHeader;

