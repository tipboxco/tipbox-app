import React, { useState, useRef } from 'react';
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
import { ContextMenuReanimated } from '@/src/components/PostCards/PostCard/ContextMenuReanimated';
import {
  ArrowUpTrayIcon,
  FlagIcon,
  NoSymbolIcon,
} from 'react-native-heroicons/outline';

interface MessageDetailHeaderProps {
  senderName: string;
  senderTitle: string;
  senderAvatar: any;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  onShare?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  recipientUserId?: string;
}

export const MessageDetailHeader: React.FC<MessageDetailHeaderProps> = ({
  senderName,
  senderTitle,
  senderAvatar,
  onBackPress,
  onMenuPress,
  onShare,
  onBlock,
  onReport,
  recipientUserId,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const contextMenuCloseRef = useRef<(() => void) | null>(null);

  // Menu items - only show if recipientUserId is provided (not own profile)
  const menuItems = recipientUserId ? [
    {
      label: 'Share',
      icon: <ArrowUpTrayIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />,
      onPress: () => {
        if (onShare) {
          onShare();
        }
        if (contextMenuCloseRef.current) {
          contextMenuCloseRef.current();
        }
      },
    },
    {
      label: 'Report',
      icon: <FlagIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />,
      onPress: () => {
        if (onReport) {
          onReport();
        }
        if (contextMenuCloseRef.current) {
          contextMenuCloseRef.current();
        }
      },
    },
    {
      label: 'Block',
      icon: <NoSymbolIcon width={20} height={20} color="#FF3040" />,
      onPress: () => {
        if (onBlock) {
          onBlock();
        }
        if (contextMenuCloseRef.current) {
          contextMenuCloseRef.current();
        }
      },
      color: '#FF3040',
    },
  ] : [];

  return (
    <VStack
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      borderBottomWidth={1}
      borderColor={isDark ? '#333' : '#E9E9E9'}
    >
      {/* Header Section */}
      <Box
        px="$4"
        py="$2"
        justifyContent="center"
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
          <HStack
            flex={1}
            space="sm"
            alignItems="center"
            justifyContent="center"
            px="$2"
          >
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
              <Text
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                fontSize={9}
                fontWeight="$normal"
                numberOfLines={1}
              >
                {senderTitle}
              </Text>
            </VStack>
          </HStack>

          {/* Menü Butonu */}
          {menuItems.length > 0 ? (
            <Box position="relative" zIndex={2001}>
              <ContextMenuReanimated
                menuItems={menuItems}
                onMenuStateChange={setIsContextMenuOpen}
                onCloseRef={(closeFn) => {
                  contextMenuCloseRef.current = closeFn;
                }}
              >
                <Pressable onPress={onMenuPress}>
                  <Feather
                    name="more-vertical"
                    size={20}
                    color={isDark ? '#FFFFFF' : '#000000'}
                  />
                </Pressable>
              </ContextMenuReanimated>
            </Box>
          ) : (
            <Pressable onPress={onMenuPress}>
              <Feather
                name="more-vertical"
                size={20}
                color={isDark ? '#FFFFFF' : '#000000'}
              />
            </Pressable>
          )}
        </HStack>
      </Box>

      {/* Context Menu Backdrop */}
      {isContextMenuOpen && (
        <Pressable
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={2000}
          onPress={() => {
            if (contextMenuCloseRef.current) {
              contextMenuCloseRef.current();
            }
          }}
          style={{
            backgroundColor: 'transparent',
          }}
        />
      )}
    </VStack>
  );
};

export default MessageDetailHeader;

