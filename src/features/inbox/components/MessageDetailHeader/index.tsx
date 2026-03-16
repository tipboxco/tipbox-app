import React, { useState, useRef, useMemo, useCallback } from 'react';
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
import { Modal, Dimensions, Pressable as RNPressable } from 'react-native';
import { View } from 'react-native';
import {
  BellIcon,
  BellSlashIcon,
} from 'react-native-heroicons/outline';

interface MessageDetailHeaderProps {
  senderName: string;
  senderTitle: string;
  senderAvatar: any;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  onAvatarPress?: () => void;
  onShare?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  onMute?: () => void;
  onUnmute?: () => void;
  isMuted?: boolean;
  recipientUserId?: string;
}

export const MessageDetailHeader: React.FC<MessageDetailHeaderProps> = ({
  senderName,
  senderTitle,
  senderAvatar,
  onBackPress,
  onMenuPress,
  onAvatarPress,
  onShare,
  onBlock,
  onReport,
  onMute,
  onUnmute,
  isMuted = false,
  recipientUserId,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuTriggerRef = useRef<View>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

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

          {/* Menü Butonu */}
          <Box position="relative">
            <View ref={menuTriggerRef} collapsable={false}>
              <Pressable onPress={() => {
                if (recipientUserId && menuTriggerRef.current) {
                  // Butonun pozisyonunu ölç ve menu pozisyonunu hesapla
                  menuTriggerRef.current.measureInWindow((x, y, width, height) => {
                    const screenWidth = Dimensions.get('window').width;
                    const menuWidth = 140;
                    // Butonun sağ altında açılacak: right = screenWidth - x - width, top = y + height + 4
                    const right = Math.max(12, screenWidth - x - width);
                    const top = y + height + 4;
                    setMenuPosition({ top, right });
                    setIsMenuOpen(true);
                  });
                } else if (onMenuPress) {
                  onMenuPress();
                }
              }}>
                <Feather
                  name="more-vertical"
                  size={20}
                  color={isDark ? '#FFFFFF' : '#000000'}
                />
              </Pressable>
            </View>
          </Box>
          
          {/* Dropdown Menu - Modal içinde */}
          {recipientUserId && (
            <Modal
              visible={isMenuOpen}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setIsMenuOpen(false)}
            >
              <RNPressable
                style={{ flex: 1 }}
                onPress={() => setIsMenuOpen(false)}
              />
              {/* Menu - Butonun sağ altında */}
              <Box
                position="absolute"
                top={menuPosition.top}
                right={menuPosition.right}
                width={140}
                bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                borderRadius={16}
                shadowColor="#000"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.25}
                shadowRadius={8}
                elevation={10}
                overflow="hidden"
              >
                {isMuted ? (
                  <Pressable
                    onPress={() => {
                      setIsMenuOpen(false);
                      if (onUnmute) onUnmute();
                    }}
                    px={16}
                    py={12}
                  >
                    <HStack alignItems="center" space="md">
                      <BellIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                      <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize="$md"
                        fontWeight="$medium"
                      >
                        Unmute
                      </Text>
                    </HStack>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => {
                      setIsMenuOpen(false);
                      if (onMute) onMute();
                    }}
                    px={16}
                    py={12}
                  >
                    <HStack alignItems="center" space="md">
                      <BellSlashIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                      <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize="$md"
                        fontWeight="$medium"
                      >
                        Mute
                      </Text>
                    </HStack>
                  </Pressable>
                )}
              </Box>
            </Modal>
          )}
        </HStack>
      </Box>

    </VStack>
  );
};

export default MessageDetailHeader;

